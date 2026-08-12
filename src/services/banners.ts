import { supabase } from '@/lib/supabase';

export type Banner = {
  /** Storage object name — stable enough to key a list by. */
  id: string;
  url: string;
};

/**
 * Home hero banners — purely whatever image files sit in the public
 * `banners` Storage bucket, newest first. No DB row to insert: drop a new
 * image into the bucket and it shows up here on the next fetch.
 */
export async function fetchBanners(): Promise<Banner[]> {
  const { data, error } = await supabase.storage.from('banners').list('', {
    sortBy: { column: 'created_at', order: 'desc' },
  });
  if (error) throw error;

  const files = (data ?? []).filter(
    (f) => f.id !== null && f.name !== '.emptyFolderPlaceholder',
  );

  return files.map((f) => ({
    id: f.id ?? f.name,
    url: supabase.storage.from('banners').getPublicUrl(f.name).data.publicUrl,
  }));
}
