import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ImageViewerModal } from '@/components/generation/image-viewer-modal';
import { SelectImagesSheet } from '@/components/generation/select-images-sheet';
import { PlanPickerSheet } from '@/components/profile/plan-picker-sheet';
import { AppScreen } from '@/components/shell/app-screen';
import { DownloadIcon, UploadIcon } from '@/components/shell/tab-icons';
import { GenerationDetailSkeleton } from '@/components/ui/skeleton';
import { brand } from '@/constants/brand';
import type { Plan, PlanId } from '@/constants/plans';
import { formatById } from '@/constants/playground';
import { SHEET_SPRING } from '@/constants/sheet-motion';
import { useHomeGenerations } from '@/hooks/use-home-data';
import { useSession } from '@/hooks/use-session';
import { useSubscription } from '@/hooks/use-subscription';
import { track } from '@/lib/analytics';
import { isPlanUpgradeError, toUserErrorMessage } from '@/lib/errors';
import { resizedImageUrl } from '@/lib/image-transform';
import { requestSaveToGalleryAccess } from '@/lib/media-permissions';
import { saveImageToGallery } from '@/lib/save-image';
import { shareImage } from '@/lib/share-image';
import {
  fetchGenerationById,
  fetchLatestCaption,
  isPurged,
  primaryAssetUrl,
} from '@/services/generations';
import { generateCaption, generateImage, waitForGeneration } from '@/services/playground';
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
      <Text style={styles.prompt} selectable numberOfLines={expanded ? undefined : 3}>
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
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
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

  // Same reverse-chronological list the Home grid shows — reused here purely
  // to know which generation is "next" (older) / "previous" (newer) relative
  // to this one for swipe navigation. If this generation isn't in that list
  // (e.g. a deep link past the 40-item window), swiping simply has nowhere
  // to go and just springs back — no error state needed.
  const homeGenerationsQuery = useHomeGenerations();
  const orderedIds = useMemo(
    () => (homeGenerationsQuery.data ?? []).map((g) => g.id),
    [homeGenerationsQuery.data],
  );
  const currentIndex = id ? orderedIds.indexOf(id) : -1;
  const nextId = currentIndex >= 0 ? (orderedIds[currentIndex + 1] ?? null) : null;
  const prevId = currentIndex > 0 ? (orderedIds[currentIndex - 1] ?? null) : null;

  // Prefetch neighbours (generation + its caption) so a committed swipe
  // resolves from cache instantly instead of showing a loading skeleton.
  useEffect(() => {
    if (!user?.id) return;
    for (const neighbourId of [nextId, prevId]) {
      if (!neighbourId) continue;
      void queryClient.prefetchQuery({
        queryKey: ['generation', neighbourId, user.id],
        queryFn: () => fetchGenerationById(user.id, neighbourId),
      });
      void queryClient.prefetchQuery({
        queryKey: ['caption', neighbourId],
        queryFn: () => fetchLatestCaption(neighbourId),
      });
    }
  }, [nextId, prevId, user?.id, queryClient]);

  const dragX = useSharedValue(0);

  const navigateToGeneration = (targetId: string) => {
    dragX.value = 0;
    // Update this screen's own route param in place — no new stack entry,
    // no native push/replace transition. The Reanimated slide above is the
    // only motion that should play; a `router.replace` here would also
    // trigger the Stack navigator's own screen-transition animation on top
    // of it, which reads as the whole screen reopening.
    router.setParams({ id: targetId });
    // Same screen instance persists across setParams, unlike a full
    // navigation — reset per-generation UI state that would otherwise leak
    // from the generation being left.
    setCaption(null);
    setModifyPrompt('');
    setCarouselIndex(0);
  };

  // Swipe left → next (older) generation, swipe right → previous (newer),
  // mirroring the reverse-chronological Home grid order. Only attached
  // around the single-image view and the prompt/caption/remix content below
  // it — the multi-image-per-generation carousel above keeps its own
  // horizontal paging untouched so the two horizontal gestures never compete
  // for the same touch.
  const pageSwipe = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      dragX.value = e.translationX;
    })
    .onEnd((e) => {
      const goingNext = e.translationX < 0;
      const target = goingNext ? nextId : prevId;
      const passedThreshold =
        Math.abs(e.translationX) > 70 || Math.abs(e.velocityX) > 800;

      if (target && passedThreshold) {
        const sign = goingNext ? -1 : 1;
        dragX.value = withTiming(sign * windowWidth, { duration: 220 }, (finished) => {
          if (finished) runOnJS(navigateToGeneration)(target);
        });
      } else {
        dragX.value = withSpring(0, SHEET_SPRING);
      }
    });

  const pageSwipeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dragX.value }],
  }));

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
      const { generationId } = await generateImage({
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
      // generateImage now returns as soon as the row exists — the provider
      // call runs in the background, so wait for it here rather than
      // navigating to a generation that has no images yet.
      const outcome = await waitForGeneration(generationId);
      if (outcome.status !== 'completed') {
        throw new Error(outcome.errorMessage ?? 'Couldn’t modify image');
      }
      void subscriptionQuery.refetch();
      void queryClient.invalidateQueries({ queryKey: ['generations', 'home', user.id] });
      setModifyPrompt('');
      toast('Image updated', 'success');
      track('generation_modify', { source_generation_id: generation.id });
      router.replace(`/generation/${generationId}` as Href);
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
        ) : isPurged(generation) ? (
          <View style={styles.purgedWrap}>
            <View style={styles.purgedFrame}>
              <Text style={styles.purgedIcon}>🕐</Text>
            </View>
            <Text style={styles.section}>Prompt</Text>
            <TruncatablePrompt key={generation.id} text={generation.prompt} />
            <Text style={styles.purgedNotice}>
              This image was automatically removed after 7 days. The prompt is still saved here.
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
                    <Pressable
                      key={url}
                      onPress={() => setViewerUrl(url)}
                      style={{ width: windowWidth - 44 }}
                      accessibilityRole="imagebutton"
                      accessibilityLabel="View full-resolution image">
                      <Image
                        source={{
                          uri: resizedImageUrl(url, {
                            width: windowWidth - 44,
                            height: (windowWidth - 44) / formatById(generation.aspect_ratio).ratio,
                          }),
                        }}
                        style={[styles.image, { width: windowWidth - 44 }]}
                        contentFit="cover"
                      />
                    </Pressable>
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
            ) : null}

            {/*
              Swipe left/right here moves to the next/previous generation in
              the same reverse-chronological order as the Home grid. Scoped
              to the single-image frame + the content below it so it never
              competes with the multi-image carousel's own horizontal paging
              above (both are horizontal gestures — nesting them under the
              same detector would make them fight over the same touch).
            */}
            <GestureDetector gesture={pageSwipe}>
              <Animated.View style={pageSwipeStyle}>
                {allImageUrls.length <= 1 ? (
                  <Pressable
                    onPress={() => imageUrl && setViewerUrl(imageUrl)}
                    disabled={!imageUrl}
                    style={[
                      styles.frame,
                      { aspectRatio: formatById(generation.aspect_ratio).ratio },
                    ]}
                    accessibilityRole="imagebutton"
                    accessibilityLabel="View full-resolution image">
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
                  </Pressable>
                ) : null}

                <Text style={styles.section}>Prompt</Text>
                <TruncatablePrompt key={generation.id} text={generation.prompt} />

                {displayCaption ? (
                  <>
                    <Text style={styles.section}>Caption</Text>
                    <Text style={styles.prompt} selectable>
                      {displayCaption}
                    </Text>
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
              </Animated.View>
            </GestureDetector>
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

      <ImageViewerModal
        visible={viewerUrl !== null}
        onClose={() => setViewerUrl(null)}
        url={viewerUrl}
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
  purgedWrap: { paddingTop: 8 },
  purgedFrame: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    backgroundColor: brand.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  purgedIcon: { fontSize: 40, opacity: 0.5 },
  purgedNotice: {
    marginTop: 14,
    fontSize: 13,
    lineHeight: 19,
    color: brand.muted,
  },
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
