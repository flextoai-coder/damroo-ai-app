import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type BrandKitRow = {
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  font_style: string | null;
  tone_of_voice: string | null;
  brand_keywords: string | null;
  style_notes: string | null;
  logo_storage_path: string | null;
};

type ProfileBrandRow = {
  business_name: string | null;
  industry: string | null;
  business_details: string | null;
};

/** Load profile + brand kit and format a prompt block for Seedream / OpenAI. */
export async function loadBrandPromptContext(
  service: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const [{ data: profile }, { data: kit }] = await Promise.all([
    service
      .from('profiles')
      .select('business_name, industry, business_details')
      .eq('id', userId)
      .maybeSingle(),
    service.from('brand_kits').select('*').eq('user_id', userId).maybeSingle(),
  ]);

  return formatBrandPromptContext(
    (profile as ProfileBrandRow | null) ?? null,
    (kit as BrandKitRow | null) ?? null,
  );
}

export function formatBrandPromptContext(
  profile: ProfileBrandRow | null,
  kit: BrandKitRow | null,
): string | null {
  const lines: string[] = [];

  if (profile?.business_name?.trim()) {
    lines.push(`Business: ${profile.business_name.trim()}`);
  }
  if (profile?.industry?.trim()) {
    lines.push(`Industry: ${profile.industry.trim()}`);
  }
  if (profile?.business_details?.trim()) {
    lines.push(`Business details: ${profile.business_details.trim()}`);
  }

  const colors = [kit?.primary_color, kit?.secondary_color, kit?.accent_color]
    .filter((c): c is string => Boolean(c?.trim()))
    .map((c) => c.trim().toUpperCase());
  if (colors.length) {
    lines.push(`Brand colors (use these hex values in the design): ${colors.join(', ')}`);
  }
  if (kit?.font_style?.trim()) {
    lines.push(`Typography style: ${kit.font_style.trim()}`);
  }
  if (kit?.tone_of_voice?.trim()) {
    lines.push(`Brand voice / tone: ${kit.tone_of_voice.trim()}`);
  }
  if (kit?.brand_keywords?.trim()) {
    lines.push(`Brand keywords: ${kit.brand_keywords.trim()}`);
  }
  if (kit?.style_notes?.trim()) {
    lines.push(`Style notes: ${kit.style_notes.trim()}`);
  }
  if (kit?.logo_storage_path?.trim()) {
    lines.push(
      'A brand logo may be provided as a reference image — keep logo colors and mark consistent when relevant.',
    );
  }

  if (!lines.length) return null;
  return `Brand kit (follow unless the user prompt conflicts):\n${lines.map((l) => `- ${l}`).join('\n')}`;
}

/** Append brand context to a generation / enhance prompt. */
export function withBrandContext(prompt: string, brandContext: string | null | undefined): string {
  const base = prompt.trim();
  const ctx = brandContext?.trim();
  if (!ctx) return base;
  if (!base) return ctx;
  return `${base}\n\n${ctx}`;
}
