import { useAuthStore } from '@/stores/auth-store';

/** Thin selector hook for session + onboarding gate state. */
export function useSession() {
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const onboardingCompleted = useAuthStore((s) => s.onboardingCompleted);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isProfileReady = useAuthStore((s) => s.isProfileReady);

  return {
    session,
    user,
    profile,
    onboardingCompleted,
    isHydrated,
    isProfileReady,
    isSignedIn: !!session,
  };
}
