import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PersonIcon, StarIcon } from '@/components/onboarding/icons';
import { LabeledField } from '@/components/onboarding/labeled-field';
import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { useSession } from '@/hooks/use-session';
import { saveOnboardingStep1 } from '@/services/onboarding';
import { useOnboardingStore } from '@/stores/onboarding-store';

export default function BusinessOnboardingScreen() {
  const router = useRouter();
  const { user, profile } = useSession();
  const fullName = useOnboardingStore((s) => s.fullName);
  const businessName = useOnboardingStore((s) => s.businessName);
  const setField = useOnboardingStore((s) => s.setField);
  const hydrateFromProfile = useOnboardingStore((s) => s.hydrateFromProfile);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    hydrateFromProfile({
      fullName: profile.full_name ?? '',
      businessName: profile.business_name ?? '',
      website: profile.website ?? '',
      instagramHandle: profile.instagram_handle ?? '',
      linkedinProfile: profile.linkedin_profile ?? '',
      businessDetails: profile.business_details ?? '',
    });
  }, [profile, hydrateFromProfile]);

  const canContinue =
    fullName.trim().length > 0 && businessName.trim().length > 0;

  const onContinue = async () => {
    setError(null);
    if (!user?.id) {
      setError('You need to be signed in to continue.');
      return;
    }
    if (!canContinue) return;

    setBusy(true);
    try {
      await saveOnboardingStep1(user.id, { fullName, businessName });
      router.push('/(onboarding)/business-type');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your profile');
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingShell
      step={1}
      title="Let's set up your studio"
      subtitle="Tell us who you are and the business you create content for."
      primaryLabel="Continue"
      primaryDisabled={!canContinue}
      primaryLoading={busy}
      onPrimary={() => void onContinue()}>
      <View style={styles.fields}>
        <LabeledField
          label="Your name"
          icon={<PersonIcon />}
          value={fullName}
          onChangeText={(value) => setField('fullName', value)}
          placeholder="e.g. Aarav Shah"
          autoCapitalize="words"
          autoCorrect={false}
          textContentType="name"
          autoComplete="name"
        />
        <LabeledField
          label="Business name"
          icon={<StarIcon />}
          value={businessName}
          onChangeText={(value) => setField('businessName', value)}
          placeholder="e.g. Brew & Bloom Cafe"
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  fields: {
    gap: 16,
  },
  error: {
    marginTop: 14,
    color: '#DC2626',
    fontSize: 13,
    textAlign: 'center',
  },
});
