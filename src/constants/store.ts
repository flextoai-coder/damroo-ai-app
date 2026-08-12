import { PLANS } from '@/constants/plans';

/** Public legal + store URLs — update before App Store / Play submission. */
export const STORE = {
  privacyPolicyUrl: 'https://damroo.ai/privacy',
  termsUrl: 'https://damroo.ai/terms',
  supportUrl: 'https://damroo.ai/support',
  marketingUrl: 'https://damroo.ai',
  /** Supabase project hosting Edge Functions */
  supabaseUrl: 'https://thvqecpkurkzcmkdqzki.supabase.co',
  revenuecatWebhookPath: '/functions/v1/revenuecat-webhook',
  appleProductIds: PLANS.map((p) => p.appleProductId),
  androidProductIds: PLANS.map((p) => p.androidProductId),
} as const;

export function revenuecatWebhookUrl(): string {
  return `${STORE.supabaseUrl}${STORE.revenuecatWebhookPath}`;
}
