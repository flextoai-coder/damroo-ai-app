import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SelectImagesSheet } from '@/components/generation/select-images-sheet';
import { PlanPickerSheet } from '@/components/profile/plan-picker-sheet';
import { AppScreen } from '@/components/shell/app-screen';
import { DownloadIcon, UploadIcon } from '@/components/shell/tab-icons';
import { GenerationDetailSkeleton } from '@/components/ui/skeleton';
import { brand } from '@/constants/brand';
import type { Plan, PlanId } from '@/constants/plans';
import { formatById } from '@/constants/playground';
import { useSession } from '@/hooks/use-session';
import { useSubscription } from '@/hooks/use-subscription';
import { track } from '@/lib/analytics';
import { isPlanUpgradeError, toUserErrorMessage } from '@/lib/errors';
import { resizedImageUrl } from '@/lib/image-transform';
import { requestSaveToGalleryAccess } from '@/lib/media-permissions';
import { saveImageToGallery } from '@/lib/save-image';
import { shareImage } from '@/lib/share-image';
import { fetchGenerationById, fetchLatestCaption, primaryAssetUrl } from '@/services/generations';
import { generateCaption, generateImage } from '@/services/playground';
import {
  isUserCancelledPurchase,
  purchaseErrorMessage,
  purchasePlan,
} from '@/services/purchases';
import { toast } from '@/stores/toast-store';

/**
 * Clamps to 3 lines with a "Show more" toggle, only when the text actually
 * overflows. Keyed by the caller so remounting on a new generation/prompt
 * resets state naturally instead of needing an effect.
 */
