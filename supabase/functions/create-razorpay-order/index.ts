import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts';
import { getPlan, type PlanId } from '../_shared/plans.ts';
import { requireUser } from '../_shared/supabase.ts';

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
    const { plan_id } = (await req.json()) as { plan_id?: string };
    if (!plan_id || !['starter', 'growth', 'scale'].includes(plan_id)) {
      return errorResponse('plan_id must be starter | growth | scale');
    }

    const plan = getPlan(plan_id as PlanId);
    const keyId = Deno.env.get('RAZORPAY_KEY_ID') ?? Deno.env.get('EXPO_PUBLIC_RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!keyId || !keySecret) {
      return errorResponse('Razorpay keys are not configured', 500);
    }

    const amountPaise = plan.priceInr * 100;
    const receipt = `damroo_${plan.id}_${userId.slice(0, 8)}_${Date.now()}`.slice(0, 40);

    const auth = btoa(`${keyId}:${keySecret}`);
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt,
        notes: {
          user_id: userId,
          plan_id: plan.id,
          credits: String(plan.credits),
        },
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      return errorResponse(json?.error?.description ?? `Razorpay error ${res.status}`, 502);
    }

    return jsonResponse({
      order_id: json.id,
      amount: json.amount,
      currency: json.currency,
      key_id: keyId,
      plan_id: plan.id,
      credits: plan.credits,
    });
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : 'Order create failed', 500);
  }
});
