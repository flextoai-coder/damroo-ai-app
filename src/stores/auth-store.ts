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
  /**
   * False while a just-signed-in session has no synced profile yet — the
   * route gate must wait for this before choosing onboarding vs. tabs, or it
   * flashes onboarding for a returning user (profile sync is deliberately
   * deferred a tick after setSession to avoid deadlocking the auth callback).
   */
  isProfileReady: boolean;
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
  isProfileReady: false,
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,
  setSession: (session) =>
    set((state) => {
      const nextUserId = session?.user?.id ?? null;
      const prevUserId = state.user?.id ?? null;
      return {
        session,
        user: session?.user ?? null,
        // A different (or newly-signed-in) user means the profile we have,
        // if any, no longer applies — block routing until it re-syncs.
        isProfileReady: nextUserId === prevUserId ? state.isProfileReady : nextUserId === null,
      };
    }),
  setProfile: (profile) =>
    set({
      profile,
      onboardingCompleted: profile?.onboarding_completed ?? false,
      isProfileReady: true,
    }),
  setHydrated: (isHydrated) => set({ isHydrated }),
  reset: () => set({ ...initialState, isHydrated: true, isProfileReady: true }),
}));
