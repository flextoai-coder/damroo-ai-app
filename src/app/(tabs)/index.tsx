import type { FlashListRef } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useScrollToTop, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BannerCarousel } from '@/components/home/banner-carousel';
import { ExpiringSoonBanner } from '@/components/home/expiring-soon-banner';
import { ExpiringSoonSheet } from '@/components/home/expiring-soon-sheet';
import { GenerationCard, NewDesignTile } from '@/components/home/generation-card';
import { GenerationsGrid, GRID_CONTAINER_INSET } from '@/components/home/generations-grid';
import { HomeRail } from '@/components/home/home-rail';
import { PosterCard } from '@/components/home/poster-card';
import { RenewalBanner } from '@/components/home/renewal-banner';
import { SectionHead } from '@/components/home/section-head';
import { PlanPickerSheet } from '@/components/profile/plan-picker-sheet';
import { AppScreen } from '@/components/shell/app-screen';
import { ModuleSwitcher } from '@/components/shell/module-switcher';
import { SkeletonRail } from '@/components/ui/skeleton';
import { TemplateConfigureSheet } from '@/components/templates/template-configure-sheet';
import { brand } from '@/constants/brand';
import { nextPlanId, type Plan, type PlanId } from '@/constants/plans';
import { useExpiringSoonGenerations } from '@/hooks/use-expiring-generations';
import {
  useBannerPosition2,
  useHeroBanners,
  useInfiniteGenerations,
  useHomeTemplates,
} from '@/hooks/use-home-data';
import { useTabScreenPadding } from '@/hooks/use-screen-padding';
import { useSession } from '@/hooks/use-session';
import { useSubscription } from '@/hooks/use-subscription';
import { useTabBarScroll } from '@/hooks/use-tab-bar-scroll';
import { useTemplateConfigureFlow } from '@/hooks/use-template-configure-flow';
import { resizedImageUrl } from '@/lib/image-transform';
import { markExpiringNoticeShown, shouldShowExpiringNoticeToday } from '@/lib/expiring-notice-gate';
import type { Generation } from '@/services/generations';
import { isExpiringSoon, primaryAssetUrl } from '@/services/generations';
import {
  isUserCancelledPurchase,
  purchaseErrorMessage,
  purchasePlan,
} from '@/services/purchases';
import { loadTemplateIntoPlayground } from '@/services/remix-template';
import { toast } from '@/stores/toast-store';

