import type { TemplateIndustryFilter } from '@/constants/templates';
import { supabase } from '@/lib/supabase';
import type { Enums, Tables } from '@/types/database';
import type {
  TemplateRemixConfig,
  TemplateStep,
  TemplateStepOption,
  TemplateStepSelections,
} from '@/types/template-remix';

export type Template = Tables<'templates'>;
export type TemplateCategory = Enums<'template_category'>;

export function templatePreviewUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const { data } = supabase.storage.from('templates').getPublicUrl(path);
  return data.publicUrl || null;
}

/**
 * Defensive parse of templates.remix_steps. Never throws. Drops individually
 * malformed steps/options rather than failing the whole config; returns null
 * (→ instant remix, today's behavior) if the column is empty or nothing valid
 * survives.
 */
export function parseTemplateRemixConfig(
  template: Pick<Template, 'remix_steps'>,
): TemplateRemixConfig | null {
  try {
    const raw = template.remix_steps;
    if (!raw) return null;
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;

    const stepsRaw = (obj as { steps?: unknown }).steps;
    if (!Array.isArray(stepsRaw)) return null;

    const seenStepIds = new Set<string>();
    const steps: TemplateStep[] = [];

    for (const s of stepsRaw) {
      if (!s || typeof s !== 'object') continue;
      const id = String((s as Record<string, unknown>).id ?? '').trim();
      const title = String((s as Record<string, unknown>).title ?? '').trim();
      if (!id || !title || seenStepIds.has(id)) continue;

      const optionsRaw = (s as Record<string, unknown>).options;
      if (!Array.isArray(optionsRaw)) continue;

      const seenOptionIds = new Set<string>();
      const options: TemplateStepOption[] = [];
      for (const o of optionsRaw) {
        if (!o || typeof o !== 'object') continue;
        const rec = o as Record<string, unknown>;
        const optId = String(rec.id ?? '').trim();
        const label = String(rec.label ?? '').trim();
        if (!optId || !label || seenOptionIds.has(optId)) continue;
        seenOptionIds.add(optId);
        options.push({
          id: optId,
          label,
          promptFragment: typeof rec.promptFragment === 'string' ? rec.promptFragment : '',
          thumbnailUrl: typeof rec.thumbnailUrl === 'string' ? rec.thumbnailUrl : undefined,
          referenceImageUrl:
            typeof rec.referenceImageUrl === 'string' ? rec.referenceImageUrl : undefined,
          attachAsReference: Boolean(rec.attachAsReference),
        });
      }
      if (options.length === 0) continue;

      seenStepIds.add(id);
      const subtitle = (s as Record<string, unknown>).subtitle;
      steps.push({
        id,
        title,
        subtitle: typeof subtitle === 'string' ? subtitle : undefined,
        options,
      });
    }

    if (steps.length === 0) return null;
    return { version: 1, steps };
  } catch {
    return null;
  }
}

/** First option of every step — the wizard's baseline selection state. */
export function defaultTemplateSelections(steps: TemplateStep[]): TemplateStepSelections {
  const out: TemplateStepSelections = {};
  for (const step of steps) {
    if (step.options[0]) out[step.id] = step.options[0].id;
  }
  return out;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Replaces {step.id} tokens in base_prompt with the fragment of the selected
 * option per step. A missing/stale selection falls back to that step's first
 * option. Tokens absent from the prompt are a silent no-op.
 */
export function interpolateTemplatePrompt(
  basePrompt: string,
  steps: TemplateStep[],
  selections: TemplateStepSelections,
): string {
  let result = basePrompt;
  for (const step of steps) {
    const chosen = step.options.find((o) => o.id === selections[step.id]) ?? step.options[0];
    if (!chosen) continue;
    result = result.replace(new RegExp(`\\{${escapeRegExp(step.id)}\\}`, 'g'), chosen.promptFragment);
  }
  // Cosmetic cleanup only — collapses double spaces an empty fragment can leave behind.
  return result.replace(/[ \t]{2,}/g, ' ').trim();
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
