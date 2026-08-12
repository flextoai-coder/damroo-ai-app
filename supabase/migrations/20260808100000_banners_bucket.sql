-- Home hero banner carousel: purely bucket-driven, no DB table. Whatever
-- image files sit in this public bucket are the banners shown on Home —
-- drop a new image in and it appears, no row to insert. Mirrors the
-- `templates` bucket's public-read pattern; writes are owner-managed
-- (dashboard / service role), not client-writable.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'banners',
    'banners',
    true,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
  );

CREATE POLICY storage_banners_select_public ON storage.objects
  FOR SELECT TO authenticated, anon
  USING (bucket_id = 'banners');
