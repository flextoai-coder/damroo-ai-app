-- Atomic credit debit / refund for Edge generate-image (service role only via SECURITY DEFINER)

CREATE OR REPLACE FUNCTION public.debit_credits_for_generation(
  p_user_id uuid,
  p_generation_id uuid,
  p_amount integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub public.subscriptions%ROWTYPE;
BEGIN
  IF p_amount IS NULL OR p_amount < 1 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  SELECT * INTO v_sub
  FROM public.subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
    AND current_period_end > now()
  ORDER BY current_period_end DESC
  FOR UPDATE
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'no_active_subscription';
  END IF;

  IF v_sub.credits_remaining < p_amount THEN
    RAISE EXCEPTION 'insufficient_credits';
  END IF;

  UPDATE public.subscriptions
  SET credits_remaining = credits_remaining - p_amount
  WHERE id = v_sub.id;

  INSERT INTO public.credit_ledger (user_id, subscription_id, delta, reason, generation_id)
  VALUES (p_user_id, v_sub.id, -p_amount, 'generation', p_generation_id);

  UPDATE public.generations
  SET credits_charged = p_amount,
      status = 'processing'
  WHERE id = p_generation_id
    AND user_id = p_user_id;

  RETURN v_sub.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_credits_for_generation(
  p_user_id uuid,
  p_generation_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gen public.generations%ROWTYPE;
  v_sub_id uuid;
BEGIN
  SELECT * INTO v_gen
  FROM public.generations
  WHERE id = p_generation_id
    AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_gen.credits_charged < 1 THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.credit_ledger
    WHERE generation_id = p_generation_id
      AND reason = 'adjustment'
      AND delta > 0
  ) THEN
    RETURN false;
  END IF;

  SELECT subscription_id INTO v_sub_id
  FROM public.credit_ledger
  WHERE generation_id = p_generation_id
    AND reason = 'generation'
    AND delta < 0
  LIMIT 1;

  IF v_sub_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.subscriptions
  SET credits_remaining = credits_remaining + v_gen.credits_charged
  WHERE id = v_sub_id;

  INSERT INTO public.credit_ledger (user_id, subscription_id, delta, reason, generation_id)
  VALUES (p_user_id, v_sub_id, v_gen.credits_charged, 'adjustment', p_generation_id);

  RETURN true;
END;
$$;

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

REVOKE ALL ON FUNCTION public.debit_credits_for_generation(uuid, uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refund_credits_for_generation(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.activate_plan_subscription(uuid, public.plan_tier, integer, public.payment_provider, text, text, timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.debit_credits_for_generation(uuid, uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_credits_for_generation(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.activate_plan_subscription(uuid, public.plan_tier, integer, public.payment_provider, text, text, timestamptz, timestamptz) TO service_role;
