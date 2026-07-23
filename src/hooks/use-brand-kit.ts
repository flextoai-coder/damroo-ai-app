import { useQuery } from '@tanstack/react-query';

import { useSession } from '@/hooks/use-session';
import { brandKitSwatches, ensureBrandKit } from '@/services/brand-kit';

export function useBrandKit() {
  const { user } = useSession();

  return useQuery({
    queryKey: ['brand-kit', user?.id],
    queryFn: () => ensureBrandKit(user!.id),
    enabled: Boolean(user?.id),
  });
}

export function useBrandKitSwatches() {
  const query = useBrandKit();
  return {
    ...query,
    colors: brandKitSwatches(query.data),
  };
}
