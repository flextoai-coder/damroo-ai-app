import { useRouter } from 'expo-router';
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
import { useSession } from '@/hooks/use-session';
import { hasCompletedRequiredOnboardingSteps } from '@/lib/onboarding';
import { completeOnboarding } from '@/services/onboarding';
import { useOnboardingStore } from '@/stores/onboarding-store';

export default function LinksOnboardingScreen() {
  const router = useRouter();
  const { user } = useSession();
  const draft = useOnboardingStore();
  const [busy, setBusy] = useState<'finish' | 'skip' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const finishOnboarding = async (includeOptionalLinks: boolean) => {
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

    setBusy(includeOptionalLinks ? 'finish' : 'skip');
    try {
      await completeOnboarding(user.id, draft, { includeOptionalLinks });
      // AuthProvider route gate sends completed users out of onboarding.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your profile');
    } finally {
      setBusy(null);
    }
  };

  return (
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
      onSkip={() => void finishOnboarding(false)}
      onPrimary={() => void finishOnboarding(true)}>
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
