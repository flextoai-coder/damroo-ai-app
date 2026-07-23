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

/** Upload a logo image; returns storage path and updates brand_kits.logo_storage_path. */
export async function uploadBrandLogo(userId: string, localUri: string): Promise<BrandKit> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const ext = blob.type.includes('png')
    ? 'png'
    : blob.type.includes('webp')
      ? 'webp'
      : blob.type.includes('heic')
        ? 'heic'
        : 'jpg';
  const path = `${userId}/logo.${ext}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type || 'image/jpeg',
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
