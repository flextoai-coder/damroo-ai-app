import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
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
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import {
  AttachPopover,
  ComposerPopoverShell,
  FormatPopover,
  ModelPopover,
  PastePopover,
  type ComposerPopover,
} from '@/components/playground/composer-popovers';
import { PlaygroundEmptyState } from '@/components/playground/empty-state';
import { AssistantBubble, UserBubble } from '@/components/playground/message-bubbles';
import { PlaygroundComposer } from '@/components/playground/playground-composer';
import { PlaygroundHeader } from '@/components/playground/playground-header';
import { TemplatePickerSheet } from '@/components/playground/template-picker-sheet';
import { PlanPickerSheet } from '@/components/profile/plan-picker-sheet';
import { AppScreen } from '@/components/shell/app-screen';
import type { Plan, PlanId } from '@/constants/plans';
import { modelById } from '@/constants/playground';
import { useSession } from '@/hooks/use-session';
import { useSubscription } from '@/hooks/use-subscription';
import { track } from '@/lib/analytics';
import { isPlanUpgradeError, toUserErrorMessage } from '@/lib/errors';
import { readClipboardImage } from '@/lib/clipboard-image';
import { requestPhotoLibraryAccess } from '@/lib/media-permissions';
import { shareImage } from '@/lib/share-image';
import { fetchLatestCaption } from '@/services/generations';
import { enhancePrompt, generateImage, uploadReferenceImage } from '@/services/playground';
import { pickTemplateInPlayground } from '@/services/remix-template';
import { useChatComposerStore, type ComposerAttachment } from '@/stores/chat-composer-store';
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
  const { user } = useSession();
  const listRef = useRef<FlatList<PlaygroundTurn>>(null);
  const [popover, setPopover] = useState<ComposerPopover>(null);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [sending, setSending] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);
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
  const modelId = useChatComposerStore((s) => s.modelId);
  const setModelId = useChatComposerStore((s) => s.setModelId);
  const aspectRatio = useChatComposerStore((s) => s.aspectRatio);
  const setAspectRatio = useChatComposerStore((s) => s.setAspectRatio);
  const quality = useChatComposerStore((s) => s.quality);
  const imageCount = useChatComposerStore((s) => s.imageCount);
  const templateId = useChatComposerStore((s) => s.templateId);
  const useBrandLogo = useChatComposerStore((s) => s.useBrandLogo);
  const setUseBrandLogo = useChatComposerStore((s) => s.setUseBrandLogo);
  const useBrandName = useChatComposerStore((s) => s.useBrandName);
  const setUseBrandName = useChatComposerStore((s) => s.setUseBrandName);
  const useBrandColors = useChatComposerStore((s) => s.useBrandColors);
  const setUseBrandColors = useChatComposerStore((s) => s.setUseBrandColors);
  const resetComposer = useChatComposerStore((s) => s.reset);

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
    turns.length > 0 || prompt.trim().length > 0 || attachments.length > 0;

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

  const onEnhance = async () => {
    if (!prompt.trim() || enhancing) return;
    setEnhancing(true);
    try {
      const next = await enhancePrompt(prompt);
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

  const onSelectPlan = (_plan: Plan) => {
    setPlansOpen(false);
    router.push('/(onboarding)/subscription' as Href);
  };

  /** True when client already knows generation will be blocked. */
  const needsPlanUpgrade = (count: number) => {
    if (!isPaid) return true;
    return creditsRemaining < count;
  };

  const runGeneration = async (params: {
    turnUserId: string;
    assistantId: string;
    prompt: string;
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

    if (needsPlanUpgrade(imageCount)) {
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
      const result = await generateImage({
        userId: user.id,
        prompt: params.prompt,
        aspectRatio: params.aspectRatio,
        quality,
        imageCount,
        attachments: params.attachments,
        conversationId,
        templateId,
        useBrandLogo,
        useBrandName,
        useBrandColors,
        modelId,
      });
      setConversationId(result.conversationId);
      patchAssistant(params.assistantId, {
        status: 'done',
        imageUrl: result.imageUrl,
        generationId: result.generationId,
        error: null,
      });
      void subscriptionQuery.refetch();
      track('generation_success', {
        generation_id: result.generationId,
        aspect_ratio: params.aspectRatio,
      });
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
    const text = prompt.trim();
    if (!text || sending) return;

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

    if (needsPlanUpgrade(imageCount)) {
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

    addUserTurn({
      id: turnUserId,
      prompt: text,
      attachments: snapshotAttachments,
      aspectRatio: snapshotRatio,
      modelId: snapshotModel,
    });
    addAssistantTurn({
      id: assistantId,
      status: 'loading',
      aspectRatio: snapshotRatio,
      imageUrl: null,
      generationId: null,
      error: null,
      parentUserId: turnUserId,
    });

    setPrompt('');

    await runGeneration({
      turnUserId,
      assistantId,
      prompt: text,
      aspectRatio: snapshotRatio,
      attachments: snapshotAttachments,
    });
  };

  const onRegenerate = (assistantId: string, parentUserId: string) => {
    const parent = turns.find((t) => t.role === 'user' && t.id === parentUserId);
    if (!parent || parent.role !== 'user' || sending) return;

    patchAssistant(assistantId, {
      status: 'loading',
      imageUrl: null,
      error: null,
    });

    void runGeneration({
      turnUserId: parent.id,
      assistantId,
      prompt: parent.prompt,
      aspectRatio: parent.aspectRatio,
      attachments: parent.attachments,
    });
  };

  const onSave = () => {
    toast('Saved to Your generations', 'success');
  };

  const onShareGeneration = async (turn: AssistantTurn) => {
    if (!turn.imageUrl || sharingId) return;
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
      await shareImage(turn.imageUrl, 'Share your design');
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

  const onUploadReference = async () => {
    const granted = await requestPhotoLibraryAccess();
    if (!granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsMultipleSelection: false,
    });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    void attachLocalImage(asset.uri, asset.fileName ?? 'Reference', 'ref', asset.mimeType);
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

  const onScrollBeginDrag = (_e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPopover(null);
  };

  return (
    <AppScreen edges={[]} glowBlobs contentStyle={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <PlaygroundHeader
          modelId={modelId}
          onBack={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/(tabs)' as Href);
          }}
          onNewChat={onNewChat}
          newChatDisabled={!hasComposerContent}
          onSelectModel={() => setPopover('model')}
        />

        <View style={styles.flex}>
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
                    onSave={onSave}
                    onPress={
                      item.status === 'done' && item.generationId
                        ? () => router.push(`/generation/${item.generationId}` as Href)
                        : undefined
                    }
                    onShare={() => void onShareGeneration(item)}
                    sharing={sharingId === item.id}
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
          {popover === 'attach' ? (
            <AttachPopover
              onUpload={() => {
                setPopover(null);
                void onUploadReference();
              }}
              onTemplate={() => {
                setPopover(null);
                onUseTemplate();
              }}
              onSelectModel={() => setPopover('model')}
              activeModelName={modelById(modelId).name}
              useBrandLogo={useBrandLogo}
              useBrandName={useBrandName}
              useBrandColors={useBrandColors}
              onToggleBrandLogo={setUseBrandLogo}
              onToggleBrandName={setUseBrandName}
              onToggleBrandColors={setUseBrandColors}
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
          {popover === 'paste' ? (
            <PastePopover
              onPaste={() => {
                setPopover(null);
                void onPasteImage();
              }}
            />
          ) : null}
        </ComposerPopoverShell>

        <PlaygroundComposer
          prompt={prompt}
          onChangePrompt={setPrompt}
          attachments={attachments}
          onRemoveAttachment={removeAttachment}
          onRetryAttachment={onRetryAttachment}
          aspectRatio={aspectRatio}
          popover={popover}
          onPopoverChange={setPopover}
          enhancing={enhancing}
          onEnhance={() => void onEnhance()}
          sending={sending}
          onSend={() => void onSend()}
          clipboardHasImage={clipboardHasImage}
          onLayout={(e) => setComposerHeight(e.nativeEvent.layout.height)}
        />
      </KeyboardAvoidingView>

      <TemplatePickerSheet
        visible={templatePickerOpen}
        onClose={() => setTemplatePickerOpen(false)}
        onSelect={(template) => {
          pickTemplateInPlayground(template);
          setTemplatePickerOpen(false);
          toast(`Template “${template.title}” loaded`, 'success');
        }}
      />

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
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 16,
  },
});
