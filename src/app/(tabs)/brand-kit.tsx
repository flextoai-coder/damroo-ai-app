import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ColorField } from '@/components/brand-kit/color-field';
import { MultiSelectField, SelectField } from '@/components/brand-kit/select-field';
import { AppScreen } from '@/components/shell/app-screen';
import { brand } from '@/constants/brand';
import {
  BRAND_FONT_SUGGESTIONS,
  BRAND_TONE_SUGGESTIONS,
  formatMultiSelect,
  multiSelectOptions,
  parseMultiSelect,
} from '@/constants/brand-kit';
import { useBrandKit } from '@/hooks/use-brand-kit';
import { useTabScreenPadding } from '@/hooks/use-screen-padding';
import { useSession } from '@/hooks/use-session';
import { useTabBarScroll } from '@/hooks/use-tab-bar-scroll';
import { toUserErrorMessage } from '@/lib/errors';
import { requestPhotoLibraryAccess } from '@/lib/media-permissions';
import {
  brandLogoSignedUrl,
  removeBrandLogo,
  saveBrandKit,
  uploadBrandLogo,
} from '@/services/brand-kit';
import { toast } from '@/stores/toast-store';

function typographyOptions(current: string): string[] {
  const trimmed = current.trim();
  if (trimmed && !(BRAND_FONT_SUGGESTIONS as readonly string[]).includes(trimmed)) {
    return [trimmed, ...BRAND_FONT_SUGGESTIONS];
  }
  return [...BRAND_FONT_SUGGESTIONS];
}

