import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BusinessTypeCard } from '@/components/onboarding/business-type-card';
import {
  EditIcon,
  GlobeIcon,
  InstagramIcon,
  LinkedInIcon,
  PersonIcon,
  StarIcon,
} from '@/components/onboarding/icons';
import { LabeledField } from '@/components/onboarding/labeled-field';
import { AppScreen } from '@/components/shell/app-screen';
import { brand } from '@/constants/brand';
import { BUSINESS_TYPES, type BusinessTypeId } from '@/constants/business-types';
import { useSession } from '@/hooks/use-session';
import { toUserErrorMessage } from '@/lib/errors';
import { industryToBusinessType, resolveIndustry } from '@/lib/onboarding';
import { saveProfileDetails } from '@/services/profile';
import { toast } from '@/stores/toast-store';

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useSession();

  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessTypeId, setBusinessTypeId] = useState<BusinessTypeId | null>(null);
  const [customBusinessType, setCustomBusinessType] = useState('');
  const [website, setWebsite] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [linkedinProfile, setLinkedinProfile] = useState('');
  const [businessDetails, setBusinessDetails] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    const mapped = industryToBusinessType(profile.industry);
    setFullName(profile.full_name ?? '');
    setBusinessName(profile.business_name ?? '');
    setBusinessTypeId(mapped.businessTypeId);
    setCustomBusinessType(mapped.customBusinessType);
    setWebsite(profile.website ?? '');
    setInstagramHandle(profile.instagram_handle ?? '');
    setLinkedinProfile(profile.linkedin_profile ?? '');
    setBusinessDetails(profile.business_details ?? '');
  }, [profile]);

  const industry = useMemo(
    () => resolveIndustry(businessTypeId, customBusinessType),
    [businessTypeId, customBusinessType],
  );

  const canSave =
    fullName.trim().length > 0 &&
    businessName.trim().length > 0 &&
    Boolean(industry) &&
    !saving;

  const rows = [
    BUSINESS_TYPES.slice(0, 2),
    BUSINESS_TYPES.slice(2, 4),
    BUSINESS_TYPES.slice(4, 6),
  ];

  const onSave = async () => {
    setError(null);
    if (!user?.id) {
      setError('You need to be signed in to save.');
      return;
    }
    if (!industry || !canSave) return;

    setSaving(true);
    try {
      await saveProfileDetails(user.id, {
        fullName,
        businessName,
        industry,
        website,
        instagramHandle,
        linkedinProfile,
        businessDetails,
      });
      toast('Profile updated', 'success');
      router.back();
    } catch (e) {
      setError(toUserErrorMessage(e, 'Could not save your profile'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen edges={[]} glowBlobs contentStyle={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          style={styles.flex}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: insets.top + 8,
              paddingBottom: insets.bottom + 28,
            },
          ]}>
          <View style={styles.topRow}>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.back}>
              <Text style={styles.backLabel}>← Back</Text>
            </Pressable>
          </View>

          <Text style={styles.title}>Edit profile</Text>
          <Text style={styles.subtitle}>Update how Damroo knows you and your business.</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.fields}>
              <LabeledField
                label="Your name"
                icon={<PersonIcon />}
                value={fullName}
                onChangeText={setFullName}
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
                onChangeText={setBusinessName}
                placeholder="e.g. Brew & Bloom Cafe"
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Industry</Text>
            <View style={styles.grid}>
              {rows.map((row) => (
                <View key={row.map((t) => t.id).join('-')} style={styles.row}>
                  {row.map((type) => (
                    <BusinessTypeCard
                      key={type.id}
                      type={type}
                      selected={businessTypeId === type.id}
                      onPress={() => setBusinessTypeId(type.id)}
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
                  onChangeText={setCustomBusinessType}
                  placeholder="e.g. Wedding photography"
                  autoCapitalize="sentences"
                />
              </View>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Links</Text>
            <Text style={styles.sectionHint}>Optional — used for branding and captions.</Text>
            <View style={styles.fields}>
              <LabeledField
                label="Website"
                icon={<GlobeIcon />}
                value={website}
                onChangeText={setWebsite}
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
                value={instagramHandle}
                onChangeText={setInstagramHandle}
                placeholder="@brewandbloom"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <LabeledField
                label="LinkedIn"
                icon={<LinkedInIcon />}
                value={linkedinProfile}
                onChangeText={setLinkedinProfile}
                placeholder="company/brewandbloom"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <LabeledField
                label="Business details"
                icon={<EditIcon />}
                value={businessDetails}
                onChangeText={setBusinessDetails}
                placeholder="Specialty coffee & bakery, Pune"
                autoCapitalize="sentences"
              />
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            onPress={() => void onSave()}
            disabled={!canSave}
            accessibilityRole="button"
            accessibilityLabel="Save profile"
            style={({ pressed }) => [
              styles.saveHit,
              (!canSave || pressed) && styles.saveHitDim,
            ]}>
            <LinearGradient
              colors={[brand.orange, brand.orangeDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveBtn}>
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveLabel}>Save changes</Text>
              )}
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 22,
  },
  topRow: {
    marginBottom: 10,
  },
  back: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingRight: 12,
  },
  backLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: brand.orangeDeep,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: brand.ink,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '500',
    color: brand.muted,
    marginBottom: 22,
  },
  section: {
    marginBottom: 26,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: brand.muted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  sectionHint: {
    marginTop: -6,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '500',
    color: brand.mutedSoft,
  },
  fields: {
    gap: 14,
  },
  grid: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  othersField: {
    marginTop: 14,
  },
  error: {
    marginBottom: 12,
    color: '#DC2626',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
  saveHit: {
    marginTop: 4,
    borderRadius: 18,
    overflow: 'hidden',
  },
  saveHitDim: {
    opacity: 0.55,
  },
  saveBtn: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  saveLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
