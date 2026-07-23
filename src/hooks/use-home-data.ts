import { useQuery } from '@tanstack/react-query';

import { fetchUserGenerations } from '@/services/generations';
import { fetchPublishedTemplates } from '@/services/templates';
import { useSession } from '@/hooks/use-session';

export function useHomeGenerations() {
  const { user } = useSession();

  return useQuery({
    queryKey: ['generations', 'home', user?.id],
    queryFn: () => fetchUserGenerations(user!.id, { limit: 40 }),
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
