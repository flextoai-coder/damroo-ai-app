import { supabase } from '@/lib/supabase';

export type Banner = {
  /** Storage object name — stable enough to key a list by. */
  id: string;
  url: string;
};

/**
 * Home banners — purely whatever image files sit in the given folder of the
 * public `banners` Storage bucket, newest first. No DB row to insert: drop a
 * new image into the folder and it shows up here on the next fetch.
 */
async function fetchBannersInFolder(folder: string): Promise<Banner[]> {
  const { data, error } = await supabase.storage.from('banners').list(folder, {
    sortBy: { column: 'created_at', order: 'desc' },
  });
  if (error) throw error;

  const files = (data ?? []).filter(
    (f) => f.id !== null && f.name !== '.emptyFolderPlaceholder',
  );

  return files.map((f) => ({
    id: f.id ?? f.name,
    url: supabase.storage.from('banners').getPublicUrl(`${folder}/${f.name}`).data.publicUrl,
  }));
}

/** Shown at the very top of Home, above everything else. */
export function fetchHeroBanners(): Promise<Banner[]> {
  return fetchBannersInFolder('Hero Banners');
}

/** Shown just below the "Latest Generations by You" rail. */
export function fetchBannerPosition2(): Promise<Banner[]> {
  return fetchBannersInFolder('Banner Position 2');
}
