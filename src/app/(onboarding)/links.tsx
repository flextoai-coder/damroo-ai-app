import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  EditIcon,
  GlobeIcon,
  InstagramIcon,
  LinkedInIcon,
} from '@/components/onboarding/icons';
import { LabeledField } from '@/components/onboarding/labeled-field';
import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { PlanPickerSheet } from '@/components/profile/plan-picker-sheet';
import type { Plan } from '@/constants/plans';
import { useSession } from '@/hooks/use-session';
import { hasCompletedRequiredOnboardingSteps } from '@/lib/onboarding';
import { completeOnboarding } from '@/services/onboarding';
import {
  isUserCancelledPurchase,
  purchaseErrorMessage,
  purchasePlan,
} from '@/services/purchases';
import { useOnboardingStore } from '@/stores/onboarding-store';

export default function LinksOnboardingScreen() {
  const router = useRouter();
  const { user } = useSession();
  const draft = useOnboardingStore();
  const [busy, setBusy] = useState<'finish' | 'skip' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [plansOpen, setPlansOpen] = useState(false);
  const [pendingIncludeOptionalLinks, setPendingIncludeOptionalLinks] = useState(false);

  const requestPlan = (includeOptionalLinks: boolean) => {
    setError(null);

    if (!user?.id) {
      setError('You need to be signed in to continue.');
      return;
    }

    if (!hasCompletedRequiredOnboardingSteps(draft)) {
      setError('Complete your name, business, and industry first (2 of 3 steps).');
      router.replace('/(onboarding)/business');
      return;
    }

    setPendingIncludeOptionalLinks(includeOptionalLinks);
    setPlansOpen(true);
  };

  /**
   * A plan is nice-to-have here, not required — Home already prompts unpaid
   * users to subscribe. Every exit from the plan picker (buy, decline, close,
   * or cancel mid-purchase) finishes onboarding and lands on Home so the user
   * is never stuck on this screen.
   */
  const finishOnboarding = async () => {
    if (!user?.id) {
      setError('You need to be signed in to continue.');
      return;
    }

    setBusy(pendingIncludeOptionalLinks ? 'finish' : 'skip');
    try {
      await completeOnboarding(user.id, draft, {
        includeOptionalLinks: pendingIncludeOptionalLinks,
      });
      router.replace('/(tabs)' as Href);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not finish onboarding');
    } finally {
      setBusy(null);
    }
  };

  const onClosePlans = () => {
    setPlansOpen(false);
    void finishOnboarding();
  };

  const onSelectPlan = async (plan: Plan) => {
    setPlansOpen(false);

    if (!user?.id) {
      setError('You need to be signed in to continue.');
      return;
    }

    setBusy(pendingIncludeOptionalLinks ? 'finish' : 'skip');
    try {
      await purchasePlan(plan.id);
    } catch (e) {
      setBusy(null);
      if (isUserCancelledPurchase(e)) {
        await finishOnboarding();
      } else {
        setError(purchaseErrorMessage(e));
      }
      return;
    }

    try {
      await completeOnboarding(user.id, draft, {
        includeOptionalLinks: pendingIncludeOptionalLinks,
      });
      router.replace('/(tabs)' as Href);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not finish onboarding');
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <OnboardingShell
        step={3}
        title="Add your links"
        titleMutedLine="(optional)"
        subtitle="We pull colors, logo and tone from these to auto-brand your content."
        primaryLabel="Finish"
        primaryDisabled={false}
        primaryLoading={busy === 'finish'}
        showSkip
        skipLoading={busy === 'skip'}
        onBack={() => router.back()}
        onSkip={() => requestPlan(false)}
        onPrimary={() => requestPlan(true)}>
        <View style={styles.fields}>
          <LabeledField
            label="Website"
            icon={<GlobeIcon />}
            value={draft.website}
            onChangeText={(value) => draft.setField('website', value)}
            placeholder="brewandbloom.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            textContentType="URL"
            autoComplete="url"
          />
          <LabeledField
            label="Instagram"
            icon={<InstagramIcon />}
            value={draft.instagramHandle}
            onChangeText={(value) => draft.setField('instagramHandle', value)}
            placeholder="@brewandbloom"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <LabeledField
            label="LinkedIn"
            icon={<LinkedInIcon />}
            value={draft.linkedinProfile}
            onChangeText={(value) => draft.setField('linkedinProfile', value)}
            placeholder="company/brewandbloom"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <LabeledField
            label="Business details"
            icon={<EditIcon />}
            value={draft.businessDetails}
            onChangeText={(value) => draft.setField('businessDetails', value)}
            placeholder="Specialty coffee & bakery, Pune"
            autoCapitalize="sentences"
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </OnboardingShell>

      <PlanPickerSheet
        visible={plansOpen}
        onClose={onClosePlans}
        onSelectPlan={(plan) => void onSelectPlan(plan)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fields: {
    gap: 14,
  },
  error: {
    marginTop: 14,
    color: '#DC2626',
    fontSize: 13,
    textAlign: 'center',
  },
});
