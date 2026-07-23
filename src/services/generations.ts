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

export function primaryAssetUrl(generation: Generation): string | null {
  const asset = generation.generation_assets[0];
  return asset?.public_url ?? null;
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
