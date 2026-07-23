import type { TemplateIndustryFilter } from '@/constants/templates';
import { supabase } from '@/lib/supabase';
import type { Enums, Tables } from '@/types/database';

export type Template = Tables<'templates'>;
export type TemplateCategory = Enums<'template_category'>;

export function templatePreviewUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const { data } = supabase.storage.from('templates').getPublicUrl(path);
  return data.publicUrl || null;
}

export async function fetchPublishedTemplates(options: {
  industry?: string | null;
  category?: TemplateCategory | null;
  limit?: number;
} = {}): Promise<Template[]> {
  const limit = options.limit ?? 60;
  let query = supabase
    .from('templates')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .limit(limit);

  if (options.category) {
    query = query.eq('category', options.category);
  }

  if (options.industry?.trim()) {
    query = query.ilike('industry', options.industry.trim());
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  // Home rail: if industry filter is empty, fall back to any published templates.
  if ((data?.length ?? 0) === 0 && options.industry?.trim() && !options.category) {
    const fallback = await supabase
      .from('templates')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .limit(limit);
    if (fallback.error) {
      throw fallback.error;
    }
    return fallback.data ?? [];
  }

  return data ?? [];
}

export async function fetchTemplateById(id: string): Promise<Template | null> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', id)
    .eq('is_published', true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

/** Combine search + industry against the Supabase-fetched catalog (live, no submit). */
export function filterTemplates(
  templates: Template[],
  options: { search?: string; industry?: TemplateIndustryFilter },
): Template[] {
  const q = options.search?.trim().toLowerCase() ?? '';
  const industry = options.industry ?? 'all';

  return templates.filter((t) => {
    if (
      industry !== 'all' &&
      t.industry.trim().toLowerCase() !== industry.trim().toLowerCase()
    ) {
      return false;
    }
    if (!q) return true;
    return (
      t.title.toLowerCase().includes(q) ||
      t.industry.toLowerCase().includes(q) ||
      t.base_prompt.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  });
}
