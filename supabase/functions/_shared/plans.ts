export type PlanId = 'starter' | 'growth' | 'scale';

export const PLANS: Record<
  PlanId,
  {
    id: PlanId;
    name: string;
    priceInr: number;
    credits: number;
    appleProductId: string;
    androidProductId: string;
  }
> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    priceInr: 5000,
    credits: 500,
    appleProductId: 'damroo_starter_monthly',
    androidProductId: 'damroo_starter_monthly:monthly',
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    priceInr: 10000,
    credits: 1000,
    appleProductId: 'damroo_growth_monthly',
    androidProductId: 'damroo_growth_monthly:monthly',
  },
  scale: {
    id: 'scale',
    name: 'Scale',
    priceInr: 20000,
    credits: 2000,
    appleProductId: 'damroo_scale_monthly',
    androidProductId: 'damroo_scale_monthly:monthly',
  },
};

export function getPlan(id: string) {
  const plan = PLANS[id as PlanId];
  if (!plan) throw new Error(`Unknown plan: ${id}`);
  return plan;
}

/** Matches a RevenueCat webhook `product_id` against either store's product identifier. */
export function planFromProductId(productId: string): PlanId | null {
  const entry = Object.values(PLANS).find(
    (p) => p.appleProductId === productId || p.androidProductId === productId,
  );
  return entry?.id ?? null;
}
