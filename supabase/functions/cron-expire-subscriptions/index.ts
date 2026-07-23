import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase.ts';

/**
 * Scheduled job: expire subscriptions past period end and zero credits (no rollover).
 * Protect with CRON_SECRET header when invoked from Supabase cron / external scheduler.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST' && req.method !== 'GET') {
    return errorResponse('Method not allowed', 405);
  }

  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret) {
    const provided = req.headers.get('x-cron-secret') ?? '';
    if (provided !== cronSecret) {
      return errorResponse('Unauthorized', 401);
    }
  }

  try {
    const service = getServiceClient();
    const now = new Date().toISOString();

    const { data: expired, error: selectError } = await service
      .from('subscriptions')
      .select('id, user_id, credits_remaining')
      .eq('status', 'active')
      .lt('current_period_end', now);

    if (selectError) return errorResponse(selectError.message, 500);

    const rows = expired ?? [];
    for (const row of rows) {
      await service
        .from('subscriptions')
        .update({ status: 'expired', credits_remaining: 0 })
        .eq('id', row.id);

      if (row.credits_remaining > 0) {
        await service.from('credit_ledger').insert({
          user_id: row.user_id,
          subscription_id: row.id,
          delta: -row.credits_remaining,
          reason: 'expiry',
        });
      }
    }

    return jsonResponse({ ok: true, expired_count: rows.length });
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : 'Cron failed', 500);
  }
});
