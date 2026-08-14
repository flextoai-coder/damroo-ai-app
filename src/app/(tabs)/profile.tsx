import { useQueryClient } from '@tanstack/react-query';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useScrollToTop, type Href } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BrandKitShortcut } from '@/components/profile/brand-kit-shortcut';
import {
  BuildingIcon,
  CancelSubscriptionIcon,
  EditPencilIcon,
  GlobeIcon,
  PersonIcon,
  ReceiptIcon,
  SparkPlanIcon,
} from '@/components/profile/icons';
import { PlanPickerSheet } from '@/components/profile/plan-picker-sheet';
import { ProfileRow } from '@/components/profile/profile-row';
import { ProfileSection } from '@/components/profile/section';
import { UpgradeCard } from '@/components/profile/upgrade-card';
import { AppScreen } from '@/components/shell/app-screen';
import { brand } from '@/constants/brand';
import type { Plan, PlanId } from '@/constants/plans';
import { useBrandKitSwatches } from '@/hooks/use-brand-kit';
import { useTabScreenPadding } from '@/hooks/use-screen-padding';
import { useSession } from '@/hooks/use-session';
import { planDisplayName, useSubscription } from '@/hooks/use-subscription';
import { useTabBarScroll } from '@/hooks/use-tab-bar-scroll';
import { toUserErrorMessage } from '@/lib/errors';
import { resizedImageUrl } from '@/lib/image-transform';
import { deleteAccount, signOut } from '@/services/auth';
import { fetchProfile } from '@/services/profile';
import {
  isUserCancelledPurchase,
  manageSubscription,
  purchaseErrorMessage,
  purchasePlan,
} from '@/services/purchases';
import { useAuthStore } from '@/stores/auth-store';
import { useChatComposerStore } from '@/stores/chat-composer-store';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { usePlaygroundStore } from '@/stores/playground-store';
import { toast } from '@/stores/toast-store';

