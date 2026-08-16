import { useQuery } from '@tanstack/react-query';

import { fetchExpiringSoonGenerations } from '@/services/generations';
import { useSession } from '@/hooks/use-session';

/** Completed generations 5+ days old and not yet purged — drives the expiring-soon notice + thumbnail badges. */
export function useExpiringSoonGenerations() {
  const { user } = useSession();

  return useQuery({
    queryKey: ['generations', 'expiring-soon', user?.id],
    queryFn: () => fetchExpiringSoonGenerations(user!.id),
    enabled: Boolean(user?.id),
  });
}
