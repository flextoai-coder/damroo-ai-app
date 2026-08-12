import { File } from 'expo-file-system';

import { supabase } from '@/lib/supabase';

export type ReferenceUpload = {
  id: string;
  storagePath: string;
  createdAt: string;
  url: string;
};

/** Signed URLs are re-issued on every fetch, so this only needs to outlive one browsing session. */
const SIGN_TTL_SECONDS = 60 * 60 * 24;

function extensionForContentType(contentType: string): string {
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('heic') || contentType.includes('heif')) return 'heic';
  return 'jpg';
}

function guessContentTypeFromUri(uri: string): string {
  const path = uri.split('?')[0].toLowerCase();
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.webp')) return 'image/webp';
  if (path.endsWith('.heic') || path.endsWith('.heif')) return 'image/heic';
  return 'image/jpeg';
}

/**
 * Uploads a local image to the private `references` bucket and adds it to the
 * user's "My Uploads" library (a `reference_uploads` row) so it can be
 * browsed and reused in later generations — not just this one chat message.
 * Returns a signed URL ready to attach immediately.
 */
export async function uploadAndSaveReference(
  userId: string,
  uri: string,
  mimeType?: string | null,
): Promise<ReferenceUpload> {
  const contentType = mimeType || guessContentTypeFromUri(uri);
  const ext = extensionForContentType(contentType);
  const bytes = await new File(uri).bytes();
  const storagePath = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('references')
    .upload(storagePath, bytes, { contentType, upsert: true });
  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: row, error: insertError } = await supabase
    .from('reference_uploads')
    .insert({ user_id: userId, storage_path: storagePath })
    .select('*')
    .single();
  if (insertError || !row) {
    throw new Error(insertError?.message ?? 'Failed to save to My Uploads');
  }

  const url = await signReferencePath(storagePath);
  return { id: row.id, storagePath, createdAt: row.created_at, url };
}

async function signReferencePath(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('references')
    .createSignedUrl(storagePath, SIGN_TTL_SECONDS);
  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? 'Failed to sign reference URL');
  }
  return data.signedUrl;
}

/** The user's full "My Uploads" library, newest first, with fresh signed URLs. */
export async function fetchReferenceLibrary(userId: string): Promise<ReferenceUpload[]> {
  const { data, error } = await supabase
    .from('reference_uploads')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }
  if (!data || data.length === 0) return [];

  const paths = data.map((row) => row.storage_path);
  const { data: signed, error: signError } = await supabase.storage
    .from('references')
    .createSignedUrls(paths, SIGN_TTL_SECONDS);
  if (signError || !signed) {
    throw new Error(signError?.message ?? 'Failed to sign reference URLs');
  }

  const urlByPath = new Map(signed.map((s) => [s.path, s.signedUrl]));
  return data
    .map((row) => ({
      id: row.id,
      storagePath: row.storage_path,
      createdAt: row.created_at,
      url: urlByPath.get(row.storage_path) ?? '',
    }))
    .filter((row) => row.url);
}