function TruncatablePrompt({ text }: { text: string }) {
  const [truncatable, setTruncatable] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <View>
      {!expanded ? (
        <Text
          style={[styles.prompt, styles.promptMeasure]}
          pointerEvents="none"
          onTextLayout={(e) => setTruncatable(e.nativeEvent.lines.length > 3)}>
          {text}
        </Text>
      ) : null}
      <Text style={styles.prompt} numberOfLines={expanded ? undefined : 3}>
        {text}
      </Text>
      {truncatable ? (
        <Pressable onPress={() => setExpanded((v) => !v)} hitSlop={6} style={styles.showMoreHit}>
          <Text style={styles.showMoreLabel}>{expanded ? 'Show less' : 'Show more'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function GenerationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { user, profile } = useSession();
  const queryClient = useQueryClient();
  const [caption, setCaption] = useState<string | null>(null);
  const [captionBusy, setCaptionBusy] = useState(false);
  const [modifyPrompt, setModifyPrompt] = useState('');
  const [modifying, setModifying] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);
  const [sharingImage, setSharingImage] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const [selectSheetMode, setSelectSheetMode] = useState<'save' | 'share' | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const subscriptionQuery = useSubscription();
  const subscription = subscriptionQuery.data;
  const isPaid = subscription?.status === 'active';
  const currentPlanId =
    isPaid && subscription?.plan ? (subscription.plan as PlanId) : null;
  const creditsRemaining = isPaid ? subscription.credits_remaining : 0;

  const query = useQuery({
    queryKey: ['generation', id, user?.id],
    queryFn: () => fetchGenerationById(user!.id, id!),
    enabled: Boolean(user?.id && id),
  });

  const generation = query.data;
  const imageUrl = generation ? primaryAssetUrl(generation) : null;
  const allImageUrls = generation
    ? generation.generation_assets.map((a) => a.public_url).filter((u): u is string => Boolean(u))
    : [];

  const existingCaptionQuery = useQuery({
    queryKey: ['caption', id],
    queryFn: () => fetchLatestCaption(id!),
    enabled: Boolean(id),
  });

  const displayCaption = caption ?? existingCaptionQuery.data ?? null;

  const onSave = async () => {
    if (!generation || !imageUrl || savingImage) return;

    // More than one image in this generation — let the user pick which ones
    // actually go to their gallery instead of always saving just the first.
    if (allImageUrls.length > 1) {
      setSelectSheetMode('save');
      return;
    }

    setSavingImage(true);
    try {
      const granted = await requestSaveToGalleryAccess();
      if (!granted) return;
      await saveImageToGallery(imageUrl);
      toast('Saved to your photos', 'success');
    } catch (e) {
      toast(toUserErrorMessage(e, 'Couldn’t save image'), 'error');
    } finally {
      setSavingImage(false);
    }
  };

  /** No caption to copy — just hand the image to the share sheet. */
  const shareWithoutCaption = async () => {
    if (!generation) return;
    setSharingImage(true);
    try {
      if (imageUrl) {
        await shareImage(imageUrl, 'Share your design');
      } else {
        await Share.share({ message: generation.prompt ?? 'Made with Damroo AI' });
      }
      track('share_generation', { generation_id: generation.id });
    } catch (e) {
      toast(toUserErrorMessage(e, 'Share failed'), 'error');
    } finally {
      setSharingImage(false);
    }
  };

  /** Caption already exists — copy it, then hand the image to the share sheet. */
  const shareWithCaption = async () => {
    if (!generation || !displayCaption) return;
    setSharingImage(true);
    try {
      await Clipboard.setStringAsync(displayCaption);
      toast('Caption copied', 'success');
      if (imageUrl) {
        await shareImage(imageUrl, 'Share your design');
      } else {
        await Share.share({ message: displayCaption });
      }
      track('share_generation', { generation_id: generation.id });
    } catch (e) {
      toast(toUserErrorMessage(e, 'Share failed'), 'error');
    } finally {
      setSharingImage(false);
    }
  };

  const onShare = () => {
    if (!generation || sharingImage) return;

    // More than one image — let the user pick which one to share instead of
    // always defaulting to the first. Skips the caption-generation prompt
    // below; that flow is specific to the single-image case.
    if (allImageUrls.length > 1) {
      setSelectSheetMode('share');
      return;
    }

    // A caption already exists (from the Caption button, or from a prior
    // "Generate" tap here) — copy + share directly, no need to ask again.
    if (displayCaption) {
      void shareWithCaption();
      return;
    }

    Alert.alert(
      'Generate a caption?',
      'Add an AI-written caption for this image before sharing it.',
      [
        { text: 'No, just share', style: 'cancel', onPress: () => void shareWithoutCaption() },
        // Only generates — doesn't share. The next Share tap picks up the
        // now-generated caption and copies + shares it.
        { text: 'Generate', onPress: () => void onCaption() },
      ],
    );
  };

  const onCaption = async () => {
    if (!generation || captionBusy) return;
    setCaptionBusy(true);
    try {
      const text = await generateCaption({
        generationId: generation.id,
        prompt: generation.prompt,
        businessName: profile?.business_name ?? undefined,
      });
      setCaption(text);
      toast('Caption ready', 'success');
    } catch (e) {
      toast(toUserErrorMessage(e, 'Couldn’t generate caption'), 'error');
    } finally {
      setCaptionBusy(false);
    }
  };

  const openPlans = () => setPlansOpen(true);

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

  const onModify = async () => {
    const text = modifyPrompt.trim();
    if (!text || !generation || !imageUrl || !user?.id || modifying) return;

    if (!isPaid) {
      toast('Choose a plan to start generating.', 'error');
      openPlans();
      return;
    }
    if (creditsRemaining < 1) {
      toast('Not enough credits — pick a plan to continue.', 'error');
      openPlans();
      return;
    }

    setModifying(true);
    try {
      const result = await generateImage({
        userId: user.id,
        prompt: text,
        aspectRatio: generation.aspect_ratio,
        quality: generation.quality,
        imageCount: 1,
        attachments: [
          {
            id: 'modify-source',
            uri: imageUrl,
            kind: 'reference',
            title: 'Original image',
            status: 'ready',
          },
        ],
        conversationId: generation.conversation_id,
      });
      void subscriptionQuery.refetch();
      void queryClient.invalidateQueries({ queryKey: ['generations', 'home', user.id] });
      setModifyPrompt('');
      toast('Image updated', 'success');
      track('generation_modify', { source_generation_id: generation.id });
      router.replace(`/generation/${result.generationId}` as Href);
    } catch (e) {
      const message = toUserErrorMessage(e, 'Couldn’t modify image');
      toast(message, 'error');
      if (isPlanUpgradeError(e) || isPlanUpgradeError(message)) {
        openPlans();
      }
    } finally {
      setModifying(false);
    }
  };

  return (
    <AppScreen edges={[]} glowBlobs contentStyle={styles.screen}>
      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 16,
          },
        ]}
        bottomOffset={24}
        showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backLabel}>← Back</Text>
          </Pressable>
        </View>

        {query.isLoading ? (
          <GenerationDetailSkeleton />
        ) : query.isError || !generation ? (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>Couldn’t load this generation</Text>
            <Text style={styles.emptyBody}>
              {query.isError
                ? toUserErrorMessage(query.error)
                : 'It may have been removed or isn’t available offline.'}
            </Text>
          </View>
        ) : (
          <>
            {allImageUrls.length > 1 ? (
              <>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
                    const frameWidth = windowWidth - 44;
                    const index = Math.round(e.nativeEvent.contentOffset.x / frameWidth);
                    setCarouselIndex(Math.max(0, Math.min(allImageUrls.length - 1, index)));
                  }}
                  style={[styles.frame, { aspectRatio: formatById(generation.aspect_ratio).ratio }]}>
                  {allImageUrls.map((url) => (
                    <Image
                      key={url}
                      source={{
                        uri: resizedImageUrl(url, {
                          width: windowWidth - 44,
                          height: (windowWidth - 44) / formatById(generation.aspect_ratio).ratio,
                        }),
                      }}
                      style={[styles.image, { width: windowWidth - 44 }]}
                      contentFit="cover"
                    />
                  ))}
                </ScrollView>
                <View style={styles.carouselDots}>
                  {allImageUrls.map((url, i) => (
                    <View
                      key={url}
                      style={[styles.carouselDot, i === carouselIndex && styles.carouselDotActive]}
                    />
                  ))}
                </View>
              </>
            ) : (
              <View
                style={[
                  styles.frame,
                  { aspectRatio: formatById(generation.aspect_ratio).ratio },
                ]}>
                {imageUrl ? (
                  <Image
                    source={{
                      uri: resizedImageUrl(imageUrl, {
                        width: windowWidth - 44,
                        height: (windowWidth - 44) / formatById(generation.aspect_ratio).ratio,
                      }),
                    }}
                    style={styles.image}
                    contentFit="cover"
                  />
                ) : (
                  <LinearGradient
                    colors={[brand.orangeSoft, '#FDBA74']}
                    style={styles.image}
                  />
                )}
              </View>
            )}

            <Text style={styles.section}>Prompt</Text>
            <TruncatablePrompt key={generation.id} text={generation.prompt} />

            {displayCaption ? (
              <>
                <Text style={styles.section}>Caption</Text>
                <Text style={styles.prompt}>{displayCaption}</Text>
              </>
            ) : null}

            <View style={styles.actions}>
              <Pressable
                onPress={() => void onCaption()}
                style={styles.secondaryBtn}
                disabled={captionBusy}>
                {captionBusy ? (
                  <ActivityIndicator color={brand.orangeDeep} />
                ) : (
                  <Text style={styles.secondaryLabel}>
                    {displayCaption ? 'Regenerate caption' : 'Generate caption'}
                  </Text>
                )}
              </Pressable>

              <View style={styles.iconActionsRow}>
                <Pressable
                  onPress={() => void onSave()}
                  style={styles.iconBtn}
                  disabled={savingImage || !imageUrl}>
                  {savingImage ? (
                    <ActivityIndicator color={brand.orangeDeep} />
                  ) : (
                    <>
                      <DownloadIcon color={brand.orangeDeep} />
                      <Text style={styles.iconBtnLabel}>Save</Text>
                    </>
                  )}
                </Pressable>
                <Pressable
                  onPress={() => onShare()}
                  style={[styles.iconBtn, styles.iconBtnPrimary]}
                  disabled={sharingImage || captionBusy}>
                  {sharingImage ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <UploadIcon color="#FFFFFF" />
                      <Text style={styles.iconBtnLabelPrimary}>Share</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>

            <Text style={styles.section}>Remix this image</Text>
            <Text style={styles.modifyHint}>
              This image will be used as a reference — describe the change you want.
            </Text>
            <TextInput
              value={modifyPrompt}
              onChangeText={setModifyPrompt}
              placeholder="e.g. Change the background to a beach at sunset"
              placeholderTextColor={brand.mutedSoft}
              multiline
              style={styles.modifyInput}
              editable={!modifying}
            />
            <Pressable
              onPress={() => void onModify()}
              disabled={modifying || !modifyPrompt.trim()}
              style={[
                styles.primaryBtn,
                (modifying || !modifyPrompt.trim()) && styles.primaryBtnDisabled,
              ]}>
              {modifying ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryLabel}>Generate image</Text>
              )}
            </Pressable>
          </>
        )}
      </KeyboardAwareScrollView>

      <PlanPickerSheet
        visible={plansOpen}
        onClose={() => setPlansOpen(false)}
        currentPlanId={currentPlanId}
        onSelectPlan={onSelectPlan}
      />

      <SelectImagesSheet
        visible={selectSheetMode !== null}
        onClose={() => setSelectSheetMode(null)}
        urls={allImageUrls}
        mode={selectSheetMode ?? 'save'}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 22 },
  topRow: { marginBottom: 12 },
  back: { alignSelf: 'flex-start', paddingVertical: 6 },
  backLabel: { fontSize: 15, fontWeight: '700', color: brand.orangeDeep },
  center: { paddingTop: 80, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: brand.ink },
  emptyBody: { fontSize: 14, color: brand.muted, textAlign: 'center', maxWidth: 280 },
  frame: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: brand.orangeSoft,
  },
  image: { width: '100%', height: '100%' },
  carouselDots: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  carouselDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(148,163,184,0.45)',
  },
  carouselDotActive: {
    width: 18,
    backgroundColor: brand.orange,
  },
  section: {
    marginTop: 20,
    marginBottom: 6,
    fontSize: 12,
    fontWeight: '800',
    color: brand.muted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  prompt: { fontSize: 15, lineHeight: 22, color: brand.ink, fontWeight: '500' },
  promptMeasure: {
    position: 'absolute',
    left: 0,
    right: 0,
    opacity: 0,
  },
  showMoreHit: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  showMoreLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: brand.orangeDeep,
  },
  modifyHint: {
    marginBottom: 10,
    fontSize: 13,
    lineHeight: 18,
    color: brand.muted,
  },
  modifyInput: {
    minHeight: 64,
    maxHeight: 140,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: brand.border,
    backgroundColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '500',
    color: brand.ink,
    marginBottom: 12,
  },
  actions: { marginTop: 24, gap: 10 },
  secondaryBtn: {
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.orangeSoft,
  },
  secondaryLabel: { fontSize: 15, fontWeight: '800', color: brand.orangeDeep },
  iconActionsRow: { flexDirection: 'row', gap: 10 },
  iconBtn: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    backgroundColor: brand.orangeSoft,
  },
  iconBtnLabel: { fontSize: 15, fontWeight: '800', color: brand.orangeDeep },
  iconBtnPrimary: { backgroundColor: brand.orange },
  iconBtnLabelPrimary: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  primaryBtn: {
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.orange,
  },
  primaryLabel: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  primaryBtnDisabled: { opacity: 0.45 },
});
