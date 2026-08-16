import '@/lib/polyfill-crypto';

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import * as Sentry from '@sentry/react-native';
import { Stack } from 'expo-router';
import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { CrashFallback } from '@/components/shell/crash-fallback';
import { OfflineBanner } from '@/components/ui/offline-banner';
import { ToastHost } from '@/components/ui/toast-host';
import { brand } from '@/constants/brand';
import { queryClient, queryPersistOptions } from '@/lib/query-client';
import { applyDamrooSystemChrome } from '@/lib/system-chrome';
import { AuthProvider } from '@/providers/auth-provider';

// DSN is a public identifier (like an analytics key), safe to ship in the
// client — Sentry's own docs recommend embedding it directly. No-ops when
// unset, e.g. local dev without EXPO_PUBLIC_SENTRY_DSN configured.
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.2,
    // Relied upon to diagnose the "blank screen / total freeze" bug:
    // AppScreen's own watchdog only catches a stuck Reanimated UI-thread
    // transform — its setTimeout can't fire if the JS thread itself is
    // blocked. App Hang runs independent of JS on iOS's main thread, so it
    // still fires and captures a real stack trace when the JS thread wedges.
    // iOS only — Android's equivalent (ANR, >5s main-thread block) is
    // handled automatically by the native Sentry Android SDK via the Expo
    // config plugin already in app.json, no JS-level option to tune. Kept
    // at the SDK default (2s): no known legitimate synchronous work in this
    // app runs that long.
    enableAppHangTracking: true,
    appHangTimeoutInterval: 2,
  });
}

function RootLayout() {
  useEffect(() => {
    void applyDamrooSystemChrome();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Catches any render-time crash anywhere below (screens, providers,
          everything except this boundary itself) and reports it to Sentry —
          same infrastructure now capturing native crashes — instead of
          taking down the whole app. `resetError` re-renders the subtree
          fresh; if the same persistent state re-triggers the crash
          immediately, that's a real bug to fix, not something a reload
          button can paper over indefinitely. */}
      <Sentry.ErrorBoundary fallback={({ resetError }) => <CrashFallback onReload={resetError} />}>
        <PersistQueryClientProvider client={queryClient} persistOptions={queryPersistOptions}>
          <KeyboardProvider>
            <AuthProvider>
              {/* Transparent system bars; cream canvas shows through */}
              <StatusBar style="dark" />
              <NavigationBar style="dark" />
              <OfflineBanner />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: brand.canvasBottom },
                }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(onboarding)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="generation/[id]"
                  options={{ headerShown: false, title: 'Generation' }}
                />
                <Stack.Screen
                  name="edit-profile"
                  options={{ headerShown: false, title: 'Edit profile' }}
                />
                <Stack.Screen
                  name="template/[id]"
                  options={{ headerShown: true, title: 'Template' }}
                />
              </Stack>
              <ToastHost />
            </AuthProvider>
          </KeyboardProvider>
        </PersistQueryClientProvider>
      </Sentry.ErrorBoundary>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
