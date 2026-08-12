import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type BrandKitRow = {
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  font_style: string | null;
  logo_storage_path: string | null;
};

type ProfileBrandRow = {
  business_name: string | null;
};

export type BrandContextOptions = {
  /** Add the brand name, styled per the configured typography. Nothing else. */
  includeName?: boolean;
  /** Apply the brand color palette. Nothing else. */
  includeColors?: boolean;
  /** Mention the attached brand logo reference and how to place it. Nothing else. */
  includeLogo?: boolean;
};

/** Load profile + brand kit and format a prompt block for Seedream / OpenAI. */
export async function loadBrandPromptContext(
  service: SupabaseClient,
  userId: string,
  options: BrandContextOptions = {},
): Promise<string | null> {
  const [{ data: profile }, { data: kit }] = await Promise.all([
    service.from('profiles').select('business_name').eq('id', userId).maybeSingle(),
    service
      .from('brand_kits')
      .select('primary_color, secondary_color, accent_color, font_style, logo_storage_path')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  return formatBrandPromptContext(
    (profile as ProfileBrandRow | null) ?? null,
    (kit as BrandKitRow | null) ?? null,
    options,
  );
}

/**
 * Three independent brand identity toggles, each mapped to exactly one
 * tightly-scoped instruction. All default off — no implicit extras (industry,
 * tone of voice, keywords, etc.) get pulled in alongside them anymore.
 */
export function formatBrandPromptContext(
  profile: ProfileBrandRow | null,
  kit: BrandKitRow | null,
  options: BrandContextOptions = {},
): string | null {
  const { includeName = false, includeColors = false, includeLogo = false } = options;
  const lines: string[] = [];

  if (includeName && profile?.business_name?.trim()) {
    const name = profile.business_name.trim();
    const typography = kit?.font_style?.trim();
    lines.push(
      typography
        ? `Include the brand name "${name}" in the design, styled using ${typography} typography. Do not add any other business information.`
        : `Include the brand name "${name}" in the design. Do not add any other business information.`,
    );
  }

  if (includeColors) {
    const colors = [kit?.primary_color, kit?.secondary_color, kit?.accent_color]
      .filter((c): c is string => Boolean(c?.trim()))
      .map((c) => c.trim().toUpperCase());
    if (colors.length) {
      lines.push(`Apply the brand color palette (hex): ${colors.join(', ')}.`);
    }
  }

  if (includeLogo && kit?.logo_storage_path?.trim()) {
    lines.push(
      'A brand logo has been provided as a reference image — find the best placement for it and align it naturally within the composition. Do not alter its appearance.',
    );
  }

  if (!lines.length) return null;
  return `Brand kit instructions (follow exactly, in addition to the user's prompt):\n${lines.map((l) => `- ${l}`).join('\n')}`;
}

/** Append brand context to a generation / enhance prompt. */
export function withBrandContext(prompt: string, brandContext: string | null | undefined): string {
  const base = prompt.trim();
  const ctx = brandContext?.trim();
  if (!ctx) return base;
  if (!base) return ctx;
  return `${base}\n\n${ctx}`;
}
