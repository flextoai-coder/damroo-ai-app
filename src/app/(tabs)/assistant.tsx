import * as Clipboard from 'expo-clipboard';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import {
  BrandKitPopover,
  ComposerPopoverShell,
  FormatPopover,
  ModelPopover,
  PastePopover,
  QualityCountPopover,
  ReferenceZonePopover,
  type ComposerPopover,
} from '@/components/playground/composer-popovers';
import { PlaygroundEmptyState } from '@/components/playground/empty-state';
import { AssistantBubble, UserBubble } from '@/components/playground/message-bubbles';
import { PlaygroundComposer } from '@/components/playground/playground-composer';
import { PlaygroundHeader } from '@/components/playground/playground-header';
import { SelectImagesSheet } from '@/components/generation/select-images-sheet';
import { ReferenceLibrarySheet } from '@/components/playground/reference-library-sheet';
import { TemplatePickerSheet } from '@/components/playground/template-picker-sheet';
import { PlanPickerSheet } from '@/components/profile/plan-picker-sheet';
import { AppScreen } from '@/components/shell/app-screen';
import { TemplateConfigureSheet } from '@/components/templates/template-configure-sheet';
import type { Plan, PlanId } from '@/constants/plans';
import { creditsPerImage } from '@/constants/playground';
import { useBrandKit } from '@/hooks/use-brand-kit';
import { useSession } from '@/hooks/use-session';
import { useSubscription } from '@/hooks/use-subscription';
import { useTemplateConfigureFlow } from '@/hooks/use-template-configure-flow';
import { track } from '@/lib/analytics';
import { isPlanUpgradeError, toUserErrorMessage } from '@/lib/errors';
import { readClipboardImage } from '@/lib/clipboard-image';
import { requestSaveToGalleryAccess } from '@/lib/media-permissions';
import { saveImageToGallery } from '@/lib/save-image';
import { shareImage } from '@/lib/share-image';
import { brandKitSwatches } from '@/services/brand-kit';
import { fetchLatestCaption } from '@/services/generations';
import { enhancePrompt, generateImage, uploadReferenceImage, waitForGeneration } from '@/services/playground';
import {
  isUserCancelledPurchase,
  purchaseErrorMessage,
  purchasePlan,
} from '@/services/purchases';
import { pickTemplateInPlayground } from '@/services/remix-template';
import {
  modelReferenceAttachments,
  useChatComposerStore,
  type ComposerAttachment,
} from '@/stores/chat-composer-store';
import {
  usePlaygroundStore,
  type AssistantTurn,
  type PlaygroundTurn,
} from '@/stores/playground-store';
import { toast } from '@/stores/toast-store';