const PLACEHOLDER_TEMPLATES = [
  { id: 't1', title: 'Story Sale', industry: 'Retail' },
  { id: 't2', title: 'Menu Special', industry: 'Cafe' },
  { id: 't3', title: 'Launch Teaser', industry: 'Ecommerce' },
  { id: 't4', title: 'Offer Burst', industry: 'Restaurant' },
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const { profile, user } = useSession();
  const scrollProps = useTabBarScroll();
  const screenPadding = useTabScreenPadding();
  const generationsQuery = useInfiniteGenerations();
  const templatesQuery = useHomeTemplates();
  const heroBannersQuery = useHeroBanners();
  const banner2Query = useBannerPosition2();
  const subscriptionQuery = useSubscription();
  const expiringSoonQuery = useExpiringSoonGenerations();
  const listRef = useRef<FlashListRef<Generation>>(null);
  useScrollToTop(listRef);
  const generationsY = useRef(0);
  const [plansOpen, setPlansOpen] = useState(false);
  const [expiringSheetOpen, setExpiringSheetOpen] = useState(false);

  useEffect(() => {
    const items = expiringSoonQuery.data;
    if (!user?.id || !items || items.length === 0) return;
    void (async () => {
      if (await shouldShowExpiringNoticeToday(user.id)) {
        setExpiringSheetOpen(true);
        await markExpiringNoticeShown(user.id);
      }
    })();
  }, [expiringSoonQuery.data, user?.id]);

  const fullName =
    profile?.full_name ??
    (user?.user_metadata?.full_name as string | undefined) ??
    'Creator';
  const firstName = fullName.trim().split(/\s+/)[0] || 'Creator';
  const avatarUrl =
    profile?.avatar_url ?? (user?.user_metadata?.avatar_url as string | undefined) ?? null;
  const initials = firstName.slice(0, 1).toUpperCase();

  const generations = generationsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const templates = templatesQuery.data ?? [];
  const refreshing =
    generationsQuery.isRefetching ||
    templatesQuery.isRefetching ||
    heroBannersQuery.isRefetching ||
    banner2Query.isRefetching;

  const openPlayground = () => {
    router.push('/(tabs)/assistant' as Href);
  };

  const configureFlow = useTemplateConfigureFlow({
    onComplete: (template, selections) => {
      loadTemplateIntoPlayground(template, selections);
      openPlayground();
    },
  });

  const openProfile = () => {
    router.push('/(tabs)/profile' as Href);
  };

  const openTemplates = (industry?: string) => {
    if (industry) {
      router.push(`/(tabs)/templates?industry=${encodeURIComponent(industry)}` as Href);
    } else {
      router.push('/(tabs)/templates' as Href);
    }
  };

  const openGeneration = (id: string) => {
    router.push(`/generation/${id}` as Href);
  };

  const subscription = subscriptionQuery.data;
  const isPaid = subscription?.status === 'active';
  const creditsRemaining = isPaid ? subscription.credits_remaining : 0;
  const currentPlanId = isPaid && subscription?.plan ? (subscription.plan as PlanId) : null;
  const bannerMode: 'renew' | 'upgrade' | null = !isPaid
    ? 'renew'
    : creditsRemaining <= 0
      ? 'upgrade'
      : null;
  const upgradeTargetPlanId = currentPlanId ? nextPlanId(currentPlanId) : null;

  const openPlans = () => {
    setPlansOpen(true);
  };

  const onSelectPlan = async (plan: Plan) => {
    setPlansOpen(false);
    try {
      await purchasePlan(plan.id);
      await subscriptionQuery.refetch();
      toast(`You're on ${plan.name} now!`, 'success');
    } catch (e) {
      if (isUserCancelledPurchase(e)) return;
      toast(purchaseErrorMessage(e), 'error');
    }
  };

  const scrollToGenerations = () => {
    listRef.current?.scrollToOffset({
      offset: Math.max(0, generationsY.current - 12),
      animated: true,
    });
  };

  const onLoadMore = () => {
    if (generationsQuery.hasNextPage && !generationsQuery.isFetchingNextPage) {
      void generationsQuery.fetchNextPage();
    }
  };

  const onRefresh = () => {
    void generationsQuery.refetch();
    void templatesQuery.refetch();
    void heroBannersQuery.refetch();
    void banner2Query.refetch();
  };

  const latestRailItems = generations.slice(0, 8).map((g) => ({
    id: g.id,
    title: g.prompt.trim().slice(0, 28) || 'Untitled',
    createdAt: g.created_at,
    imageUrl: primaryAssetUrl(g),
    expiringSoon: isExpiringSoon(g),
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

  const header = (
    <View style={styles.header}>
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
                  source={{ uri: resizedImageUrl(avatarUrl, { width: 44, height: 44 }) }}
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

      {/* 2. Hero banner carousel */}
      <BannerCarousel banners={heroBannersQuery.data ?? []} loading={heroBannersQuery.isLoading} />

      {/* 3. Renew / upgrade alert */}
      {bannerMode === 'renew' ? (
        <RenewalBanner
          title="No active plan"
          subtitle="Subscribe to keep generating designs"
          ctaLabel="Renew now"
          onPress={openPlans}
        />
      ) : bannerMode === 'upgrade' ? (
        <RenewalBanner
          title="You're out of credits"
          subtitle="Upgrade your plan to keep creating"
          ctaLabel="Upgrade"
          onPress={openPlans}
        />
      ) : null}

      {/* 4. Latest Generations by You */}
      <SectionHead title="Latest Generations by You" onViewAll={scrollToGenerations} />
      <HomeRail>
        <NewDesignTile onPress={openPlayground} />
        {latestRailItems.map((item) => (
          <GenerationCard
            key={item.id}
            title={item.title}
            createdAt={item.createdAt}
            imageUrl={item.imageUrl}
            expiringSoon={item.expiringSoon}
            onPress={() => openGeneration(item.id)}
          />
        ))}
      </HomeRail>

      {/* 4b. Banner Position 2 — just below Latest Generations by You */}
      <BannerCarousel banners={banner2Query.data ?? []} loading={banner2Query.isLoading} />

      {/* 4c. Images expiring soon */}
      <ExpiringSoonBanner
        count={expiringSoonQuery.data?.length ?? 0}
        onPress={() => setExpiringSheetOpen(true)}
      />

      {/* 6. Based on your business */}
      <SectionHead
        title="Based on your business"
        onViewAll={() => openTemplates(profile?.industry ?? undefined)}
      />
      {templatesQuery.isLoading ? (
        <SkeletonRail />
      ) : (
        <HomeRail>
          {templateRailItems.map((item) => (
            <PosterCard
              key={item.id}
              title={item.title}
              industry={item.industry}
              category={item.category}
              ribbon={item.source === 'official' ? null : item.source}
              previewPath={item.previewPath}
              onPress={() => {
                if (item.placeholder || !item.template) {
                  openTemplates(profile?.industry ?? undefined);
                  return;
                }
                configureFlow.open(item.template);
              }}
            />
          ))}
        </HomeRail>
      )}

      {/* 7. Full generations view */}
      <View
        onLayout={(e) => {
          generationsY.current = e.nativeEvent.layout.y;
        }}>
        <SectionHead title="Your generations" />
      </View>
    </View>
  );

  return (
    <AppScreen edges={[]} glowBlobs contentStyle={styles.screenContent} tabIndex={0}>
      <GenerationsGrid
        ref={listRef}
        generations={generations}
        onPressGeneration={(id) => openGeneration(id)}
        onCreate={openPlayground}
        ListHeaderComponent={header}
        loading={generationsQuery.isLoading}
        onLoadMore={onLoadMore}
        hasMore={generationsQuery.hasNextPage}
        loadingMore={generationsQuery.isFetchingNextPage}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onScroll={scrollProps.onScroll}
        scrollEventThrottle={scrollProps.scrollEventThrottle}
        contentContainerStyle={screenPadding}
      />

      <PlanPickerSheet
        visible={plansOpen}
        onClose={() => setPlansOpen(false)}
        currentPlanId={currentPlanId}
        initialPlanId={bannerMode === 'upgrade' ? upgradeTargetPlanId : null}
        onSelectPlan={onSelectPlan}
      />

      <TemplateConfigureSheet
        visible={configureFlow.visible}
        template={configureFlow.template}
        config={configureFlow.config}
        onFinish={configureFlow.finish}
        onCancel={configureFlow.cancel}
      />

      <ExpiringSoonSheet
        visible={expiringSheetOpen}
        onClose={() => setExpiringSheetOpen(false)}
        generations={expiringSoonQuery.data ?? []}
        onSelect={openGeneration}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
  },
  // Cancels GenerationsGrid's shared FlashList contentContainerStyle inset —
  // see GRID_CONTAINER_INSET's doc comment. Every section below already
  // carries its own 22px side padding independently.
  header: {
    marginHorizontal: -GRID_CONTAINER_INSET,
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
});
