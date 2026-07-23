import { queryClient } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';
import { useAuthStore, type Profile } from '@/stores/auth-store';
import type { TablesInsert, TablesUpdate } from '@/types/database';

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Ensure a profiles row exists for the signed-in user.
 * Email/OAuth signups can race the trigger or skip it; upsert covers that.
 */
export async function ensureProfile(userId: string): Promise<Profile> {
  const existing = await fetchProfile(userId);
  if (existing) {
    return existing;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const insert: TablesInsert<'profiles'> = {
    id: userId,
    email: user?.email ?? null,
    full_name:
      (user?.user_metadata?.full_name as string | undefined) ??
      (user?.user_metadata?.name as string | undefined) ??
      null,
    avatar_url: (user?.user_metadata?.avatar_url as string | undefined) ?? null,
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(insert, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export type ProfileUpdate = TablesUpdate<'profiles'>;

export async function updateProfile(
  userId: string,
  patch: ProfileUpdate,
): Promise<Profile> {
  await ensureProfile(userId);

  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...patch }, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export type ProfileDetailsInput = {
  fullName: string;
  businessName: string;
  industry: string;
  website: string;
  instagramHandle: string;
  linkedinProfile: string;
  businessDetails: string;
};

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Profile screen save — validates required fields then syncs auth store. */
export async function saveProfileDetails(
  userId: string,
  input: ProfileDetailsInput,
): Promise<Profile> {
  const fullName = input.fullName.trim();
  const businessName = input.businessName.trim();
  const industry = input.industry.trim();

  if (!fullName) {
    throw new Error('Please enter your name.');
  }
  if (!businessName) {
    throw new Error('Please enter your business name.');
  }
  if (!industry) {
    throw new Error('Please choose your industry.');
  }

  const profile = await updateProfile(userId, {
    full_name: fullName,
    business_name: businessName,
    industry,
    website: emptyToNull(input.website),
    instagram_handle: emptyToNull(input.instagramHandle),
    linkedin_profile: emptyToNull(input.linkedinProfile),
    business_details: emptyToNull(input.businessDetails),
  });

  useAuthStore.getState().setProfile(profile);
  void queryClient.invalidateQueries({ queryKey: ['templates', 'home'] });
  return profile;
}
