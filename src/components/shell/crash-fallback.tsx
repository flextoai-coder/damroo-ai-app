import { Pressable, StyleSheet, Text, View } from 'react-native';

import { brand } from '@/constants/brand';

type CrashFallbackProps = {
  onReload: () => void;
};

/**
 * Shown by the root `Sentry.ErrorBoundary` (see `_layout.tsx`) in place of a
 * hard crash when a render-time error slips past every other guard in the
 * app. Deliberately built from bare React Native primitives only — no
 * safe-area/query/store dependencies — so this can't itself fail to render
 * for the same reason (or a different one) as whatever it's recovering from.
 */
export function CrashFallback({ onReload }: CrashFallbackProps) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.body}>
        Damroo AI ran into an unexpected error. Your generations and account are safe — try
        reloading.
      </Text>
      <Pressable
        onPress={onReload}
        style={styles.reloadPill}
        accessibilityRole="button"
        accessibilityLabel="Reload the app">
        <Text style={styles.reloadLabel}>Tap to reload</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brand.canvasBottom,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: brand.ink,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: brand.muted,
    textAlign: 'center',
    marginBottom: 12,
  },
  reloadPill: {
    backgroundColor: brand.ink,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 22,
    shadowColor: '#0F172A',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  reloadLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