export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const scrollProps = useTabBarScroll();
  const screenPadding = useTabScreenPadding();
  const { profile, user } = useSession();
  const setProfile = useAuthStore((s) => s.setProfile);
  const subscriptionQuery = useSubscription();
  const { colors: brandSwatches } = useBrandKitSwatches();
  const [signingOut, setSigningOut] = useState(false);
  const [refreshingProfile, setRefreshingProfile] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const fullName =
    profile?.full_name ??
    (user?.user_metadata?.full_name as string | undefined) ??
    'Creator';
  const businessName = profile?.business_name?.trim() || 'Add your business';
  const industry = profile?.industry?.trim() || 'Add industry';
  const website = profile?.website?.trim() || 'Add website';
  const avatarUrl =
    profile?.avatar_url ?? (user?.user_metadata?.avatar_url as string | undefined) ?? null;
  const initials = fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  const subscription = subscriptionQuery.data;
  const isPaid = subscription?.status === 'active';
  const planLabel = isPaid ? planDisplayName(subscription.plan) : 'No active plan';
  const creditsLeft = isPaid ? subscription.credits_remaining : 0;
  const planBillingValue = isPaid
    ? `${planDisplayName(subscription.plan)} · ${creditsLeft} credits left`
    : 'No active plan';

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

  const onCancelSubscription = async () => {
    try {
      await manageSubscription();
    } catch (e) {
      toast(toUserErrorMessage(e, 'Couldn’t open subscription management'), 'error');
    }
  };

  const confirmCancelSubscription = () => {
    const store = Platform.OS === 'ios' ? 'App Store' : 'Play Store';
    Alert.alert(
      'Cancel subscription?',
      `This opens the ${store}, where you manage or cancel your Damroo subscription — Apple and Google require cancellation to go through their own subscription settings.`,
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Continue', onPress: () => void onCancelSubscription() },
      ],
    );
  };

  const currentPlanId =
    isPaid && subscription?.plan
      ? (subscription.plan as PlanId)
      : null;

  const onEdit = () => {
    router.push('/edit-profile' as Href);
  };

  const onSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch (e) {
      if (__DEV__) console.error('[profile] Sign out error:', e);
      Alert.alert('Sign out failed', 'An error occurred');
    } finally {
      setSigningOut(false);
    }
  };

  const confirmSignOut = () => {
    Alert.alert('Sign out?', 'You’ll need to sign in again to use Damroo.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void onSignOut() },
    ]);
  };

  const onDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      await deleteAccount();
      queryClient.clear();
      useChatComposerStore.getState().reset();
      useOnboardingStore.getState().reset();
      usePlaygroundStore.getState().clear();
      useAuthStore.getState().reset();
    } catch (e) {
      if (__DEV__) console.error('[profile] Delete account error:', e);
      Alert.alert('Delete account failed', 'An error occurred');
    } finally {
      setDeletingAccount(false);
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This permanently deletes all your generations, brand kit, and subscription history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'There is no way to recover your account or data once it’s deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete forever',
                  style: 'destructive',
                  onPress: () => void onDeleteAccount(),
                },
              ],
            );
          },
        },
      ],
    );
  };

  const comingSoon = (label: string) => {
    Alert.alert(label, 'This action will be available in a later billing/social pass.');
  };

  return (
    <AppScreen edges={[]} glowBlobs contentStyle={styles.screen} tabIndex={3}>
      <ScrollView
        ref={scrollRef}
        {...scrollProps}
        style={styles.scroll}
        contentContainerStyle={[styles.content, screenPadding]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={subscriptionQuery.isRefetching || refreshingProfile || signingOut}
            onRefresh={() => {
              void subscriptionQuery.refetch();
              if (!user?.id) return;
              setRefreshingProfile(true);
              void fetchProfile(user.id)
                .then((p) => {
                  if (p) setProfile(p);
                })
                .finally(() => setRefreshingProfile(false));
            }}
            tintColor={brand.orange}
          />
        }>
        {/* 1. Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* 2. Identity */}
        <View style={styles.identity}>
          <LinearGradient
            colors={[brand.orange, brand.orangeDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarRing}>
            <View style={styles.avatarInner}>
              {avatarUrl ? (
                <Image
                  source={{ uri: resizedImageUrl(avatarUrl, { width: 64, height: 64 }) }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              ) : (
                <Text style={styles.avatarInitials}>{initials || 'D'}</Text>
              )}
            </View>
          </LinearGradient>

          <View style={styles.identityCopy}>
            <Text style={styles.name} numberOfLines={1}>
              {fullName}
            </Text>
            <Text style={styles.business} numberOfLines={1}>
              {businessName}
            </Text>
            <View style={styles.planPill}>
              <Text style={styles.planPillText}>{planLabel}</Text>
            </View>
          </View>

          <Pressable
            onPress={onEdit}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
            style={styles.editHit}>
            <BlurView intensity={40} tint="light" style={styles.editBtn}>
              <View style={styles.gearInner}>
                <EditPencilIcon />
              </View>
            </BlurView>
          </Pressable>
        </View>

        {/* 3. Upgrade hero */}
        {!isPaid ? <UpgradeCard onPress={openPlans} /> : null}

        {/* 4. Brand Kit */}
        <BrandKitShortcut
          onPress={() => router.push('/(tabs)/brand-kit' as Href)}
          colors={brandSwatches.length ? brandSwatches : undefined}
        />

        {/* 5. Account & Business */}
        <ProfileSection title="Account & Business">
          <ProfileRow
            icon={<PersonIcon />}
            label="Name"
            value={fullName}
            onPress={onEdit}
          />
          <ProfileRow
            icon={<BuildingIcon />}
            label="Business"
            value={businessName}
            onPress={onEdit}
          />
          <ProfileRow
            icon={<SparkPlanIcon />}
            label="Industry"
            value={industry}
            onPress={onEdit}
          />
          <ProfileRow
            icon={<GlobeIcon />}
            label="Website"
            value={website}
            onPress={onEdit}
            last
          />
        </ProfileSection>

        {/* 6. Billing */}
        <ProfileSection title="Billing & Subscription">
          <ProfileRow
            icon={<SparkPlanIcon />}
            label="Current plan"
            value={planBillingValue}
            onPress={openPlans}
          />
          <ProfileRow
            icon={<ReceiptIcon />}
            label="Billing history"
            value="No invoices yet"
            onPress={() => comingSoon('Billing history')}
            last={!isPaid}
          />
          {isPaid ? (
            <ProfileRow
              icon={<CancelSubscriptionIcon />}
              iconTone="rgba(254, 226, 226, 0.85)"
              label="Cancel subscription"
              value={`Manage in the ${Platform.OS === 'ios' ? 'App Store' : 'Play Store'}`}
              onPress={confirmCancelSubscription}
              showChevron={false}
              last
            />
          ) : null}
        </ProfileSection>

        {/* 7. Sign out */}
        <View style={styles.signOutWrap}>
          <Pressable
            onPress={confirmSignOut}
            disabled={signingOut}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            style={({ pressed }) => [
              styles.signOutBtn,
              pressed && styles.signOutBtnPressed,
              signingOut && styles.signOutBtnDisabled,
            ]}>
            {signingOut ? (
              <ActivityIndicator color="#B91C1C" />
            ) : (
              <Text style={styles.signOutLabel}>Sign out</Text>
            )}
          </Pressable>

          <Pressable
            onPress={confirmDeleteAccount}
            disabled={deletingAccount}
            accessibilityRole="button"
            accessibilityLabel="Delete account"
            style={({ pressed }) => [
              styles.deleteBtn,
              pressed && styles.deleteBtnPressed,
              deletingAccount && styles.deleteBtnDisabled,
            ]}>
            {deletingAccount ? (
              <ActivityIndicator color="#B91C1C" />
            ) : (
              <Text style={styles.deleteLabel}>Delete account</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      <PlanPickerSheet
        visible={plansOpen}
        onClose={() => setPlansOpen(false)}
        currentPlanId={currentPlanId}
        onSelectPlan={onSelectPlan}
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
    paddingHorizontal: 22,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: brand.ink,
    letterSpacing: -0.5,
  },
  gearInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: {
    marginTop: 14,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2.5,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: brand.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '800',
    color: brand.orangeDeep,
  },
  identityCopy: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: brand.ink,
    letterSpacing: -0.3,
  },
  business: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '500',
    color: brand.muted,
  },
  planPill: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.45)',
    backgroundColor: 'rgba(255,237,213,0.65)',
  },
  planPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: brand.orangeDeep,
  },
  editHit: {
    width: 40,
    height: 40,
  },
  editBtn: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.95)',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  signOutWrap: {
    marginTop: 28,
    marginBottom: 8,
    paddingHorizontal: 22,
  },
  signOutBtn: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(254, 226, 226, 0.85)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(248, 113, 113, 0.45)',
  },
  signOutBtnPressed: {
    opacity: 0.85,
  },
  signOutBtnDisabled: {
    opacity: 0.7,
  },
  signOutLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#B91C1C',
  },
  deleteBtn: {
    marginTop: 28,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnPressed: {
    opacity: 0.6,
  },
  deleteBtnDisabled: {
    opacity: 0.5,
  },
  deleteLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B91C1C',
  },
});
