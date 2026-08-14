import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase.ts';

/**
 * Scheduled job: `generate-image` debits credits and flips the row to
 * 'processing' synchronously, then runs the actual provider call in the
 * background via `EdgeRuntime.waitUntil`, which returns to the client almost
 * instantly and lets `waitForGeneration` (client) poll for completion. If
 * that background task ever gets killed before finishing — a platform
 * background-task ceiling (150s on Supabase's Free plan, 400s on paid), a
 * provider hang, anything — the generation row is simply never updated: it
 * sits at 'processing' forever, with credits already debited and never
 * refunded (the client's own poll gives up after 6 minutes, but only shows
 * an error locally; it never touches the row or the credits). A row can also
 * theoretically be left at 'pending' if the process dies between the insert
 * and the debit call, so both statuses are swept.
 *
 * This sweep catches those: anything still 'pending' or 'processing' well
 * past every legitimate code path's own timeout gets marked 'failed' and
 * refunded. Protect with CRON_SECRET header when invoked from Supabase cron
 * / external scheduler, same as cron-expire-subscriptions.
 */

/** Comfortably past the client's own 6-minute poll timeout and any paid-plan background-task ceiling (400s). */
const STUCK_THRESHOLD_MS = 10 * 60_000;

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
    const cutoff = new Date(Date.now() - STUCK_THRESHOLD_MS).toISOString();

    const { data: stuck, error: selectError } = await service
      .from('generations')
      .select('id, user_id')
      .in('status', ['pending', 'processing'])
      .lt('created_at', cutoff);

    if (selectError) return errorResponse(selectError.message, 500);

    const rows = stuck ?? [];
    let refundedCount = 0;

    for (const row of rows) {
      const { data: refunded, error: refundError } = await service.rpc(
        'refund_credits_for_generation',
        { p_user_id: row.user_id, p_generation_id: row.id },
      );
      if (!refundError && refunded) refundedCount++;

      await service
        .from('generations')
        .update({
          status: 'failed',
          error_message: 'Generation timed out — credits refunded.',
        })
        .eq('id', row.id);
    }

    return jsonResponse({ ok: true, stuck_count: rows.length, refunded_count: refundedCount });
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : 'Cron failed', 500);
  }
});
