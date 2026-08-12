import { useRouter, useSegments } from 'expo-router';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import { type PropsWithChildren, useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { brand } from '@/constants/brand';
import { createSessionFromUrl } from '@/services/auth';
import { ensureProfile } from '@/services/profile';
import { configureRevenueCat } from '@/services/purchases';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';

void SplashScreen.preventAutoHideAsync();

export async function syncProfile(userId: string | undefined) {
  const { setProfile } = useAuthStore.getState();
  if (!userId) {
    setProfile(null);
    return;
  }

  try {
    // Create the row if the signup trigger missed (common with email/password).
    const profile = await ensureProfile(userId);
    setProfile(profile);
  } catch {
    setProfile(null);
    return;
  }

  try {
    // Ties RevenueCat's app_user_id to this Supabase user for the webhook to
    // match. Isolated from the profile try/catch above — a purchases-SDK
    // failure (e.g. unavailable in Expo Go, or a bad key) must never wipe
    // an otherwise-successful profile fetch.
    configureRevenueCat(userId);
  } catch {
    // Purchases just won't work this session; nothing else should degrade.
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const segments = useSegments();
  const setSession = useAuthStore((s) => s.setSession);
  const setHydrated = useAuthStore((s) => s.setHydrated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const session = useAuthStore((s) => s.session);
  const onboardingCompleted = useAuthStore((s) => s.onboardingCompleted);
  const isProfileReady = useAuthStore((s) => s.isProfileReady);
  const routingRef = useRef(false);
  // Hydrated, and — whenever a session exists — its profile has synced, so
  // onboardingCompleted is trustworthy before we route anywhere.
  const readyToRoute = isHydrated && (!session || isProfileReady);

  // Hydrate session + subscribe to auth changes
  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      setSession(data.session);
      await syncProfile(data.session?.user?.id);
      setHydrated(true);
      await SplashScreen.hideAsync();
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      // Do not await inside this callback — it deadlocks exchangeCodeForSession / setSession.
      setSession(nextSession);
      setTimeout(() => {
        void syncProfile(nextSession?.user?.id);
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setHydrated, setSession]);

  // Handle OAuth deep-link returns while app is open / cold-started
  useEffect(() => {
    const handleUrl = async (url: string) => {
      if (!url.includes('auth/callback') && !url.includes('access_token')) {
        return;
      }
      try {
        await createSessionFromUrl(url);
      } catch {
        // Ignore malformed callback URLs
      }
    };

    void Linking.getInitialURL().then((url) => {
      if (url) void handleUrl(url);
    });

    const sub = Linking.addEventListener('url', ({ url }) => {
      void handleUrl(url);
    });

    return () => sub.remove();
  }, []);

  // Route gate
  useEffect(() => {
    if (!readyToRoute || routingRef.current) return;

    const root = segments[0];
    const inAuthGroup = root === '(auth)';
    const inOnboardingGroup = root === '(onboarding)';
    const inTabsGroup = root === '(tabs)';

    if (!session) {
      if (!inAuthGroup) {
        routingRef.current = true;
        router.replace('/(auth)/login');
        queueMicrotask(() => {
          routingRef.current = false;
        });
      }
      return;
    }

    if (!onboardingCompleted) {
      if (!inOnboardingGroup) {
        routingRef.current = true;
        router.replace('/(onboarding)/business');
        queueMicrotask(() => {
          routingRef.current = false;
        });
      }
      return;
    }

    if (inAuthGroup || inOnboardingGroup || root === undefined) {
      if (!inTabsGroup) {
        routingRef.current = true;
        router.replace('/(tabs)');
        queueMicrotask(() => {
          routingRef.current = false;
        });
      }
    }
  }, [readyToRoute, session, onboardingCompleted, segments, router]);

  if (!readyToRoute) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color="#208AEF" />
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.canvasBottom,
  },
});
