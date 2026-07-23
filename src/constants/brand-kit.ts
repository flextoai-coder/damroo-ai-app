export const BRAND_FONT_SUGGESTIONS = [
  'Modern sans-serif',
  'Clean geometric',
  'Elegant serif',
  'Bold display',
  'Friendly rounded',
  'Luxury script accents',
] as const;

export const BRAND_TONE_SUGGESTIONS = [
  'Warm & inviting',
  'Premium & minimal',
  'Playful & energetic',
  'Trustworthy & professional',
  'Festive & celebratory',
] as const;

/** Persist multi-select tones as a comma-separated string. */
export function formatMultiSelect(values: string[]): string {
  return values.map((v) => v.trim()).filter(Boolean).join(', ');
}

/** Restore multi-select tones from stored text (comma-separated). */
export function parseMultiSelect(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return [];
  return trimmed
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

export function multiSelectOptions(
  current: string[],
  known: readonly string[],
): string[] {
  const extras = current.filter((item) => !known.includes(item));
  return extras.length > 0 ? [...extras, ...known] : [...known];
}

export function normalizeHexColor(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  if (!/^#[0-9A-Fa-f]{6}$/.test(withHash)) return null;
  return withHash.toUpperCase();
}

export function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
