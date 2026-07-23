import type { Enums } from '@/types/database';

/** `'all'` or a template `industry` label (e.g. Cafe, Retail). */
export type TemplateIndustryFilter = 'all' | string;

/** Build industry filter chips from the published catalog (plus All). */
export function buildIndustryFilterChips(
  industries: readonly string[],
): { id: TemplateIndustryFilter; label: string }[] {
  const unique = Array.from(
    new Set(
      industries
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));

  return [
    { id: 'all', label: 'All' },
    ...unique.map((industry) => ({ id: industry, label: industry })),
  ];
}

export function categoryLabel(category: Enums<'template_category'> | string): string {
  switch (category) {
    case 'festival':
      return 'Festival';
    case 'offers':
      return 'Offers';
    case 'products':
      return 'Products';
    case 'video':
      return 'Video';
    default:
      return category;
  }
}
