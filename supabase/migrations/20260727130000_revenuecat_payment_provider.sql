-- Purchases are now led entirely by RevenueCat (App Store + Google Play), replacing
-- the direct Razorpay + manual Apple-receipt-verification path. `payment_provider`
-- only ever needs a single value going forward.

DROP FUNCTION IF EXISTS public.activate_plan_subscription(
  uuid, public.plan_tier, integer, public.payment_provider, text, text, timestamptz, timestamptz
);

ALTER TYPE public.payment_provider RENAME TO payment_provider_old;
CREATE TYPE public.payment_provider AS ENUM ('revenuecat');

ALTER TABLE public.subscriptions
  ALTER COLUMN provider TYPE public.payment_provider
  USING ('revenuecat'::public.payment_provider);

DROP TYPE public.payment_provider_old;

CREATE OR REPLACE FUNCTION public.activate_plan_subscription(
  p_user_id uuid,
  p_plan public.plan_tier,
  p_credits integer,
  p_provider public.payment_provider,
  p_provider_subscription_id text,
  p_provider_transaction_id text,
  p_period_start timestamptz,
  p_period_end timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  UPDATE public.subscriptions
  SET status = 'expired',
      credits_remaining = 0
  WHERE user_id = p_user_id
    AND status = 'active';

  INSERT INTO public.subscriptions (
    user_id, plan, status, credits_total, credits_remaining,
    provider, provider_subscription_id, provider_transaction_id,
    current_period_start, current_period_end
  ) VALUES (
    p_user_id, p_plan, 'active', p_credits, p_credits,
    p_provider, p_provider_subscription_id, p_provider_transaction_id,
    p_period_start, p_period_end
  )
  RETURNING id INTO v_id;

  INSERT INTO public.credit_ledger (user_id, subscription_id, delta, reason)
  VALUES (p_user_id, v_id, p_credits, 'plan_grant');

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.activate_plan_subscription(
  uuid, public.plan_tier, integer, public.payment_provider, text, text, timestamptz, timestamptz
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_plan_subscription(
  uuid, public.plan_tier, integer, public.payment_provider, text, text, timestamptz, timestamptz
) TO service_role;
