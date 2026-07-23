-- Harden Phase 1 security advisor findings

ALTER FUNCTION public.set_updated_at() SET search_path = public;

-- Trigger-only: not callable via PostgREST RPC
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- Prefer INVOKER so RLS applies inside helper checks
CREATE OR REPLACE FUNCTION public.owns_conversation(p_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
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
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.generations g
    WHERE g.id = p_generation_id
      AND g.user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.owns_conversation(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.owns_generation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.owns_conversation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_generation(uuid) TO authenticated;

-- Public templates bucket: object URLs work without listing policy
DROP POLICY IF EXISTS storage_templates_select_public ON storage.objects;