export default function BrandKitScreen() {
  const { user } = useSession();
  const scrollProps = useTabBarScroll();
  const screenPadding = useTabScreenPadding();
  const brandKitQuery = useBrandKit();

  const [primaryColor, setPrimaryColor] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [accentColor, setAccentColor] = useState('');
  const [fontStyle, setFontStyle] = useState('');
  const [toneOfVoice, setToneOfVoice] = useState<string[]>([]);
  const [brandKeywords, setBrandKeywords] = useState('');
  const [styleNotes, setStyleNotes] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const kit = brandKitQuery.data;
    if (!kit) return;
    setPrimaryColor(kit.primary_color ?? '');
    setSecondaryColor(kit.secondary_color ?? '');
    setAccentColor(kit.accent_color ?? '');
    setFontStyle(kit.font_style ?? '');
    setToneOfVoice(parseMultiSelect(kit.tone_of_voice ?? ''));
    setBrandKeywords(kit.brand_keywords ?? '');
    setStyleNotes(kit.style_notes ?? '');
    setLogoPath(kit.logo_storage_path);
    void brandLogoSignedUrl(kit.logo_storage_path).then(setLogoUrl);
  }, [brandKitQuery.data]);

  const onSave = async () => {
    if (!user?.id) return;
    setError(null);
    setSaving(true);
    try {
      await saveBrandKit(user.id, {
        primaryColor,
        secondaryColor,
        accentColor,
        fontStyle,
        toneOfVoice: formatMultiSelect(toneOfVoice),
        brandKeywords,
        styleNotes,
      });
      toast('Brand kit saved', 'success');
    } catch (e) {
      setError(toUserErrorMessage(e, 'Could not save brand kit'));
    } finally {
      setSaving(false);
    }
  };

  const onPickLogo = async () => {
    if (!user?.id) return;
    const granted = await requestPhotoLibraryAccess();
    if (!granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]?.uri) return;

    setUploadingLogo(true);
    setError(null);
    try {
      const kit = await uploadBrandLogo(user.id, result.assets[0].uri);
      setLogoPath(kit.logo_storage_path);
      setLogoUrl(await brandLogoSignedUrl(kit.logo_storage_path));
      toast('Logo uploaded', 'success');
    } catch (e) {
      setError(toUserErrorMessage(e, 'Could not upload logo'));
    } finally {
      setUploadingLogo(false);
    }
  };

  const onRemoveLogo = async () => {
    if (!user?.id) return;
    setUploadingLogo(true);
    try {
      await removeBrandLogo(user.id, logoPath);
      setLogoPath(null);
      setLogoUrl(null);
      toast('Logo removed', 'success');
    } catch (e) {
      setError(toUserErrorMessage(e, 'Could not remove logo'));
    } finally {
      setUploadingLogo(false);
    }
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
            refreshing={brandKitQuery.isRefetching}
            onRefresh={() => void brandKitQuery.refetch()}
            tintColor={brand.orange}
          />
        }>
        <Text style={styles.title}>Brand Kit</Text>
        <Text style={styles.subtitle}>
          Colors, logo and voice used to steer your image prompts.
        </Text>

        {brandKitQuery.isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={brand.orange} />
          </View>
        ) : (
          <>
            <View style={styles.previewCard}>
              <Text style={styles.sectionTitle}>Preview</Text>
              <View style={styles.previewRow}>
                {[primaryColor, secondaryColor, accentColor].map((hex, i) => (
                  <View
                    key={`${hex}-${i}`}
                    style={[
                      styles.previewSwatch,
                      {
                        backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(hex)
                          ? hex
                          : 'rgba(148,163,184,0.25)',
                      },
                    ]}
                  />
                ))}
              </View>
              {toneOfVoice.length > 0 ? (
                <Text style={styles.previewTone} numberOfLines={2}>
                  {formatMultiSelect(toneOfVoice)}
                </Text>
              ) : (
                <Text style={styles.previewToneMuted}>Add a tone to shape creative voice</Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Colors</Text>
              <View style={styles.stack}>
                <ColorField label="Primary" value={primaryColor} onChange={setPrimaryColor} />
                <ColorField label="Secondary" value={secondaryColor} onChange={setSecondaryColor} />
                <ColorField label="Accent" value={accentColor} onChange={setAccentColor} />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Logo</Text>
              <View style={styles.logoCard}>
                <View style={styles.logoPreview}>
                  {logoUrl ? (
                    <Image source={{ uri: logoUrl }} style={styles.logoImage} contentFit="contain" />
                  ) : (
                    <Text style={styles.logoPlaceholder}>No logo</Text>
                  )}
                </View>
                <View style={styles.logoActions}>
                  <Pressable
                    onPress={() => void onPickLogo()}
                    disabled={uploadingLogo}
                    style={styles.secondaryBtn}>
                    {uploadingLogo ? (
                      <ActivityIndicator color={brand.orangeDeep} />
                    ) : (
                      <Text style={styles.secondaryBtnLabel}>
                        {logoUrl ? 'Replace logo' : 'Upload logo'}
                      </Text>
                    )}
                  </Pressable>
                  {logoPath ? (
                    <Pressable onPress={() => void onRemoveLogo()} disabled={uploadingLogo}>
                      <Text style={styles.removeLabel}>Remove</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Typography</Text>
              <SelectField
                label="Font style"
                value={fontStyle}
                onChange={setFontStyle}
                options={typographyOptions(fontStyle)}
                placeholder="Select typography"
                sheetTitle="Typography"
                sheetSubtitle="Choose the style that matches your brand"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tone of voice</Text>
              <MultiSelectField
                label="Voice traits"
                values={toneOfVoice}
                onChange={setToneOfVoice}
                options={multiSelectOptions(toneOfVoice, BRAND_TONE_SUGGESTIONS)}
                placeholder="Select tone of voice"
                sheetTitle="Tone of voice"
                sheetSubtitle="Pick one or more"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Brand keywords</Text>
              <TextInput
                value={brandKeywords}
                onChangeText={setBrandKeywords}
                placeholder="artisan, local, vibrant"
                placeholderTextColor={brand.mutedSoft}
                style={styles.field}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Style notes</Text>
              <TextInput
                value={styleNotes}
                onChangeText={setStyleNotes}
                placeholder="Always leave space for Hindi headline. Avoid neon greens."
                placeholderTextColor={brand.mutedSoft}
                multiline
                style={[styles.field, styles.multiline]}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              onPress={() => void onSave()}
              disabled={saving}
              style={({ pressed }) => [styles.saveHit, (saving || pressed) && styles.saveHitDim]}>
              <LinearGradient
                colors={[brand.orange, brand.orangeDeep]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.saveBtn}>
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveLabel}>Save brand kit</Text>
                )}
              </LinearGradient>
            </Pressable>
          </>
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 22 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: brand.ink,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 20,
    fontSize: 14,
    fontWeight: '500',
    color: brand.muted,
    lineHeight: 20,
  },
  loader: {
    paddingTop: 48,
    alignItems: 'center',
  },
  previewCard: {
    marginBottom: 22,
    borderRadius: 20,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.95)',
    padding: 16,
    gap: 12,
  },
  previewRow: {
    flexDirection: 'row',
    gap: 10,
  },
  previewSwatch: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderCurve: 'continuous',
  },
  previewTone: {
    fontSize: 13,
    fontWeight: '600',
    color: brand.ink,
  },
  previewToneMuted: {
    fontSize: 13,
    fontWeight: '500',
    color: brand.mutedSoft,
  },
  section: {
    marginBottom: 24,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: brand.muted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  stack: {
    gap: 18,
  },
  logoCard: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    borderRadius: 18,
    borderCurve: 'continuous',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    padding: 12,
  },
  logoPreview: {
    width: 72,
    height: 72,
    borderRadius: 18,
    borderCurve: 'continuous',
    backgroundColor: brand.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    fontSize: 12,
    fontWeight: '700',
    color: brand.muted,
  },
  logoActions: {
    flex: 1,
    gap: 10,
  },
  secondaryBtn: {
    minHeight: 42,
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: brand.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  secondaryBtnLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: brand.orangeDeep,
  },
  removeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B91C1C',
  },
  field: {
    minHeight: 52,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: brand.ink,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(148,163,184,0.35)',
  },
  chipActive: {
    backgroundColor: brand.orangeSoft,
    borderColor: 'rgba(249,115,22,0.45)',
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: brand.muted,
  },
  chipLabelActive: {
    color: brand.orangeDeep,
  },
  error: {
    marginBottom: 12,
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  saveHit: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 12,
  },
  saveHitDim: {
    opacity: 0.7,
  },
  saveBtn: {
    minHeight: 54,
    borderRadius: 18,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
