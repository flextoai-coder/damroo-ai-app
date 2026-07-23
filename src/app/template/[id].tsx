import { useRouter, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { brand } from '@/constants/brand';
import { loadTemplateIntoPlayground } from '@/services/remix-template';
import { fetchTemplateById } from '@/services/templates';

/** Deep-link / stack entry: load template into Playground and navigate there. */
export default function TemplateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!id) {
        setError('Missing template id');
        return;
      }
      try {
        const template = await fetchTemplateById(id);
        if (cancelled) return;
        if (!template) {
          setError('Template not found');
          return;
        }
        loadTemplateIntoPlayground(template);
        router.replace('/(tabs)/assistant' as Href);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to open template');
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  return (
    <View style={styles.container}>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <>
          <ActivityIndicator color={brand.orange} />
          <Text style={styles.subtitle}>Opening in Playground…</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.canvasBottom,
    padding: 24,
    gap: 12,
  },
  subtitle: {
    color: brand.muted,
    fontWeight: '600',
  },
  error: {
    color: '#B91C1C',
    fontWeight: '700',
    textAlign: 'center',
  },
});
