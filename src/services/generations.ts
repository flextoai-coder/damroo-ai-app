import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

export type GenerationAsset = Tables<'generation_assets'>;
export type Generation = Tables<'generations'> & {
  generation_assets: GenerationAsset[];
};

export async function fetchUserGenerations(
  userId: string,
  options: { limit?: number } = {},
): Promise<Generation[]> {
  const limit = options.limit ?? 40;

  const { data, error } = await supabase
    .from('generations')
    .select('*, generation_assets(*)')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    ...row,
    generation_assets: [...(row.generation_assets ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    ),
  }));
}

export type GenerationsPage = {
  items: Generation[];
  nextCursor: string | null;
};

/** Cursor-paginated version of fetchUserGenerations, for infinite-scroll feeds. */
export async function fetchUserGenerationsPage(
  userId: string,
  options: { limit?: number; cursor?: string | null } = {},
): Promise<GenerationsPage> {
  const limit = options.limit ?? 20;

  let query = supabase
    .from('generations')
    .select('*, generation_assets(*)')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (options.cursor) {
    query = query.lt('created_at', options.cursor);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  const items = (data ?? []).map((row) => ({
    ...row,
    generation_assets: [...(row.generation_assets ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    ),
  }));

  const nextCursor = items.length === limit ? items[items.length - 1].created_at : null;
  return { items, nextCursor };
}

export function primaryAssetUrl(generation: Generation): string | null {
  const asset = generation.generation_assets[0];
  return asset?.public_url ?? null;
}

export type CaptionableGeneration = Generation & { hasCaption: boolean };

/** Completed generations plus whether each already has a caption on file. */
export async function fetchGenerationsForCaptioning(
  userId: string,
  options: { limit?: number } = {},
): Promise<CaptionableGeneration[]> {
  const limit = options.limit ?? 60;

  const { data, error } = await supabase
    .from('generations')
    .select('*, generation_assets(*), captions(id)')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => {
    const { captions, generation_assets, ...rest } = row;
    return {
      ...rest,
      generation_assets: [...(generation_assets ?? [])].sort(
        (a, b) => a.sort_order - b.sort_order,
      ),
      hasCaption: (captions?.length ?? 0) > 0,
    };
  });
}

/** Most recently generated caption text for a generation, if any exists. */
export async function fetchLatestCaption(generationId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('captions')
    .select('text')
    .eq('generation_id', generationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data?.text ?? null;
}

export async function fetchGenerationById(
  userId: string,
  generationId: string,
): Promise<Generation | null> {
  const { data, error } = await supabase
    .from('generations')
    .select('*, generation_assets(*)')
    .eq('id', generationId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) return null;

  return {
    ...data,
    generation_assets: [...(data.generation_assets ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    ),
  };
}
