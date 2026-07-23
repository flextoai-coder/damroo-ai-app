import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

export type Subscription = Tables<'subscriptions'>;

/** Active (or most recent) subscription for the signed-in user. */
export async function fetchUserSubscription(userId: string): Promise<Subscription | null> {
  const { data: active, error: activeError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('current_period_end', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeError) {
    throw activeError;
  }
  if (active) return active;

  const { data: latest, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return latest;
}
