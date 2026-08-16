import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { fetchBannerPosition2, fetchHeroBanners } from '@/services/banners';
import { fetchUserGenerations, fetchUserGenerationsPage } from '@/services/generations';
import { fetchPublishedTemplates } from '@/services/templates';
import { useSession } from '@/hooks/use-session';

/** Home hero banners — bucket-driven, same for every user. */
export function useHeroBanners() {
  return useQuery({
    queryKey: ['banners', 'hero'],
    queryFn: fetchHeroBanners,
  });
}

/** Second banner slot, shown just below the "Latest Generations by You" rail. */
export function useBannerPosition2() {
  return useQuery({
    queryKey: ['banners', 'position2'],
    queryFn: fetchBannerPosition2,
  });
}

export function useHomeGenerations() {
  const { user } = useSession();

  return useQuery({
    queryKey: ['generations', 'home', user?.id],
    queryFn: () => fetchUserGenerations(user!.id, { limit: 40 }),
    enabled: Boolean(user?.id),
  });
}

const GENERATIONS_PAGE_SIZE = 10;

/** Cursor-paginated generations feed for the Home screen's "Load more" grid. */
export function useInfiniteGenerations() {
  const { user } = useSession();

  return useInfiniteQuery({
    queryKey: ['generations', 'infinite', user?.id],
    queryFn: ({ pageParam }: { pageParam: string | null }) =>
      fetchUserGenerationsPage(user!.id, { limit: GENERATIONS_PAGE_SIZE, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: Boolean(user?.id),
  });
}

export function useHomeTemplates() {
  const { profile } = useSession();

  return useQuery({
    queryKey: ['templates', 'home', profile?.industry ?? 'all'],
    queryFn: () =>
      fetchPublishedTemplates({
        industry: profile?.industry,
        limit: 12,
      }),
  });
}
