import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlanPickerSheet } from '@/components/profile/plan-picker-sheet';
import { AppScreen } from '@/components/shell/app-screen';
import { brand } from '@/constants/brand';
import type { Plan, PlanId } from '@/constants/plans';
import { formatById } from '@/constants/playground';
import { useSession } from '@/hooks/use-session';
import { useSubscription } from '@/hooks/use-subscription';
import { track } from '@/lib/analytics';
import { isPlanUpgradeError, toUserErrorMessage } from '@/lib/errors';
import { shareImage } from '@/lib/share-image';
import { fetchGenerationById, fetchLatestCaption, primaryAssetUrl } from '@/services/generations';
import { generateCaption, generateImage } from '@/services/playground';
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
  const { user, profile } = useSession();
  const queryClient = useQueryClient();
  const [caption, setCaption] = useState<string | null>(null);
  const [captionBusy, setCaptionBusy] = useState(false);
  const [modifyPrompt, setModifyPrompt] = useState('');
  const [modifying, setModifying] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);
  const [sharingImage, setSharingImage] = useState(false);

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

  const existingCaptionQuery = useQuery({
    queryKey: ['caption', id],
    queryFn: () => fetchLatestCaption(id!),
    enabled: Boolean(id),
  });

  const displayCaption = caption ?? existingCaptionQuery.data ?? null;

  const onShare = async () => {
    if (!generation || sharingImage) return;
    const text =
      displayCaption ??
      generation.prompt ??
      'Made with Damroo AI';

    setSharingImage(true);
    try {
      await Clipboard.setStringAsync(text);
      toast('Caption copied', 'success');
      if (imageUrl) {
        await shareImage(imageUrl, 'Share your design');
      } else {
        await Share.share({ message: text });
      }
      track('share_generation', { generation_id: generation.id });
    } catch (e) {
      toast(toUserErrorMessage(e, 'Share failed'), 'error');
    } finally {
      setSharingImage(false);
    }
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

  const onSelectPlan = (_plan: Plan) => {
    setPlansOpen(false);
    router.push('/(onboarding)/subscription' as Href);
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
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Platform.OS === 'android' ? 10 : insets.top + 8,
            paddingBottom: Platform.OS === 'android' ? 16 : insets.bottom + 16,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backLabel}>← Back</Text>
          </Pressable>
        </View>

        {query.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={brand.orange} />
          </View>
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
            <View
              style={[
                styles.frame,
                { aspectRatio: formatById(generation.aspect_ratio).ratio },
              ]}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
              ) : (
                <LinearGradient
                  colors={[brand.orangeSoft, '#FDBA74']}
                  style={styles.image}
                />
              )}
            </View>

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
              <Pressable
                onPress={() => void onShare()}
                style={styles.primaryBtn}
                disabled={sharingImage}>
                {sharingImage ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryLabel}>Share</Text>
                )}
              </Pressable>
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
