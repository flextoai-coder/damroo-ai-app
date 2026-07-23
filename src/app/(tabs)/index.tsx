import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { FestivalCta } from '@/components/home/festival-cta';
import { GenerationCard, NewDesignTile } from '@/components/home/generation-card';
import { GenerationsGrid } from '@/components/home/generations-grid';
import { HomeRail } from '@/components/home/home-rail';
import { PosterCard } from '@/components/home/poster-card';
import { SectionHead } from '@/components/home/section-head';
import { AppScreen } from '@/components/shell/app-screen';
import { ModuleSwitcher } from '@/components/shell/module-switcher';
import { brand } from '@/constants/brand';
import { useHomeGenerations, useHomeTemplates } from '@/hooks/use-home-data';
import { useTabScreenPadding } from '@/hooks/use-screen-padding';
import { useSession } from '@/hooks/use-session';
import { useTabBarScroll } from '@/hooks/use-tab-bar-scroll';
import { primaryAssetUrl } from '@/services/generations';
import { loadTemplateIntoPlayground } from '@/services/remix-template';

const PLACEHOLDER_GENERATIONS = [
  { id: 'p1', title: 'Weekend Brunch', createdAt: daysAgo(2) },
  { id: 'p2', title: 'Diwali Dhamaka', createdAt: daysAgo(4) },
  { id: 'p3', title: 'New Menu Drop', createdAt: daysAgo(6) },
] as const;

const PLACEHOLDER_TEMPLATES = [
  { id: 't1', title: 'Story Sale', industry: 'Retail' },
  { id: 't2', title: 'Menu Special', industry: 'Cafe' },
  { id: 't3', title: 'Launch Teaser', industry: 'Ecommerce' },
  { id: 't4', title: 'Offer Burst', industry: 'Restaurant' },
] as const;

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

