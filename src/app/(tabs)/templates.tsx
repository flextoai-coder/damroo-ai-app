import { BlurView } from 'expo-blur';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { PosterCard } from '@/components/home/poster-card';
import { AppScreen } from '@/components/shell/app-screen';
import { TemplatesEmptyState } from '@/components/templates/empty-state';
import { TemplateFilterChips } from '@/components/templates/filter-chips';
import { TemplateSearchBar } from '@/components/templates/search-bar';
import { brand } from '@/constants/brand';
import type { TemplateIndustryFilter } from '@/constants/templates';
import { useTabScreenPadding } from '@/hooks/use-screen-padding';
import { useFilteredTemplates } from '@/hooks/use-templates';
import { useTabBarScroll } from '@/hooks/use-tab-bar-scroll';
import { loadTemplateIntoPlayground } from '@/services/remix-template';

const SIDE = 22;
const GAP = 14;

export default function TemplatesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const scrollProps = useTabBarScroll();
  const screenPadding = useTabScreenPadding();
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState<TemplateIndustryFilter>('all');

  const { templates, industries, isLoading, isRefetching, refetch, isError } =
    useFilteredTemplates(search, industry);

  const colWidth = (width - SIDE * 2 - GAP) / 2;

  const openTemplate = (id: string) => {
    const template = templates.find((t) => t.id === id);
    if (!template) return;
    loadTemplateIntoPlayground(template);
    router.push('/(tabs)/assistant' as Href);
  };

  return (
    <AppScreen edges={[]} glowBlobs contentStyle={styles.screen}>
      <ScrollView
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
            <Text style={styles.subtitle}>Tap any design to open it in Playground</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            style={styles.bellHit}>
            <BlurView intensity={40} tint="light" style={styles.bell}>
              <View style={styles.bellInner}>
                <BellIcon />
              </View>
            </BlurView>
          </Pressable>
        </View>

        <TemplateSearchBar value={search} onChangeText={setSearch} />
        <TemplateFilterChips
          active={industry}
          industries={industries}
          onChange={setIndustry}
        />

        {isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={brand.orange} />
          </View>
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
                  ribbon={template.source}
                  previewPath={template.preview_storage_path}
                  onPress={() => openTemplate(template.id)}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}

function BellIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6.5 9.5a5.5 5.5 0 0111 0c0 3.2 1.2 4.6 1.8 5.3H4.7c.6-.7 1.8-2.1 1.8-5.3z"
        stroke={brand.ink}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path
        d="M10 18.5a2 2 0 004 0"
        stroke={brand.ink}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
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
    alignItems: 'flex-start',
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
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '500',
    color: brand.muted,
    lineHeight: 18,
  },
  bellHit: {
    width: 44,
    height: 44,
  },
  bell: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.95)',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  bellInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
