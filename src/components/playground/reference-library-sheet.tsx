import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckIcon, PlusAttachIcon } from '@/components/playground/icons';
import { SkeletonGrid } from '@/components/ui/skeleton';
import { brand } from '@/constants/brand';
import { SHEET_SPRING } from '@/constants/sheet-motion';
import { useHomeGenerations } from '@/hooks/use-home-data';
import { useSession } from '@/hooks/use-session';
import { toUserErrorMessage } from '@/lib/errors';
import { resizedImageUrl } from '@/lib/image-transform';
import { requestCameraAccess, requestPhotoLibraryAccess } from '@/lib/media-permissions';
import { primaryAssetUrl, type Generation } from '@/services/generations';
import {
  fetchReferenceLibrary,
  uploadAndSaveReference,
  type ReferenceUpload,
} from '@/services/reference-uploads';
import { useChatComposerStore, type ComposerAttachment } from '@/stores/chat-composer-store';
import { toast } from '@/stores/toast-store';

const SIDE = 22;
const GAP = 14;
const DISMISS_DISTANCE_RATIO = 0.22;
const DISMISS_VELOCITY = 900;
const MAX_ATTACHMENTS = 14;
const CONFIRM_BAR_HEIGHT = 78;

function newId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Signed URLs (My Uploads) carry a fresh token on every fetch, so the exact
 * URL saved on an attachment never matches a freshly-fetched one for the
 * same image — compare the stable path instead, ignoring the query string.
 */
function urlKey(url: string): string {
  return url.split('?')[0];
}

type Tab = 'uploads' | 'generations';

/** A selected image, identified by URL — order here is the order it'll attach in. */
type Selection = { url: string; title: string };

type ReferenceLibrarySheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Kind newly-selected/uploaded items are tagged with on confirm. */
  targetKind?: 'product' | 'reference';
  /** Sheet heading. */
  title?: string;
};

/** "My Assets" — multi-select past uploads, past generations, or pick fresh from the
 *  gallery/camera, then attach the whole batch in the order they were picked. */
