import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts';
import { getPlan, planFromAppleProductId } from '../_shared/plans.ts';
import { getServiceClient, requireUser } from '../_shared/supabase.ts';

type AppleVerifyResponse = {
  status: number;
  latest_receipt_info?: Array<{
    product_id?: string;
    transaction_id?: string;
    original_transaction_id?: string;
    expires_date_ms?: string;
    purchase_date_ms?: string;
  }>;
  receipt?: {
    in_app?: Array<{
      product_id?: string;
      transaction_id?: string;
      original_transaction_id?: string;
      expires_date_ms?: string;
      purchase_date_ms?: string;
    }>;
  };
};

async function verifyWithApple(receiptData: string, password: string, sandbox: boolean) {
  const url = sandbox
    ? 'https://sandbox.itunes.apple.com/verifyReceipt'
    : 'https://buy.itunes.apple.com/verifyReceipt';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      'receipt-data': receiptData,
      password,
      'exclude-old-transactions': true,
    }),
  });
  return (await res.json()) as AppleVerifyResponse;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  let userId: string;
  try {
    ({ userId } = await requireUser(req));
  } catch (res) {
    if (res instanceof Response) return res;
    return errorResponse('Unauthorized', 401);
  }

  try {
    const body = (await req.json()) as {
      receipt_data?: string;
      product_id?: string;
      transaction_id?: string;
    };

    const receiptData = body.receipt_data?.trim();
    if (!receiptData) return errorResponse('receipt_data is required');

    const sharedSecret = Deno.env.get('APPLE_IAP_SHARED_SECRET');
    if (!sharedSecret) return errorResponse('APPLE_IAP_SHARED_SECRET missing', 500);

    let apple = await verifyWithApple(receiptData, sharedSecret, false);
    // 21007 = sandbox receipt sent to production
    if (apple.status === 21007) {
      apple = await verifyWithApple(receiptData, sharedSecret, true);
    }
    if (apple.status !== 0) {
      return errorResponse(`Apple verify failed with status ${apple.status}`, 400);
    }

    const lines = apple.latest_receipt_info ?? apple.receipt?.in_app ?? [];
    const match =
      lines.find((l) =>
        body.transaction_id
          ? l.transaction_id === body.transaction_id
          : body.product_id
            ? l.product_id === body.product_id
            : true,
      ) ?? lines[0];

    if (!match?.product_id || !match.transaction_id) {
      return errorResponse('No matching Apple transaction found', 400);
    }

    const planId = planFromAppleProductId(match.product_id);
    if (!planId) {
      return errorResponse(`Unknown Apple product: ${match.product_id}`, 400);
    }
    const plan = getPlan(planId);

    const service = getServiceClient();
    const { data: existing } = await service
      .from('subscriptions')
      .select('id')
      .eq('provider_transaction_id', match.transaction_id)
      .maybeSingle();
    if (existing) {
      return jsonResponse({ ok: true, duplicate: true, subscription_id: existing.id });
    }

    const periodStart = match.purchase_date_ms
      ? new Date(Number(match.purchase_date_ms))
      : new Date();
    const periodEnd = match.expires_date_ms
      ? new Date(Number(match.expires_date_ms))
      : (() => {
          const d = new Date(periodStart);
          d.setMonth(d.getMonth() + 1);
          return d;
        })();

    const { data: subId, error } = await service.rpc('activate_plan_subscription', {
      p_user_id: userId,
      p_plan: plan.id,
      p_credits: plan.credits,
      p_provider: 'apple_iap',
      p_provider_subscription_id: match.original_transaction_id ?? match.transaction_id,
      p_provider_transaction_id: match.transaction_id,
      p_period_start: periodStart.toISOString(),
      p_period_end: periodEnd.toISOString(),
    });

    if (error) return errorResponse(error.message, 500);

    await service
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', userId);

    return jsonResponse({ ok: true, subscription_id: subId, plan_id: plan.id });
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : 'Apple verify failed', 500);
  }
});