function newId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function AssistantScreen() {
  const router = useRouter();
  const { user, profile } = useSession();
  const brandKitQuery = useBrandKit();
  const brandKit = brandKitQuery.data;
  const hasBrandLogo = Boolean(brandKit?.logo_storage_path);
  const hasBrandName = Boolean(profile?.business_name?.trim());
  const hasBrandColors = brandKitSwatches(brandKit).length > 0;
  const listRef = useRef<FlatList<PlaygroundTurn>>(null);
  const [popover, setPopover] = useState<ComposerPopover>(null);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [assetsSheetOpen, setAssetsSheetOpen] = useState(false);
  const [productSheetOpen, setProductSheetOpen] = useState(false);
  const configureFlow = useTemplateConfigureFlow({
    onComplete: (template, selections) => {
      pickTemplateInPlayground(template, selections);
      toast(`Template “${template.title}” loaded`, 'success');
    },
  });
  const [plansOpen, setPlansOpen] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [sending, setSending] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectSheet, setSelectSheet] = useState<{ urls: string[]; mode: 'save' | 'share' } | null>(
    null,
  );
  const [clipboardHasImage, setClipboardHasImage] = useState(false);
  const [composerHeight, setComposerHeight] = useState(118);
  const subscriptionQuery = useSubscription();
  const subscription = subscriptionQuery.data;
  const isPaid = subscription?.status === 'active';
  const currentPlanId =
    isPaid && subscription?.plan ? (subscription.plan as PlanId) : null;
  const creditsRemaining = isPaid ? subscription.credits_remaining : 0;

  const turns = usePlaygroundStore((s) => s.turns);
  const conversationId = usePlaygroundStore((s) => s.conversationId);
  const setConversationId = usePlaygroundStore((s) => s.setConversationId);
  const addUserTurn = usePlaygroundStore((s) => s.addUserTurn);
  const addAssistantTurn = usePlaygroundStore((s) => s.addAssistantTurn);
  const patchAssistant = usePlaygroundStore((s) => s.patchAssistant);
  const clearTurns = usePlaygroundStore((s) => s.clear);

  const prompt = useChatComposerStore((s) => s.prompt);
  const setPrompt = useChatComposerStore((s) => s.setPrompt);
  const attachments = useChatComposerStore((s) => s.attachments);
  const addAttachment = useChatComposerStore((s) => s.addAttachment);
  const updateAttachment = useChatComposerStore((s) => s.updateAttachment);
  const removeAttachment = useChatComposerStore((s) => s.removeAttachment);
  const clearAttachments = useChatComposerStore((s) => s.clearAttachments);
  const modelId = useChatComposerStore((s) => s.modelId);
  const setModelId = useChatComposerStore((s) => s.setModelId);
  const aspectRatio = useChatComposerStore((s) => s.aspectRatio);
  const setAspectRatio = useChatComposerStore((s) => s.setAspectRatio);
  const quality = useChatComposerStore((s) => s.quality);
  const setQuality = useChatComposerStore((s) => s.setQuality);
  const imageCount = useChatComposerStore((s) => s.imageCount);
  const setImageCount = useChatComposerStore((s) => s.setImageCount);
  const variation = useChatComposerStore((s) => s.variation);
  const setVariation = useChatComposerStore((s) => s.setVariation);
  const templateId = useChatComposerStore((s) => s.templateId);
  const templateLockedPrompt = useChatComposerStore((s) => s.templateLockedPrompt);
  const clearTemplateLock = useChatComposerStore((s) => s.clearTemplateLock);
  const useBrandLogo = useChatComposerStore((s) => s.useBrandLogo);
  const setUseBrandLogo = useChatComposerStore((s) => s.setUseBrandLogo);
  const useBrandName = useChatComposerStore((s) => s.useBrandName);
  const setUseBrandName = useChatComposerStore((s) => s.setUseBrandName);
  const useBrandColors = useChatComposerStore((s) => s.useBrandColors);
  const setUseBrandColors = useChatComposerStore((s) => s.setUseBrandColors);
  const resetComposer = useChatComposerStore((s) => s.reset);

  useEffect(() => {
    if (!hasBrandLogo && useBrandLogo) setUseBrandLogo(false);
    if (!hasBrandName && useBrandName) setUseBrandName(false);
    if (!hasBrandColors && useBrandColors) setUseBrandColors(false);
  }, [
    hasBrandLogo,
    useBrandLogo,
    setUseBrandLogo,
    hasBrandName,
    useBrandName,
    setUseBrandName,
    hasBrandColors,
    useBrandColors,
    setUseBrandColors,
  ]);

  useEffect(() => {
    if (turns.length === 0) return;
    const t = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(t);
  }, [turns]);

  useEffect(() => {
    let mounted = true;
    void Clipboard.hasImageAsync().then((has) => {
      if (mounted) setClipboardHasImage(has);
    });

    const subscription = Clipboard.addClipboardListener(({ contentTypes }) => {
      setClipboardHasImage(contentTypes.includes(Clipboard.ContentType.IMAGE));
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  const hasComposerContent =
    turns.length > 0 ||
    prompt.trim().length > 0 ||
    attachments.length > 0 ||
    Boolean(templateLockedPrompt);

  const onNewChat = () => {
    if (!hasComposerContent) return;
    Alert.alert(
      'Start a new chat?',
      'This clears the current conversation. Your saved generations won’t be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'New chat',
          style: 'destructive',
          onPress: () => {
            clearTurns();
            resetComposer();
            setPopover(null);
          },
        },
      ],
    );
  };

  /**
   * Chat memory: if the user follows up with no new attachment (didn't open
   * the image detail screen to remix), treat the most recently generated
   * image in this conversation as an implicit reference — so a bare
   * "make the sky orange instead" continues editing it instead of starting
   * a brand-new, unrelated image.
   */
  const lastGeneratedImageUrl = (): string | null => {
    for (let i = turns.length - 1; i >= 0; i--) {
      const t = turns[i];
      if (t.role === 'assistant' && t.status === 'done' && t.imageUrls[0]) {
        return t.imageUrls[0];
      }
    }
    return null;
  };

  const onEnhance = async () => {
    if (!prompt.trim() || enhancing) return;
    setEnhancing(true);
    try {
      const readyAttachmentUrls = modelReferenceAttachments(attachments)
        .filter((a) => a.status === 'ready')
        .map((a) => a.uri);
      const previousImageUrl = readyAttachmentUrls.length === 0 ? lastGeneratedImageUrl() : null;
      const referenceImages = previousImageUrl ? [previousImageUrl] : readyAttachmentUrls;

      const next = await enhancePrompt({
        prompt,
        aspectRatio,
        referenceImages,
        useBrandLogo,
        useBrandName,
        useBrandColors,
      });
      setPrompt(next);
      track('enhance_prompt');
      toast('Prompt enhanced', 'success');
    } catch (e) {
      toast(toUserErrorMessage(e, 'Couldn’t enhance prompt'), 'error');
    } finally {
      setEnhancing(false);
    }
  };

  const openPlans = () => {
    setPopover(null);
    setPlansOpen(true);
  };

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

  /** Credit cost varies by model + quality, not a flat 1 credit/image. */
  const generationCost = creditsPerImage(modelId, quality) * imageCount;

  /** True when client already knows generation will be blocked. */
  const needsPlanUpgrade = (cost: number) => {
    if (!isPaid) return true;
    return creditsRemaining < cost;
  };

  const runGeneration = async (params: {
    turnUserId: string;
    assistantId: string;
    prompt: string;
    lockedPrompt: string | null;
    aspectRatio: string;
    attachments: typeof attachments;
  }) => {
    if (!user?.id) {
      patchAssistant(params.assistantId, {
        status: 'error',
        error: 'You must be signed in to generate.',
      });
      return;
    }

    if (needsPlanUpgrade(generationCost)) {
      const message = !isPaid
        ? 'No active plan. Choose a plan to unlock generation.'
        : 'Not enough credits. Upgrade your plan to keep creating.';
      patchAssistant(params.assistantId, {
        status: 'error',
        error: message,
      });
      toast(message, 'error');
      openPlans();
      return;
    }

    setSending(true);
    try {
      // Resolves fast (content checks + credit debit only) — the actual
      // provider call runs server-side in the background, so the turn stays
      // in its 'loading' state until waitForGeneration below reports back.
      const { generationId, conversationId: newConversationId } = await generateImage({
        userId: user.id,
        prompt: params.prompt,
        lockedPrompt: params.lockedPrompt,
        aspectRatio: params.aspectRatio,
        quality,
        imageCount,
        variation,
        attachments: params.attachments,
        conversationId,
        templateId,
        useBrandLogo,
        useBrandName,
        useBrandColors,
        modelId,
      });
      setConversationId(newConversationId);
      patchAssistant(params.assistantId, { generationId });

      const outcome = await waitForGeneration(generationId);
      if (outcome.status === 'completed') {
        patchAssistant(params.assistantId, {
          status: 'done',
          imageUrls: outcome.imageUrls,
          error: null,
          brandKitApplied: useBrandLogo || useBrandName || useBrandColors,
        });
        void subscriptionQuery.refetch();
        track('generation_success', {
          generation_id: generationId,
          aspect_ratio: params.aspectRatio,
        });
      } else {
        const message = outcome.errorMessage ?? 'Generation failed';
        patchAssistant(params.assistantId, { status: 'error', error: message });
        toast(message, 'error');
        if (isPlanUpgradeError(message)) openPlans();
        track('generation_fail', { reason: message.slice(0, 120) });
      }
    } catch (error) {
      const message = toUserErrorMessage(error, 'Generation failed');
      patchAssistant(params.assistantId, {
        status: 'error',
        error: message,
      });
      toast(message, 'error');
      if (isPlanUpgradeError(error) || isPlanUpgradeError(message)) {
        openPlans();
      }
      track('generation_fail', { reason: message.slice(0, 120) });
    } finally {
      setSending(false);
    }
  };

  const onSend = async () => {
    const freeText = prompt.trim();
    const lockedText = templateLockedPrompt?.trim() || null;
    if ((!freeText && !lockedText) || sending) return;

    if (attachments.some((a) => a.status === 'uploading')) {
      toast('Please wait for images to finish uploading', 'error');
      return;
    }
    if (attachments.some((a) => a.status === 'error')) {
      toast('Remove or retry the failed image before sending', 'error');
      return;
    }

    Keyboard.dismiss();
    setPopover(null);

    if (needsPlanUpgrade(generationCost)) {
      toast(
        !isPaid
          ? 'Choose a plan to start generating.'
          : 'Not enough credits — pick a plan to continue.',
        'error',
      );
      openPlans();
      return;
    }

    const turnUserId = newId('user');
    const assistantId = newId('asst');
    const snapshotAttachments = [...attachments];
    const snapshotRatio = aspectRatio;
    const snapshotModel = modelId;

    // Only fall back to the previous image when the user didn't attach
    // anything themselves this turn.
    const previousImageUrl =
      snapshotAttachments.length === 0 ? lastGeneratedImageUrl() : null;
    const effectiveAttachments = previousImageUrl
      ? [
          {
            id: 'chat-memory-ref',
            uri: previousImageUrl,
            kind: 'reference' as const,
            title: 'Previous generation',
            status: 'ready' as const,
          },
        ]
      : snapshotAttachments;

    // The full text the user acted on — shown in the chat bubble and
    // replayed verbatim on regenerate, including whatever was locked in
    // from a template alongside any free-text additions.
    const displayText = [lockedText, freeText].filter(Boolean).join('\n\n');

    addUserTurn({
      id: turnUserId,
      prompt: displayText,
      attachments: snapshotAttachments,
      aspectRatio: snapshotRatio,
      modelId: snapshotModel,
    });
    addAssistantTurn({
      id: assistantId,
      status: 'loading',
      aspectRatio: snapshotRatio,
      imageCount,
      imageUrls: [],
      generationId: null,
      error: null,
      parentUserId: turnUserId,
      brandKitApplied: useBrandLogo || useBrandName || useBrandColors,
    });

    setPrompt('');
    // Clear the composer's reference/template attachments (and the template
    // lock, if any) now that they've been handed off to this turn — don't
    // leave them to silently reattach to whatever the user sends next.
    clearAttachments();

    await runGeneration({
      turnUserId,
      assistantId,
      prompt: freeText,
      lockedPrompt: lockedText,
      aspectRatio: snapshotRatio,
      attachments: effectiveAttachments,
    });
  };

  const onRegenerate = (assistantId: string, parentUserId: string) => {
    const parent = turns.find((t) => t.role === 'user' && t.id === parentUserId);
    if (!parent || parent.role !== 'user' || sending) return;

    patchAssistant(assistantId, {
      status: 'loading',
      // Refresh to the live count — regenerate uses whatever's currently
      // set in the composer, same as quality/brand kit already do, so the
      // skeleton should match what's actually about to be requested.
      imageCount,
      imageUrls: [],
      error: null,
    });

    void runGeneration({
      turnUserId: parent.id,
      assistantId,
      // Replays the exact text from the original turn — already includes
      // whatever was locked in at the time, so there's nothing new to lock.
      prompt: parent.prompt,
      lockedPrompt: null,
      aspectRatio: parent.aspectRatio,
      attachments: parent.attachments,
    });
  };

  const onSaveGeneration = async (turn: AssistantTurn) => {
    const imageUrl = turn.imageUrls[0];
    if (!imageUrl || savingId) return;

    // More than one image in this result — let the user pick which ones to
    // save instead of always grabbing just the first.
    if (turn.imageUrls.length > 1) {
      setSelectSheet({ urls: turn.imageUrls, mode: 'save' });
      return;
    }

    setSavingId(turn.id);
    try {
      const granted = await requestSaveToGalleryAccess();
      if (!granted) return;
      await saveImageToGallery(imageUrl);
      toast('Saved to your photos', 'success');
    } catch (e) {
      toast(toUserErrorMessage(e, 'Couldn’t save image'), 'error');
    } finally {
      setSavingId(null);
    }
  };

  const onShareGeneration = async (turn: AssistantTurn) => {
    const imageUrl = turn.imageUrls[0];
    if (!imageUrl || sharingId) return;

    // More than one image in this result — let the user pick which one to
    // share instead of always defaulting to the first. Skips the
    // caption-copy step below; that's specific to the single-image case.
    if (turn.imageUrls.length > 1) {
      setSelectSheet({ urls: turn.imageUrls, mode: 'share' });
      return;
    }

    setSharingId(turn.id);
    try {
      const parent = turns.find((t) => t.role === 'user' && t.id === turn.parentUserId);
      const promptFallback = parent && parent.role === 'user' ? parent.prompt : null;
      const existingCaption = turn.generationId
        ? await fetchLatestCaption(turn.generationId)
        : null;
      const text = existingCaption ?? promptFallback ?? 'Made with Damroo AI';

      await Clipboard.setStringAsync(text);
      toast('Caption copied', 'success');
      await shareImage(imageUrl, 'Share your design');
    } catch (e) {
      toast(toUserErrorMessage(e, 'Share failed'), 'error');
    } finally {
      setSharingId(null);
    }
  };

  /** Uploads immediately on attach — generation never depends on the local file still being there. */
  const attachLocalImage = async (
    localUri: string,
    title: string,
    idPrefix: string,
    mimeType?: string | null,
  ) => {
    const id = newId(idPrefix);
    addAttachment({ id, uri: localUri, kind: 'reference', title, status: 'uploading' });

    if (!user?.id) {
      updateAttachment(id, { status: 'error' });
      toast('You must be signed in to attach images', 'error');
      return;
    }

    try {
      const remoteUrl = await uploadReferenceImage(user.id, localUri, mimeType);
      updateAttachment(id, { uri: remoteUrl, status: 'ready' });
    } catch (e) {
      updateAttachment(id, { status: 'error' });
      toast(toUserErrorMessage(e, 'Couldn’t upload image'), 'error');
    }
  };

  const onRetryAttachment = (attachment: ComposerAttachment) => {
    if (!user?.id || attachment.status === 'uploading') return;
    void (async () => {
      updateAttachment(attachment.id, { status: 'uploading' });
      try {
        const remoteUrl = await uploadReferenceImage(user.id!, attachment.uri);
        updateAttachment(attachment.id, { uri: remoteUrl, status: 'ready' });
      } catch (e) {
        updateAttachment(attachment.id, { status: 'error' });
        toast(toUserErrorMessage(e, 'Couldn’t upload image'), 'error');
      }
    })();
  };

  const onPasteImage = async () => {
    try {
      const uri = await readClipboardImage();
      if (!uri) {
        toast('No image found on the clipboard', 'error');
        return;
      }
      void attachLocalImage(uri, 'Pasted image', 'paste');
    } catch (e) {
      toast(toUserErrorMessage(e, 'Couldn’t paste image'), 'error');
    }
  };

  const onUseTemplate = () => {
    setTemplatePickerOpen(true);
  };

  /**
   * The attach zones, format, and quality/count controls all open through
   * this same handler. The popover shell tracks the live keyboard height
   * itself (see ComposerPopoverShell), so it stays correctly positioned
   * above the composer whether or not the keyboard is up — no need to
   * dismiss the keyboard first.
   */
  const onPopoverChange = (next: ComposerPopover) => {
    setPopover(next);
  };

  const onAddProduct = () => {
    Keyboard.dismiss();
    setPopover(null);
    setProductSheetOpen(true);
  };

  const onScrollBeginDrag = (_e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPopover(null);
  };

  const { height: kbHeight } = useReanimatedKeyboardAnimation();
  const composerOverlayStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: kbHeight.value }],
  }));

  return (
    <AppScreen edges={[]} glowBlobs contentStyle={styles.screen} tabIndex={4}>
      <PlaygroundHeader
        modelId={modelId}
        onBack={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/(tabs)' as Href);
        }}
        onNewChat={onNewChat}
        newChatDisabled={!hasComposerContent}
        onSelectModel={() => setPopover(popover === 'model' ? null : 'model')}
      />

      <View style={[styles.flex, { paddingBottom: composerHeight }]}>
        {turns.length === 0 ? (
          <PlaygroundEmptyState />
        ) : (
          <FlatList
            ref={listRef}
            data={turns}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={onScrollBeginDrag}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) =>
              item.role === 'user' ? (
                <UserBubble turn={item} />
              ) : (
                <AssistantBubble
                  turn={item}
                  onRegenerate={() => onRegenerate(item.id, item.parentUserId)}
                  onSave={() => void onSaveGeneration(item)}
                  onPress={
                    item.status === 'done' && item.generationId
                      ? () => router.push(`/generation/${item.generationId}` as Href)
                      : undefined
                  }
                  onShare={() => void onShareGeneration(item)}
                  sharing={sharingId === item.id}
                  saving={savingId === item.id}
                />
              )
            }
          />
        )}
      </View>

      <ComposerPopoverShell
        visible={popover !== null}
        onClose={() => setPopover(null)}
        composerHeight={composerHeight}>
        {popover === 'referenceMenu' ? (
          <ReferenceZonePopover
            onAddReference={() => {
              setPopover(null);
              setAssetsSheetOpen(true);
            }}
            onTemplate={() => {
              setPopover(null);
              onUseTemplate();
            }}
          />
        ) : null}
        {popover === 'brand' ? (
          <BrandKitPopover
            useBrandLogo={useBrandLogo}
            useBrandName={useBrandName}
            useBrandColors={useBrandColors}
            onToggleBrandLogo={setUseBrandLogo}
            onToggleBrandName={setUseBrandName}
            onToggleBrandColors={setUseBrandColors}
            hasLogo={hasBrandLogo}
            hasName={hasBrandName}
            hasColors={hasBrandColors}
          />
        ) : null}
        {popover === 'model' ? (
          <ModelPopover
            activeId={modelId}
            onSelect={(id) => {
              setModelId(id);
              setPopover(null);
            }}
          />
        ) : null}
        {popover === 'format' ? (
          <FormatPopover
            activeId={aspectRatio}
            onSelect={(id) => {
              setAspectRatio(id);
              setPopover(null);
            }}
          />
        ) : null}
        {popover === 'quality' ? (
          <QualityCountPopover
            modelId={modelId}
            quality={quality}
            onSelectQuality={setQuality}
            imageCount={imageCount}
            onChangeImageCount={setImageCount}
            variation={variation}
            onSelectVariation={setVariation}
          />
        ) : null}
        {popover === 'paste' ? (
          <PastePopover
            onPaste={() => {
              setPopover(null);
              void onPasteImage();
            }}
          />
        ) : null}
      </ComposerPopoverShell>

      <Animated.View style={[styles.composerOverlay, composerOverlayStyle]}>
        <PlaygroundComposer
          prompt={prompt}
          onChangePrompt={setPrompt}
          templateLockedPrompt={templateLockedPrompt}
          onClearTemplateLock={clearTemplateLock}
          attachments={attachments}
          onRemoveAttachment={removeAttachment}
          onRetryAttachment={onRetryAttachment}
          aspectRatio={aspectRatio}
          quality={quality}
          imageCount={imageCount}
          popover={popover}
          onPopoverChange={onPopoverChange}
          onAddProduct={onAddProduct}
          onAddReferenceOrTemplate={() =>
            onPopoverChange(popover === 'referenceMenu' ? null : 'referenceMenu')
          }
          onLongPressReferenceAdd={() => onPopoverChange('paste')}
          onSelectBrandKit={() => onPopoverChange(popover === 'brand' ? null : 'brand')}
          brandKitActive={useBrandLogo || useBrandName || useBrandColors}
          enhancing={enhancing}
          onEnhance={() => void onEnhance()}
          sending={sending}
          onSend={() => void onSend()}
          clipboardHasImage={clipboardHasImage}
          onLayout={(e) => setComposerHeight(e.nativeEvent.layout.height)}
        />
      </Animated.View>

      <TemplatePickerSheet
        visible={templatePickerOpen}
        onClose={() => setTemplatePickerOpen(false)}
        onSelect={(template) => {
          setTemplatePickerOpen(false);
          configureFlow.open(template);
        }}
      />

      <ReferenceLibrarySheet
        visible={assetsSheetOpen}
        onClose={() => setAssetsSheetOpen(false)}
      />

      <ReferenceLibrarySheet
        visible={productSheetOpen}
        onClose={() => setProductSheetOpen(false)}
        targetKind="product"
        title="Product Images"
      />

      <TemplateConfigureSheet
        visible={configureFlow.visible}
        template={configureFlow.template}
        config={configureFlow.config}
        onFinish={configureFlow.finish}
        onCancel={configureFlow.cancel}
      />

      <PlanPickerSheet
        visible={plansOpen}
        onClose={() => setPlansOpen(false)}
        currentPlanId={currentPlanId}
        onSelectPlan={onSelectPlan}
      />

      <SelectImagesSheet
        visible={selectSheet !== null}
        onClose={() => setSelectSheet(null)}
        urls={selectSheet?.urls ?? []}
        mode={selectSheet?.mode ?? 'save'}
      />
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
  composerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 16,
  },
});
