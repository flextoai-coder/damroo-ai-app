import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts';
import { getPlan, type PlanId } from '../_shared/plans.ts';
import { getServiceClient } from '../_shared/supabase.ts';

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
    if (!secret) return errorResponse('RAZORPAY_WEBHOOK_SECRET missing', 500);

    const raw = await req.text();
    const signature = req.headers.get('x-razorpay-signature') ?? '';
    const expected = await hmacSha256Hex(secret, raw);
    if (signature !== expected) {
      return errorResponse('Invalid signature', 401);
    }

    const event = JSON.parse(raw) as {
      event?: string;
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            order_id?: string;
            notes?: Record<string, string>;
            status?: string;
          };
        };
        order?: {
          entity?: {
            id?: string;
            notes?: Record<string, string>;
          };
        };
      };
    };

    if (event.event !== 'payment.captured' && event.event !== 'order.paid') {
      return jsonResponse({ ok: true, ignored: event.event });
    }

    const payment = event.payload?.payment?.entity;
    const notes = payment?.notes ?? event.payload?.order?.entity?.notes ?? {};
    const userId = notes.user_id;
    const planId = notes.plan_id as PlanId | undefined;
    const txnId = payment?.id ?? event.payload?.order?.entity?.id;
    const orderId = payment?.order_id ?? event.payload?.order?.entity?.id;

    if (!userId || !planId || !txnId) {
      return errorResponse('Missing user_id / plan_id / transaction in webhook payload', 400);
    }

    const plan = getPlan(planId);
    const service = getServiceClient();

    // Idempotency: skip if this transaction already activated a sub
    const { data: existing } = await service
      .from('subscriptions')
      .select('id')
      .eq('provider_transaction_id', txnId)
      .maybeSingle();
    if (existing) {
      return jsonResponse({ ok: true, duplicate: true, subscription_id: existing.id });
    }

    const periodStart = new Date();
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const { data: subId, error } = await service.rpc('activate_plan_subscription', {
      p_user_id: userId,
      p_plan: plan.id,
      p_credits: plan.credits,
      p_provider: 'razorpay',
      p_provider_subscription_id: orderId ?? txnId,
      p_provider_transaction_id: txnId,
      p_period_start: periodStart.toISOString(),
      p_period_end: periodEnd.toISOString(),
    });

    if (error) return errorResponse(error.message, 500);

    // Mark onboarding complete after successful pay
    await service
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', userId);

    return jsonResponse({ ok: true, subscription_id: subId });
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : 'Webhook failed', 500);
  }
});
