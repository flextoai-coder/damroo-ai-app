-- "My Uploads" library: persists reference images a user has uploaded so they
-- can be browsed and reused across generations, not just the chat message
-- they were originally attached to. Files themselves already live in the
-- existing private `references` storage bucket (path: {user_id}/...); this
-- table just tracks which paths belong to the library.
CREATE TABLE public.reference_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX reference_uploads_user_id_created_at_idx
  ON public.reference_uploads (user_id, created_at DESC);

ALTER TABLE public.reference_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY reference_uploads_select_own ON public.reference_uploads
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY reference_uploads_insert_own ON public.reference_uploads
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY reference_uploads_delete_own ON public.reference_uploads
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
