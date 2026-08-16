import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

/** Recursively removes every object under `prefix` in `bucket` (folders show up as entries with `id: null`). */
export async function removeAllUnderPrefix(
  service: SupabaseClient,
  bucket: string,
  prefix: string,
): Promise<void> {
  const { data: entries, error } = await service.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error || !entries || entries.length === 0) return;

  const filePaths: string[] = [];
  for (const entry of entries) {
    const path = `${prefix}/${entry.name}`;
    if (entry.id === null) {
      await removeAllUnderPrefix(service, bucket, path);
    } else {
      filePaths.push(path);
    }
  }

  if (filePaths.length > 0) {
    await service.storage.from(bucket).remove(filePaths);
  }
}
