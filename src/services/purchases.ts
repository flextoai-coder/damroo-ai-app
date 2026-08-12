import { Linking, Platform } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesError } from 'react-native-purchases';

import { PLANS, type Plan, type PlanId } from '@/constants/plans';

const IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? '';
const ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? '';
/** Must match `android.package` / `ios.bundleIdentifier` in app.json. */
const ANDROID_PACKAGE_NAME = 'ai.damroo.app';

let configuredUserId: string | null = null;

function apiKeyForPlatform(): string | null {
  if (Platform.OS === 'ios') return IOS_API_KEY || null;
  if (Platform.OS === 'android') return ANDROID_API_KEY || null;
  return null;
}

function productIdForPlatform(plan: Plan): string | null {
  if (Platform.OS === 'ios') return plan.appleProductId;
  if (Platform.OS === 'android') return plan.androidProductId;
  return null;
}

/**
 * Ties RevenueCat's app_user_id to our Supabase user id so the revenuecat-webhook
 * Edge Function can credit the right account. Call once a session exists.
 */
export function configureRevenueCat(userId: string) {
  if (configuredUserId === userId) return;

  const apiKey = apiKeyForPlatform();
  if (!apiKey) return; // web, or keys not set up yet

  Purchases.configure({ apiKey, appUserID: userId });
  configuredUserId = userId;
}

export async function logOutRevenueCat() {
  if (!configuredUserId) return;

  try {
    await Purchases.logOut();
  } catch {
    // Already anonymous — safe to ignore.
  } finally {
    configuredUserId = null;
  }
}

export function isUserCancelledPurchase(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      (error as PurchasesError).userCancelled === true,
  );
}

export function purchaseErrorMessage(_error: unknown): string {
  // Never surface the raw RevenueCat/StoreKit/Play Billing error text to the user.
  return 'Purchase failed. Please try again.';
}

/** Buys `planId` through the native store (App Store / Play Store) via RevenueCat. */
export async function purchasePlan(planId: PlanId): Promise<CustomerInfo> {
  const apiKey = apiKeyForPlatform();
  if (!apiKey) {
    throw new Error('Purchases are not supported on this platform.');
  }

  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) {
    throw new Error(`Unknown plan: ${planId}`);
  }

  const productId = productIdForPlatform(plan);
  if (!productId) {
    throw new Error(`No store product configured for ${plan.name} on this platform.`);
  }

  const offerings = await Purchases.getOfferings();
  const availablePackages = offerings.current?.availablePackages ?? [];
  const pkg = availablePackages.find((p) => p.product.identifier === productId);

  if (!pkg) {
    throw new Error(
      `${plan.name} isn't available for purchase right now. Check the RevenueCat offering configuration.`,
    );
  }

  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

/**
 * Opens the native subscription-management surface so the user can cancel or
 * change their plan. Neither Apple nor Google let an app cancel a
 * subscription on the user's behalf — this has to go through their own UI.
 */
export async function manageSubscription(): Promise<void> {
  if (Platform.OS === 'ios') {
    await Purchases.showManageSubscriptions();
    return;
  }
  if (Platform.OS === 'android') {
    await Linking.openURL(
      `https://play.google.com/store/account/subscriptions?package=${ANDROID_PACKAGE_NAME}`,
    );
    return;
  }
  throw new Error('Subscription management is not supported on this platform.');
}