export default function HomeScreen() {
  const router = useRouter();
  const { profile, user } = useSession();
  const scrollProps = useTabBarScroll();
  const screenPadding = useTabScreenPadding();
  const generationsQuery = useHomeGenerations();
  const templatesQuery = useHomeTemplates();
  const scrollRef = useRef<ScrollView>(null);
  const generationsY = useRef(0);

  const fullName =
    profile?.full_name ??
    (user?.user_metadata?.full_name as string | undefined) ??
    'Creator';
  const firstName = fullName.trim().split(/\s+/)[0] || 'Creator';
  const avatarUrl =
    profile?.avatar_url ?? (user?.user_metadata?.avatar_url as string | undefined) ?? null;
  const initials = firstName.slice(0, 1).toUpperCase();

  const generations = generationsQuery.data ?? [];
  const templates = templatesQuery.data ?? [];
  const refreshing = generationsQuery.isRefetching || templatesQuery.isRefetching;

  const openPlayground = () => {
    router.push('/(tabs)/assistant' as Href);
  };

  const openProfile = () => {
    router.push('/(tabs)/profile' as Href);
  };

  const openTemplates = () => {
    router.push('/(tabs)/templates' as Href);
  };

  const openGeneration = (id: string, isPlaceholder = false) => {
    if (isPlaceholder) {
      openPlayground();
      return;
    }
    router.push(`/generation/${id}` as Href);
  };

  const scrollToGenerations = () => {
    scrollRef.current?.scrollTo({
      y: Math.max(0, generationsY.current - 12),
      animated: true,
    });
  };

  const latestRailItems =
    generations.length > 0
      ? generations.slice(0, 8).map((g) => ({
          id: g.id,
          title: g.prompt.trim().slice(0, 28) || 'Untitled',
          createdAt: g.created_at,
          imageUrl: primaryAssetUrl(g),
          placeholder: false,
        }))
      : PLACEHOLDER_GENERATIONS.map((p) => ({
          id: p.id,
          title: p.title,
          createdAt: p.createdAt,
          imageUrl: null as string | null,
          placeholder: true,
        }));

  const templateRailItems =
    templates.length > 0
      ? templates.map((t) => ({
          id: t.id,
          title: t.title,
          industry: t.industry,
          category: t.category,
          source: t.source,
          previewPath: t.preview_storage_path,
          placeholder: false as const,
          template: t,
        }))
      : PLACEHOLDER_TEMPLATES.map((t) => ({
          id: t.id,
          title: t.title,
          industry: profile?.industry ?? t.industry,
          category: undefined,
          source: null,
          previewPath: null as string | null,
          placeholder: true as const,
          template: null,
        }));

  return (
    <AppScreen edges={[]} glowBlobs contentStyle={styles.screenContent}>
      <ScrollView
        ref={scrollRef}
        {...scrollProps}
        style={styles.scroll}
        contentContainerStyle={[styles.content, screenPadding]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void generationsQuery.refetch();
              void templatesQuery.refetch();
            }}
            tintColor={brand.orange}
          />
        }>
        {/* 1. Top bar */}
        <View style={styles.topBar}>
          <Pressable
            onPress={openProfile}
            style={styles.profileRow}
            accessibilityRole="button"
            accessibilityLabel="Open profile">
            <LinearGradient
              colors={[brand.orange, brand.orangeDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarRing}>
              <View style={styles.avatarInner}>
                {avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={styles.avatarImage}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={styles.avatarInitial}>{initials}</Text>
                )}
              </View>
            </LinearGradient>
            <View style={styles.welcomeCopy}>
              <Text style={styles.welcomeEyebrow}>Welcome back</Text>
              <Text style={styles.welcomeName} numberOfLines={1}>
                {firstName} 👋
              </Text>
            </View>
          </Pressable>
          <ModuleSwitcher />
        </View>

        {/* 2. Latest Generations by You */}
        <SectionHead title="Latest Generations by You" onViewAll={scrollToGenerations} />
        <HomeRail>
          {latestRailItems.map((item) => (
            <GenerationCard
              key={item.id}
              title={item.title}
              createdAt={item.createdAt}
              imageUrl={item.imageUrl}
              placeholder={item.placeholder}
              onPress={() => openGeneration(item.id, item.placeholder)}
            />
          ))}
          <NewDesignTile onPress={openPlayground} />
        </HomeRail>

        {/* 3. Festival CTA */}
        <FestivalCta onPress={openPlayground} />

        {/* 4. Based on your business */}
        <SectionHead
          title="Based on your business"
          onViewAll={openTemplates}
        />
        {templatesQuery.isLoading ? (
          <View style={styles.railLoader}>
            <ActivityIndicator color={brand.orange} />
          </View>
        ) : (
          <HomeRail>
            {templateRailItems.map((item) => (
              <PosterCard
                key={item.id}
                title={item.title}
                industry={item.industry}
                category={item.category}
                ribbon={item.source}
                previewPath={item.previewPath}
                onPress={() => {
                  if (item.placeholder || !item.template) {
                    openTemplates();
                    return;
                  }
                  loadTemplateIntoPlayground(item.template);
                  openPlayground();
                }}
              />
            ))}
          </HomeRail>
        )}

        {/* 6. Full generations view */}
        <View
          onLayout={(e) => {
            generationsY.current = e.nativeEvent.layout.y;
          }}>
          <SectionHead title="Your generations" />
        </View>
        {generationsQuery.isLoading ? (
          <View style={styles.gridLoader}>
            <ActivityIndicator color={brand.orange} />
          </View>
        ) : (
          <GenerationsGrid
            generations={generations}
            onPressGeneration={(id) => openGeneration(id)}
            onCreate={openPlayground}
          />
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    // Top/bottom padding applied via useTabScreenPadding (safe-area aware).
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 22,
    marginBottom: 22,
  },
  profileRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  avatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 2,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: brand.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: brand.orangeDeep,
  },
  welcomeCopy: {
    flex: 1,
    minWidth: 0,
  },
  welcomeEyebrow: {
    fontSize: 12,
    fontWeight: '600',
    color: brand.muted,
  },
  welcomeName: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: '800',
    color: brand.ink,
    letterSpacing: -0.3,
  },
  railLoader: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  gridLoader: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
