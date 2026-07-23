import { useQuery } from '@tanstack/react-query';

import { useSession } from '@/hooks/use-session';
import { fetchUserSubscription } from '@/services/subscription';
import { getPlan, type PlanId } from '@/constants/plans';

export function useSubscription() {
  const { user } = useSession();

  return useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: () => fetchUserSubscription(user!.id),
    enabled: Boolean(user?.id),
  });
}

export function planDisplayName(plan: string | null | undefined): string {
  if (!plan) return 'Free';
  try {
    return getPlan(plan as PlanId).name;
  } catch {
    return plan;
  }
}
