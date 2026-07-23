-- User-level Brand Kit: colors, logo, voice — used to steer image prompts.

CREATE TABLE public.brand_kits (
  user_id uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  primary_color text,
  secondary_color text,
  accent_color text,
  logo_storage_path text,
  font_style text,
  tone_of_voice text,
  brand_keywords text,
  style_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT brand_kits_primary_color_hex_chk
    CHECK (primary_color IS NULL OR primary_color ~* '^#[0-9A-F]{6}$'),
  CONSTRAINT brand_kits_secondary_color_hex_chk
    CHECK (secondary_color IS NULL OR secondary_color ~* '^#[0-9A-F]{6}$'),
  CONSTRAINT brand_kits_accent_color_hex_chk
    CHECK (accent_color IS NULL OR accent_color ~* '^#[0-9A-F]{6}$')
);

CREATE TRIGGER brand_kits_set_updated_at
  BEFORE UPDATE ON public.brand_kits
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY brand_kits_select_own ON public.brand_kits
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY brand_kits_insert_own ON public.brand_kits
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY brand_kits_update_own ON public.brand_kits
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY brand_kits_delete_own ON public.brand_kits
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Private logo assets: {user_id}/logo.*
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-assets',
  'brand-assets',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']::text[]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY storage_brand_assets_select_own ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'brand-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY storage_brand_assets_insert_own ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'brand-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY storage_brand_assets_update_own ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'brand-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'brand-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY storage_brand_assets_delete_own ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'brand-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
