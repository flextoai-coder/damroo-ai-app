import '@/lib/polyfill-crypto';

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { OfflineBanner } from '@/components/ui/offline-banner';
import { ToastHost } from '@/components/ui/toast-host';
import { brand } from '@/constants/brand';
import { queryClient, queryPersistOptions } from '@/lib/query-client';
import { applyDamrooSystemChrome } from '@/lib/system-chrome';
import { AuthProvider } from '@/providers/auth-provider';

export default function RootLayout() {
  useEffect(() => {
    void applyDamrooSystemChrome();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
    </GestureHandlerRootView>
  );
}
