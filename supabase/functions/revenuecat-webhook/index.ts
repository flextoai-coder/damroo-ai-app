import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts';
import { getPlan, planFromProductId } from '../_shared/plans.ts';
import { getServiceClient } from '../_shared/supabase.ts';

/**
 * RevenueCat is the single purchase path for both the App Store (iOS) and
 * Google Play (Android) — the client only ever calls `Purchases.purchasePackage`;
 * this webhook is what actually activates/expires credits server-side.
 *
 * Configure in app.revenuecat.com → Project settings → Integrations → Webhooks:
 *   URL: <SUPABASE_URL>/functions/v1/revenuecat-webhook
 *   Authorization header value: matches REVENUECAT_WEBHOOK_AUTH_HEADER below
 */

type RevenueCatEvent = {
  id?: string;
  type?: string;
  app_user_id?: string;
  product_id?: string;
  transaction_id?: string;
  original_transaction_id?: string;
  purchased_at_ms?: number;
  expiration_at_ms?: number | null;
};

const ACTIVATION_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'PRODUCT_CHANGE',
  'UNCANCELLATION',
  'NON_RENEWING_PURCHASE',
  'SUBSCRIPTION_EXTENDED',
]);

async function expireActiveSubscription(
  service: ReturnType<typeof getServiceClient>,
  userId: string,
) {
  const { data: active } = await service
    .from('subscriptions')
    .select('id, credits_remaining')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (!active) return;

  await service
    .from('subscriptions')
    .update({ status: 'expired', credits_remaining: 0 })
    .eq('id', active.id);

  if (active.credits_remaining > 0) {
    await service.from('credit_ledger').insert({
      user_id: userId,
      subscription_id: active.id,
      delta: -active.credits_remaining,
      reason: 'expiry',
    });
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  const secret = Deno.env.get('REVENUECAT_WEBHOOK_AUTH_HEADER');
  if (secret) {
    const provided = req.headers.get('authorization') ?? '';
    if (provided !== secret) {
      return errorResponse('Unauthorized', 401);
    }
  }

  try {
    const body = (await req.json()) as { event?: RevenueCatEvent };
    const event = body.event;
    if (!event?.type) {
      return errorResponse('Missing event', 400);
    }

    if (event.type === 'TEST') {
      return jsonResponse({ ok: true, test: true });
    }

    const userId = event.app_user_id;
    if (!userId) {
      return errorResponse('Missing app_user_id in webhook payload', 400);
    }

    const service = getServiceClient();

    if (event.type === 'EXPIRATION') {
      await expireActiveSubscription(service, userId);
      return jsonResponse({ ok: true, expired: true });
    }

    if (!ACTIVATION_EVENTS.has(event.type)) {
      // CANCELLATION (still active until period end), BILLING_ISSUE, etc. — no state change.
      return jsonResponse({ ok: true, ignored: event.type });
    }

    const productId = event.product_id;
    const txnId = event.transaction_id ?? event.original_transaction_id;
    if (!productId || !txnId) {
      return errorResponse('Missing product_id / transaction_id in webhook payload', 400);
    }

    const planId = planFromProductId(productId);
    if (!planId) {
      return errorResponse(`Unknown RevenueCat product: ${productId}`, 400);
    }
    const plan = getPlan(planId);

    // Idempotency: skip if this transaction already activated a subscription.
    const { data: existing } = await service
      .from('subscriptions')
      .select('id')
      .eq('provider_transaction_id', txnId)
      .maybeSingle();
    if (existing) {
      return jsonResponse({ ok: true, duplicate: true, subscription_id: existing.id });
    }

    const periodStart = event.purchased_at_ms ? new Date(event.purchased_at_ms) : new Date();
    const periodEnd = event.expiration_at_ms
      ? new Date(event.expiration_at_ms)
      : (() => {
          const d = new Date(periodStart);
          d.setMonth(d.getMonth() + 1);
          return d;
        })();

    const { data: subId, error } = await service.rpc('activate_plan_subscription', {
      p_user_id: userId,
      p_plan: plan.id,
      p_credits: plan.credits,
      p_provider: 'revenuecat',
      p_provider_subscription_id: event.original_transaction_id ?? txnId,
      p_provider_transaction_id: txnId,
      p_period_start: periodStart.toISOString(),
      p_period_end: periodEnd.toISOString(),
    });

    if (error) return errorResponse(error.message, 500);

    // Mark onboarding complete after successful pay (safety net alongside the client call).
    await service.from('profiles').update({ onboarding_completed: true }).eq('id', userId);

    return jsonResponse({ ok: true, subscription_id: subId, plan_id: plan.id });
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : 'Webhook failed', 500);
  }
});
