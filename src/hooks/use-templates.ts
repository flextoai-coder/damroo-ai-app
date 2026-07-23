import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { TemplateIndustryFilter } from '@/constants/templates';
import { fetchPublishedTemplates, filterTemplates } from '@/services/templates';

/** Full published catalog from Supabase; filter/search run client-side for live typing. */
export function useTemplatesCatalog() {
  return useQuery({
    queryKey: ['templates', 'catalog'],
    queryFn: () => fetchPublishedTemplates({ limit: 100 }),
  });
}

export function useFilteredTemplates(search: string, industry: TemplateIndustryFilter) {
  const catalog = useTemplatesCatalog();

  const industries = useMemo(() => {
    const values = (catalog.data ?? [])
      .map((t) => t.industry?.trim())
      .filter((value): value is string => Boolean(value));
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
  }, [catalog.data]);

  const filtered = useMemo(
    () => filterTemplates(catalog.data ?? [], { search, industry }),
    [catalog.data, search, industry],
  );

  return {
    ...catalog,
    industries,
    templates: filtered,
  };
}
