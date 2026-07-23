-- Damroo AI Phase 1: core schema, RLS, storage buckets
-- Applied via Supabase MCP apply_migration (keep in sync with remote)

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE public.plan_tier AS ENUM ('starter', 'growth', 'scale');
CREATE TYPE public.subscription_status AS ENUM ('active', 'expired', 'cancelled', 'past_due');
CREATE TYPE public.payment_provider AS ENUM ('razorpay', 'apple_iap');
CREATE TYPE public.credit_reason AS ENUM ('plan_grant', 'generation', 'adjustment', 'expiry');
CREATE TYPE public.generation_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE public.image_quality AS ENUM ('2K', '4K');
CREATE TYPE public.chat_role AS ENUM ('user', 'assistant', 'system');

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text,
  email text,
  avatar_url text,
  business_name text,
  website text,
  industry text,
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.email,
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- conversations
-- ---------------------------------------------------------------------------
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX conversations_user_id_created_at_idx
  ON public.conversations (user_id, created_at DESC);

CREATE TRIGGER conversations_set_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- templates (owner-managed; clients read published only)
-- ---------------------------------------------------------------------------
CREATE TABLE public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  industry text NOT NULL,
  preview_storage_path text NOT NULL,
  base_prompt text NOT NULL,
  default_aspect_ratio text NOT NULL DEFAULT '1:1',
  default_quality public.image_quality NOT NULL DEFAULT '2K',
  is_published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX templates_industry_published_idx
  ON public.templates (industry, is_published, sort_order);

CREATE TRIGGER templates_set_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------------
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  plan public.plan_tier NOT NULL,
  status public.subscription_status NOT NULL DEFAULT 'active',
  provider public.payment_provider NOT NULL,
  provider_subscription_id text,
  provider_transaction_id text,
  credits_total integer NOT NULL CHECK (credits_total >= 0),
  credits_remaining integer NOT NULL CHECK (credits_remaining >= 0),
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscriptions_credits_remaining_lte_total
    CHECK (credits_remaining <= credits_total),
  CONSTRAINT subscriptions_period_valid
    CHECK (current_period_end > current_period_start)
);

CREATE UNIQUE INDEX subscriptions_one_active_per_user
  ON public.subscriptions (user_id)
  WHERE status = 'active';

CREATE INDEX subscriptions_user_id_status_idx
  ON public.subscriptions (user_id, status);

CREATE TRIGGER subscriptions_set_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- generations
-- ---------------------------------------------------------------------------
CREATE TABLE public.generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.conversations (id) ON DELETE SET NULL,
  template_id uuid REFERENCES public.templates (id) ON DELETE SET NULL,
  prompt text NOT NULL,
  enhanced_prompt text,
  aspect_ratio text NOT NULL DEFAULT '1:1',
  quality public.image_quality NOT NULL DEFAULT '2K',
  image_count integer NOT NULL DEFAULT 1 CHECK (image_count >= 1 AND image_count <= 15),
  reference_image_paths text[] NOT NULL DEFAULT '{}',
  status public.generation_status NOT NULL DEFAULT 'pending',
  error_message text,
  credits_charged integer NOT NULL DEFAULT 0 CHECK (credits_charged >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX generations_user_id_created_at_idx
  ON public.generations (user_id, created_at DESC);

CREATE INDEX generations_conversation_id_idx
  ON public.generations (conversation_id);

CREATE INDEX generations_status_idx
  ON public.generations (status);

CREATE TRIGGER generations_set_updated_at
  BEFORE UPDATE ON public.generations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- generation_assets
-- ---------------------------------------------------------------------------
CREATE TABLE public.generation_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id uuid NOT NULL REFERENCES public.generations (id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  public_url text,
  width integer,
  height integer,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX generation_assets_generation_id_sort_idx
  ON public.generation_assets (generation_id, sort_order);

-- ---------------------------------------------------------------------------
-- chat_messages
-- ---------------------------------------------------------------------------
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role public.chat_role NOT NULL,
  content text NOT NULL DEFAULT '',
  generation_id uuid REFERENCES public.generations (id) ON DELETE SET NULL,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX chat_messages_conversation_id_created_at_idx
  ON public.chat_messages (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- credit_ledger
-- ---------------------------------------------------------------------------
CREATE TABLE public.credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES public.subscriptions (id) ON DELETE CASCADE,
  delta integer NOT NULL,
  reason public.credit_reason NOT NULL,
  generation_id uuid REFERENCES public.generations (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT credit_ledger_delta_nonzero CHECK (delta <> 0)
);

-- Idempotent refund/spend per generation+reason (nullable generation allowed multiple times)
CREATE UNIQUE INDEX credit_ledger_generation_reason_unique
  ON public.credit_ledger (generation_id, reason)
  WHERE generation_id IS NOT NULL;

CREATE INDEX credit_ledger_user_id_created_at_idx
  ON public.credit_ledger (user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- captions
-- ---------------------------------------------------------------------------
CREATE TABLE public.captions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id uuid NOT NULL REFERENCES public.generations (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX captions_generation_id_idx
  ON public.captions (generation_id);

CREATE INDEX captions_user_id_created_at_idx
  ON public.captions (user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Helper: owns conversation
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.owns_conversation(p_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = p_conversation_id
      AND c.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_generation(p_generation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.generations g
    WHERE g.id = p_generation_id
      AND g.user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS enable
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.captions ENABLE ROW LEVEL SECURITY;

-- profiles: users manage own row
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- conversations
CREATE POLICY conversations_select_own ON public.conversations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY conversations_insert_own ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY conversations_update_own ON public.conversations
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY conversations_delete_own ON public.conversations
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- templates: published readable by authenticated; writes via service role only
CREATE POLICY templates_select_published ON public.templates
  FOR SELECT TO authenticated
  USING (is_published = true);

-- subscriptions: read-only for clients (mutations via Edge Functions / service role)
CREATE POLICY subscriptions_select_own ON public.subscriptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- generations: read-only for clients
CREATE POLICY generations_select_own ON public.generations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- generation_assets: read if parent generation owned
CREATE POLICY generation_assets_select_own ON public.generation_assets
  FOR SELECT TO authenticated
  USING (public.owns_generation(generation_id));

-- chat_messages
CREATE POLICY chat_messages_select_own ON public.chat_messages
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY chat_messages_insert_own ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.owns_conversation(conversation_id)
  );

-- credit_ledger: read-only for clients
CREATE POLICY credit_ledger_select_own ON public.credit_ledger
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- captions
CREATE POLICY captions_select_own ON public.captions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY captions_insert_own ON public.captions
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.owns_generation(generation_id)
  );

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'avatars',
    'avatars',
    false,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']::text[]
  ),
  (
    'references',
    'references',
    false,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']::text[]
  ),
  (
    'generations',
    'generations',
    false,
    20971520,
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
  ),
  (
    'templates',
    'templates',
    true,
    20971520,
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
  );

-- Path convention: {user_id}/... for private user buckets
CREATE POLICY storage_avatars_select_own ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY storage_avatars_insert_own ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY storage_avatars_update_own ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY storage_avatars_delete_own ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY storage_references_select_own ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'references'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY storage_references_insert_own ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'references'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY storage_references_update_own ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'references'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'references'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY storage_references_delete_own ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'references'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- generations bucket: users can read own paths; writes via service role (Edge Functions)
CREATE POLICY storage_generations_select_own ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'generations'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- templates bucket: public read (bucket is public); authenticated can also select
CREATE POLICY storage_templates_select_public ON storage.objects
  FOR SELECT TO authenticated, anon
  USING (bucket_id = 'templates');
