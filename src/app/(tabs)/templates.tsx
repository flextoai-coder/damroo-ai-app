import { useLocalSearchParams, useRouter, useScrollToTop, type Href } from 'expo-router';
import { useRef, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { PosterCard } from '@/components/home/poster-card';
import { AppScreen } from '@/components/shell/app-screen';
import { ModuleSwitcher } from '@/components/shell/module-switcher';
import { TemplateConfigureSheet } from '@/components/templates/template-configure-sheet';
import { TemplatesEmptyState } from '@/components/templates/empty-state';
import { TemplateFilterChips } from '@/components/templates/filter-chips';
import { TemplateSearchBar } from '@/components/templates/search-bar';
import { SkeletonGrid } from '@/components/ui/skeleton';
import { brand } from '@/constants/brand';
import type { TemplateIndustryFilter } from '@/constants/templates';
import { useTabScreenPadding } from '@/hooks/use-screen-padding';
import { useTabBarScroll } from '@/hooks/use-tab-bar-scroll';
import { useTemplateConfigureFlow } from '@/hooks/use-template-configure-flow';
import { useFilteredTemplates } from '@/hooks/use-templates';
import { loadTemplateIntoPlayground } from '@/services/remix-template';

const SIDE = 22;
const GAP = 14;

export default function TemplatesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const scrollProps = useTabBarScroll();
  const screenPadding = useTabScreenPadding();
  const { industry: industryParam } = useLocalSearchParams<{ industry?: string }>();
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState<TemplateIndustryFilter>(industryParam || 'all');
  const [appliedIndustryParam, setAppliedIndustryParam] = useState(industryParam);

  // The tab screen can already be mounted from an earlier visit, so a fresh
  // `?industry=` param (e.g. tapping "View all" again with a different
  // business industry) needs to re-apply the filter, not just seed it once.
  if (industryParam && industryParam !== appliedIndustryParam) {
    setAppliedIndustryParam(industryParam);
    setIndustry(industryParam);
  }

  const { templates, industries, isLoading, isRefetching, refetch, isError } =
    useFilteredTemplates(search, industry);

  const colWidth = (width - SIDE * 2 - GAP) / 2;

  const configureFlow = useTemplateConfigureFlow({
    onComplete: (template, selections) => {
      loadTemplateIntoPlayground(template, selections);
      router.push('/(tabs)/assistant' as Href);
    },
  });

  const openTemplate = (id: string) => {
    const template = templates.find((t) => t.id === id);
    if (!template) return;
    configureFlow.open(template);
  };

  return (
    <AppScreen edges={[]} glowBlobs contentStyle={styles.screen}>
      <ScrollView
        ref={scrollRef}
        {...scrollProps}
        style={styles.scroll}
        contentContainerStyle={[styles.content, screenPadding]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={brand.orange}
          />
        }>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Templates</Text>
          </View>
          <ModuleSwitcher />
        </View>

        <TemplateSearchBar value={search} onChangeText={setSearch} />
        <TemplateFilterChips
          active={industry}
          industries={industries}
          onChange={setIndustry}
        />

        {isLoading ? (
          <SkeletonGrid screenWidth={width} itemHeight={196} />
        ) : isError ? (
          <View style={styles.loader}>
            <Text style={styles.errorText}>Couldn’t load templates. Pull to refresh.</Text>
          </View>
        ) : templates.length === 0 ? (
          <TemplatesEmptyState />
        ) : (
          <View style={styles.grid}>
            {templates.map((template) => (
              <View key={template.id} style={{ width: colWidth }}>
                <PosterCard
                  variant="grid"
                  title={template.title}
                  industry={template.industry}
                  ribbon={template.source === 'official' ? null : template.source}
                  previewPath={template.preview_storage_path}
                  onPress={() => openTemplate(template.id)}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <TemplateConfigureSheet
        visible={configureFlow.visible}
        template={configureFlow.template}
        config={configureFlow.config}
        onFinish={configureFlow.finish}
        onCancel={configureFlow.cancel}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    // Top/bottom padding applied via useTabScreenPadding (safe-area aware).
  },
  header: {
    paddingHorizontal: SIDE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: brand.ink,
    letterSpacing: -0.5,
  },
  grid: {
    marginTop: 18,
    paddingHorizontal: SIDE,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  loader: {
    paddingTop: 72,
    alignItems: 'center',
  },
  errorText: {
    color: brand.muted,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
