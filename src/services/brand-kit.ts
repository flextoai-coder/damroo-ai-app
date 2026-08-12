import { File } from 'expo-file-system';

import { emptyToNull, normalizeHexColor } from '@/constants/brand-kit';
import { queryClient } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';
import type { Tables, TablesUpdate } from '@/types/database';

export type BrandKit = Tables<'brand_kits'>;
export type BrandKitUpdate = TablesUpdate<'brand_kits'>;

export type BrandKitFormInput = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontStyle: string;
  toneOfVoice: string;
  brandKeywords: string;
  styleNotes: string;
};

const BUCKET = 'brand-assets';

function assertHexOrEmpty(label: string, value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const hex = normalizeHexColor(trimmed);
  if (!hex) {
    throw new Error(`${label} must be a valid hex color like #F97316.`);
  }
  return hex;
}

/** Fetch the user's brand kit, or create an empty row on first visit. */
export async function ensureBrandKit(userId: string): Promise<BrandKit> {
  const { data, error } = await supabase
    .from('brand_kits')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (data) return data;

  const { data: created, error: insertError } = await supabase
    .from('brand_kits')
    .upsert({ user_id: userId }, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (insertError || !created) {
    throw insertError ?? new Error('Could not create brand kit');
  }
  return created;
}

export async function saveBrandKit(
  userId: string,
  input: BrandKitFormInput,
): Promise<BrandKit> {
  const patch: BrandKitUpdate = {
    primary_color: assertHexOrEmpty('Primary color', input.primaryColor),
    secondary_color: assertHexOrEmpty('Secondary color', input.secondaryColor),
    accent_color: assertHexOrEmpty('Accent color', input.accentColor),
    font_style: emptyToNull(input.fontStyle),
    tone_of_voice: emptyToNull(input.toneOfVoice),
    brand_keywords: emptyToNull(input.brandKeywords),
    style_notes: emptyToNull(input.styleNotes),
  };

  const { data, error } = await supabase
    .from('brand_kits')
    .upsert({ user_id: userId, ...patch }, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error || !data) {
    throw error ?? new Error('Could not save brand kit');
  }

  void queryClient.invalidateQueries({ queryKey: ['brand-kit', userId] });
  return data;
}

export async function brandLogoSignedUrl(
  path: string | null | undefined,
): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

function extensionForContentType(contentType: string): string {
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('heic') || contentType.includes('heif')) return 'heic';
  return 'jpg';
}

/** Best-effort content type from the file path when the caller doesn't already know it. */
function guessContentTypeFromUri(uri: string): string {
  const path = uri.split('?')[0].toLowerCase();
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.webp')) return 'image/webp';
  if (path.endsWith('.heic') || path.endsWith('.heif')) return 'image/heic';
  return 'image/jpeg';
}

/**
 * Upload a logo image; returns storage path and updates brand_kits.logo_storage_path.
 * Also serves as "replace" — re-calling this with a new image swaps it in and
 * cleans up the previous file (fetched first, before the new upload lands).
 *
 * Reads the file via expo-file-system's `File` (bytes, not a Blob) —
 * React Native's `fetch(uri).blob()` is a well-known unreliable path for
 * uploading local files through the Supabase JS client; it frequently
 * produces corrupted or empty uploads. Passing raw bytes sidesteps that.
 */
export async function uploadBrandLogo(
  userId: string,
  localUri: string,
  mimeType?: string | null,
): Promise<BrandKit> {
  const { data: existing } = await supabase
    .from('brand_kits')
    .select('logo_storage_path')
    .eq('user_id', userId)
    .maybeSingle();
  const previousPath = existing?.logo_storage_path ?? null;

  const contentType = mimeType || guessContentTypeFromUri(localUri);
  const ext = extensionForContentType(contentType);
  const bytes = await new File(localUri).bytes();
  const path = `${userId}/logo.${ext}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType,
    upsert: true,
  });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('brand_kits')
    .upsert({ user_id: userId, logo_storage_path: path }, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error || !data) {
    throw error ?? new Error('Could not save logo');
  }

  // Different extension than before (e.g. replacing a .png with a .jpg) means
  // the old file sits at a different path and `upsert` above never touched
  // it — remove it explicitly so a "replace" doesn't leave it orphaned.
  if (previousPath && previousPath !== path) {
    await supabase.storage.from(BUCKET).remove([previousPath]);
  }

  void queryClient.invalidateQueries({ queryKey: ['brand-kit', userId] });
  return data;
}

export async function removeBrandLogo(userId: string, path: string | null): Promise<BrandKit> {
  if (path) {
    await supabase.storage.from(BUCKET).remove([path]);
  }

  const { data, error } = await supabase
    .from('brand_kits')
    .upsert({ user_id: userId, logo_storage_path: null }, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error || !data) {
    throw error ?? new Error('Could not remove logo');
  }

  void queryClient.invalidateQueries({ queryKey: ['brand-kit', userId] });
  return data;
}

export function brandKitSwatches(kit: BrandKit | null | undefined): string[] {
  return [kit?.primary_color, kit?.secondary_color, kit?.accent_color].filter(
    (c): c is string => Boolean(c),
  );
}
