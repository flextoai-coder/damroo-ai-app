export type PlanId = 'starter' | 'growth' | 'scale';

export type Plan = {
  id: PlanId;
  name: string;
  priceInr: number;
  credits: number;
  images: number;
  /** RevenueCat product identifier on the App Store. */
  appleProductId: string;
  /** RevenueCat product identifier on Google Play — `productId:basePlanId`, per Play Billing's subscription model. */
  androidProductId: string;
  tagline: string;
  benefits: string[];
  /** Gradient accents for the plan card */
  colors: [string, string];
};

/**
 * Monthly plans — 1 credit = ₹1. No rollover. Credit cost per generation
 * varies by model + quality (see `creditsPerImage`), so plan benefit copy
 * intentionally doesn't restate a fixed "X images" figure.
 */
export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceInr: 999,
    credits: 999,
    images: 999,
    appleProductId: 'damroo_starter_monthly',
    androidProductId: 'damroo_starter_monthly:monthly',
    tagline: 'For solo creators getting consistent',
    colors: ['#FB923C', '#F97316'],
    benefits: [
      '999 credits / month',
      'All templates unlocked',
      'AI captions & hashtags',
      '2K quality exports',
      'No watermark',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    priceInr: 4999,
    credits: 4999,
    images: 4999,
    appleProductId: 'damroo_growth_monthly',
    androidProductId: 'damroo_growth_monthly:monthly',
    tagline: 'For brands posting every week',
    colors: ['#F97316', '#EA580C'],
    benefits: [
      '4,999 credits / month',
      'All templates unlocked',
      'AI captions & hashtags',
      '2K & 4K quality exports',
      'Priority generation queue',
      'No watermark',
    ],
  },
  {
    id: 'scale',
    name: 'Scale',
    priceInr: 9999,
    credits: 9999,
    images: 9999,
    appleProductId: 'damroo_scale_monthly',
    androidProductId: 'damroo_scale_monthly:monthly',
    tagline: 'For teams shipping at volume',
    colors: ['#EA580C', '#C2410C'],
    benefits: [
      '9,999 credits / month',
      'All templates unlocked',
      'AI captions & hashtags',
      '2K & 4K quality exports',
      'Highest priority queue',
      'No watermark',
      'Priority support',
    ],
  },
];

export function getPlan(id: PlanId): Plan {
  const plan = PLANS.find((p) => p.id === id);
  if (!plan) {
    throw new Error(`Unknown plan: ${id}`);
  }
  return plan;
}

/** Next tier above `id`, or `id` itself if already the top plan. */
export function nextPlanId(id: PlanId): PlanId {
  const index = PLANS.findIndex((p) => p.id === id);
  return PLANS[index + 1]?.id ?? id;
}

export function formatPlanPrice(priceInr: number): string {
  return `₹${priceInr.toLocaleString('en-IN')}`;
}
