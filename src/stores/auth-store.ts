import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

import type { Tables } from '@/types/database';

export type Profile = Tables<'profiles'>;

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  onboardingCompleted: boolean;
  isHydrated: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setHydrated: (isHydrated: boolean) => void;
  reset: () => void;
};

const initialState = {
  session: null as Session | null,
  user: null as User | null,
  profile: null as Profile | null,
  onboardingCompleted: false,
  isHydrated: false,
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
    }),
  setProfile: (profile) =>
    set({
      profile,
      onboardingCompleted: profile?.onboarding_completed ?? false,
    }),
  setHydrated: (isHydrated) => set({ isHydrated }),
  reset: () => set({ ...initialState, isHydrated: true }),
}));
