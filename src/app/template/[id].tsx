import { useRouter, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { TemplateConfigureSheet } from '@/components/templates/template-configure-sheet';
import { brand } from '@/constants/brand';
import { useTemplateConfigureFlow } from '@/hooks/use-template-configure-flow';
import { loadTemplateIntoPlayground } from '@/services/remix-template';
import { fetchTemplateById } from '@/services/templates';

/** Deep-link / stack entry: load template into Playground and navigate there. */
export default function TemplateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const configureFlow = useTemplateConfigureFlow({
    onComplete: (template, selections) => {
      loadTemplateIntoPlayground(template, selections);
      router.replace('/(tabs)/assistant' as Href);
    },
    onCancel: () => {
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)/templates' as Href);
    },
  });

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
        configureFlow.open(template);
      } catch (e) {
        if (!cancelled) {
          if (__DEV__) console.error('[template] Failed to load template:', e);
          setError('An error occurred');
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      <TemplateConfigureSheet
        visible={configureFlow.visible}
        template={configureFlow.template}
        config={configureFlow.config}
        onFinish={configureFlow.finish}
        onCancel={configureFlow.cancel}
      />
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
