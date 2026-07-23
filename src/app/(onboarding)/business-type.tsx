import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BusinessTypeCard } from '@/components/onboarding/business-type-card';
import { EditIcon } from '@/components/onboarding/icons';
import { LabeledField } from '@/components/onboarding/labeled-field';
import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { BUSINESS_TYPES } from '@/constants/business-types';
import { useSession } from '@/hooks/use-session';
import { resolveIndustry } from '@/lib/onboarding';
import { saveOnboardingStep2 } from '@/services/onboarding';
import { useOnboardingStore } from '@/stores/onboarding-store';

export default function BusinessTypeOnboardingScreen() {
  const router = useRouter();
  const { user } = useSession();
  const fullName = useOnboardingStore((s) => s.fullName);
  const businessName = useOnboardingStore((s) => s.businessName);
  const businessTypeId = useOnboardingStore((s) => s.businessTypeId);
  const customBusinessType = useOnboardingStore((s) => s.customBusinessType);
  const setField = useOnboardingStore((s) => s.setField);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue = Boolean(
    resolveIndustry(businessTypeId, customBusinessType),
  );

  const rows = [
    BUSINESS_TYPES.slice(0, 2),
    BUSINESS_TYPES.slice(2, 4),
    BUSINESS_TYPES.slice(4, 6),
  ];

  const onContinue = async () => {
    setError(null);
    if (!user?.id) {
      setError('You need to be signed in to continue.');
      return;
    }
    if (!canContinue) return;

    setBusy(true);
    try {
      await saveOnboardingStep2(user.id, {
        fullName,
        businessName,
        businessTypeId,
        customBusinessType,
      });
      router.push('/(onboarding)/links');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your profile');
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingShell
      step={2}
      title="What kind of business is it?"
      subtitle="We tune templates and tone to fit your industry."
      primaryLabel="Continue"
      primaryDisabled={!canContinue}
      primaryLoading={busy}
      onBack={() => router.back()}
      onPrimary={() => void onContinue()}>
      <View style={styles.grid}>
        {rows.map((row) => (
          <View key={row.map((t) => t.id).join('-')} style={styles.row}>
            {row.map((type) => (
              <BusinessTypeCard
                key={type.id}
                type={type}
                selected={businessTypeId === type.id}
                onPress={() => setField('businessTypeId', type.id)}
              />
            ))}
          </View>
        ))}
      </View>

      {businessTypeId === 'others' ? (
        <View style={styles.othersField}>
          <LabeledField
            label="Tell us your business type"
            icon={<EditIcon />}
            value={customBusinessType}
            onChangeText={(value) => setField('customBusinessType', value)}
            placeholder="e.g. Wedding photography"
            autoCapitalize="sentences"
          />
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  othersField: {
    marginTop: 18,
  },
  error: {
    marginTop: 14,
    color: '#DC2626',
    fontSize: 13,
    textAlign: 'center',
  },
});