export function ReferenceLibrarySheet({
  visible,
  onClose,
  targetKind = 'reference',
  title = 'My Assets',
}: ReferenceLibrarySheetProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { user } = useSession();
  const queryClient = useQueryClient();
  const replaceReadyAttachments = useChatComposerStore((s) => s.replaceReadyAttachments);
  // Everything NOT part of this sheet's editable selection — other kinds,
  // plus any attachment of this kind still mid-upload/errored (those are
  // handled by the direct attach/retry flow, not by this sheet).
  const existingCount = useChatComposerStore(
    (s) => s.attachments.filter((a) => a.kind !== targetKind || a.status !== 'ready').length,
  );
  const noun = targetKind === 'product' ? 'product image' : 'reference image';
  const nounPlural = targetKind === 'product' ? 'product images' : 'reference images';
  const [tab, setTab] = useState<Tab>('uploads');
  const [addingUpload, setAddingUpload] = useState(false);
  const [selected, setSelected] = useState<Selection[]>([]);

  const uploadsQuery = useQuery({
    queryKey: ['reference-uploads', user?.id],
    queryFn: () => fetchReferenceLibrary(user!.id),
    enabled: visible && Boolean(user?.id),
  });
  const generationsQuery = useHomeGenerations();

  const colWidth = (width - SIDE * 2 - GAP) / 2;
  const sheetHeight = Math.min(height * 0.88, height - insets.top - 24);
  const remainingSlots = Math.max(0, MAX_ATTACHMENTS - existingCount - selected.length);

  const translateY = useSharedValue(sheetHeight);
  const dragOriginY = useSharedValue(0);
  const sheetHeightSV = useSharedValue(sheetHeight);

  useEffect(() => {
    sheetHeightSV.value = sheetHeight;
  }, [sheetHeight, sheetHeightSV]);

  useEffect(() => {
    if (!visible) {
      setTab('uploads');
      setSelected([]);
      translateY.value = sheetHeight;
      return;
    }

    // Pre-check whatever's already attached for this zone, so the sheet
    // opens showing (and lets you edit) the current selection, not a blank one.
    const seeded = useChatComposerStore
      .getState()
      .attachments.filter((a) => a.kind === targetKind && a.status === 'ready')
      .map((a) => ({ url: a.uri, title: a.title }));
    setSelected(seeded);

    translateY.value = sheetHeight;
    translateY.value = withSpring(0, SHEET_SPRING);
  }, [visible, sheetHeight, translateY, targetKind]);

  const finishClose = () => {
    onClose();
  };

  const dismiss = () => {
    translateY.value = withTiming(sheetHeightSV.value, { duration: 220 }, (finished) => {
      if (finished) runOnJS(finishClose)();
    });
  };

  const pan = Gesture.Pan()
    .onBegin(() => {
      dragOriginY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateY.value = Math.max(0, dragOriginY.value + e.translationY);
    })
    .onEnd((e) => {
      const threshold = sheetHeightSV.value * DISMISS_DISTANCE_RATIO;
      const shouldClose = translateY.value > threshold || e.velocityY > DISMISS_VELOCITY;
      if (shouldClose) {
        translateY.value = withTiming(sheetHeightSV.value, { duration: 220 }, (finished) => {
          if (finished) runOnJS(finishClose)();
        });
      } else {
        translateY.value = withSpring(0, SHEET_SPRING);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const scrimStyle = useAnimatedStyle(() => {
    const progress = 1 - translateY.value / Math.max(sheetHeightSV.value, 1);
    return { opacity: Math.min(1, Math.max(0, progress)) };
  });

  /** Toggle a library tile (upload or generation) in/out of the selection. */
  const toggleSelect = (url: string, title: string) => {
    setSelected((prev) => {
      if (prev.some((s) => urlKey(s.url) === urlKey(url))) {
        return prev.filter((s) => urlKey(s.url) !== urlKey(url));
      }
      if (prev.length >= MAX_ATTACHMENTS - existingCount) {
        toast(`You can attach up to 14 ${nounPlural}`, 'error');
        return prev;
      }
      return [...prev, { url, title }];
    });
  };

  /** Replaces this zone's whole selection in one go — additions and removals alike. */
  const confirmSelection = () => {
    const next: ComposerAttachment[] = selected.map((item) => ({
      id: newId('lib'),
      uri: item.url,
      kind: targetKind,
      title: item.title,
      status: 'ready',
    }));
    replaceReadyAttachments(targetKind, next);
    dismiss();
  };

  const pickAndUpload = async (source: 'library' | 'camera') => {
    if (!user?.id) return;
    if (remainingSlots <= 0) {
      toast(`You can attach up to 14 ${nounPlural}`, 'error');
      return;
    }
    const granted =
      source === 'library' ? await requestPhotoLibraryAccess() : await requestCameraAccess();
    if (!granted) return;

    const result =
      source === 'library'
        ? await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.9,
            allowsMultipleSelection: true,
            selectionLimit: remainingSlots,
          })
        : await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 });

    if (result.canceled || result.assets.length === 0) return;
    const assets = result.assets.slice(0, remainingSlots);

    setAddingUpload(true);
    try {
      // Sequential, not parallel — attachment order must match pick order.
      for (const asset of assets) {
        const upload = await uploadAndSaveReference(user.id, asset.uri, asset.mimeType);
        setSelected((prev) => [...prev, { url: upload.url, title: asset.fileName ?? 'Reference' }]);
      }
      void queryClient.invalidateQueries({ queryKey: ['reference-uploads', user.id] });
    } catch (e) {
      toast(toUserErrorMessage(e, 'Couldn’t upload image'), 'error');
    } finally {
      setAddingUpload(false);
    }
  };

  const onAddPress = () => {
    Alert.alert(`Add ${noun}`, undefined, [
      { text: 'Photo Library', onPress: () => void pickAndUpload('library') },
      { text: 'Camera', onPress: () => void pickAndUpload('camera') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const uploads = uploadsQuery.data ?? [];
  const generations = (generationsQuery.data ?? []).filter((g) => primaryAssetUrl(g));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={dismiss}
      statusBarTranslucent>
      <GestureHandlerRootView style={styles.root}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={dismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss My Assets">
          <Animated.View style={[styles.scrim, scrimStyle]} pointerEvents="none" />
        </Pressable>

        <Animated.View
          style={[
            styles.sheet,
            sheetStyle,
            { height: sheetHeight, paddingBottom: Math.max(insets.bottom, 12) },
          ]}>
          <BlurView intensity={55} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.sheetInner}>
            <GestureDetector gesture={pan}>
              <Animated.View
                style={styles.handleHit}
                accessibilityRole="adjustable"
                accessibilityLabel="Drag down to close">
                <View style={styles.handle} />
              </Animated.View>
            </GestureDetector>

            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
            </View>

            <View style={styles.tabRow}>
              <TabButton label="My Uploads" active={tab === 'uploads'} onPress={() => setTab('uploads')} />
              <TabButton
                label="My Generations"
                active={tab === 'generations'}
                onPress={() => setTab('generations')}
              />
            </View>

            {tab === 'uploads' ? (
              uploadsQuery.isLoading ? (
                <ScrollView contentContainerStyle={styles.gridContent}>
                  <SkeletonGrid screenWidth={width} itemHeight={colWidth} showLabel={false} />
                </ScrollView>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.gridContent}>
                  <View style={styles.grid}>
                    <AddTile
                      width={colWidth}
                      busy={addingUpload}
                      disabled={remainingSlots <= 0}
                      onPress={onAddPress}
                      accessibilityLabel={`Add ${nounPlural}`}
                    />
                    {uploads.map((item) => (
                      <UploadTile
                        key={item.id}
                        item={item}
                        width={colWidth}
                        selected={selected.some((s) => urlKey(s.url) === urlKey(item.url))}
                        onPress={() => toggleSelect(item.url, 'Reference')}
                      />
                    ))}
                  </View>
                </ScrollView>
              )
            ) : generationsQuery.isLoading ? (
              <ScrollView contentContainerStyle={styles.gridContent}>
                <SkeletonGrid screenWidth={width} itemHeight={colWidth} showLabel={false} />
              </ScrollView>
            ) : generations.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No generations yet — create one first.</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.gridContent}>
                <View style={styles.grid}>
                  {generations.map((g) => {
                    const url = primaryAssetUrl(g)!;
                    return (
                      <GenerationTile
                        key={g.id}
                        generation={g}
                        width={colWidth}
                        selected={selected.some((s) => urlKey(s.url) === urlKey(url))}
                        onPress={() => toggleSelect(url, g.prompt)}
                      />
                    );
                  })}
                </View>
              </ScrollView>
            )}

            <View style={[styles.confirmBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
              <Pressable
                onPress={confirmSelection}
                style={styles.confirmBtn}
                accessibilityRole="button"
                accessibilityLabel={
                  selected.length > 0 ? `Done — ${selected.length} selected` : 'Done'
                }>
                <Text style={styles.confirmLabel}>
                  {selected.length > 0 ? `Done · ${selected.length}` : 'Done'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tab, active && styles.tabActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function AddTile({
  width,
  busy,
  disabled,
  onPress,
  accessibilityLabel,
}: {
  width: number;
  busy: boolean;
  disabled?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={busy || disabled}
      style={[
        styles.addTile,
        { width, height: width },
        disabled && !busy && styles.addTileDisabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: Boolean(disabled) }}>
      {busy ? (
        <ActivityIndicator color={brand.orangeDeep} />
      ) : (
        <>
          <View style={styles.addChip}>
            <PlusAttachIcon size={20} color={brand.orangeDeep} />
          </View>
          <Text style={styles.addLabel}>Add</Text>
        </>
      )}
    </Pressable>
  );
}

function SelectedBadge() {
  return (
    <View style={styles.selectedBadge}>
      <CheckIcon size={13} color="#FFFFFF" />
    </View>
  );
}

function UploadTile({
  item,
  width,
  selected,
  onPress,
}: {
  item: ReferenceUpload;
  width: number;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tile, { width, height: width }, selected && styles.tileSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={selected ? 'Selected upload — tap to deselect' : 'Select this upload'}>
      <Image
        source={{ uri: resizedImageUrl(item.url, { width, height: width }) }}
        style={styles.tileImage}
        contentFit="cover"
      />
      {selected ? <SelectedBadge /> : null}
    </Pressable>
  );
}

function GenerationTile({
  generation,
  width,
  selected,
  onPress,
}: {
  generation: Generation;
  width: number;
  selected: boolean;
  onPress: () => void;
}) {
  const url = primaryAssetUrl(generation);
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tile, { width, height: width }, selected && styles.tileSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={generation.prompt}>
      {url ? (
        <Image
          source={{ uri: resizedImageUrl(url, { width, height: width }) }}
          style={styles.tileImage}
          contentFit="cover"
        />
      ) : null}
      {selected ? <SelectedBadge /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    backgroundColor: brand.canvasBottom,
  },
  sheetInner: {
    flex: 1,
  },
  handleHit: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 10,
    minHeight: 36,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(148,163,184,0.55)',
  },
  header: {
    paddingHorizontal: SIDE,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: brand.ink,
    letterSpacing: -0.4,
  },
  tabRow: {
    marginTop: 14,
    marginHorizontal: SIDE,
    flexDirection: 'row',
    gap: 8,
    padding: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: brand.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: brand.orange,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: brand.muted,
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    color: brand.muted,
    fontWeight: '600',
    textAlign: 'center',
  },
  gridContent: {
    paddingTop: 14,
    paddingBottom: CONFIRM_BAR_HEIGHT + 24,
  },
  grid: {
    paddingHorizontal: SIDE,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  tile: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: brand.creamDeep,
  },
  tileSelected: {
    borderWidth: 3,
    borderColor: brand.orange,
  },
  tileImage: {
    ...StyleSheet.absoluteFill,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.orange,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  addTile: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(249, 115, 22, 0.45)',
    backgroundColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  addTileDisabled: {
    opacity: 0.4,
  },
  addChip: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.orangeSoft,
  },
  addLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: brand.orangeDeep,
  },
  confirmBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SIDE,
    paddingTop: 12,
    backgroundColor: 'transparent',
  },
  confirmBtn: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.orange,
  },
  confirmLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
