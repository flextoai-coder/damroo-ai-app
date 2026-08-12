import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

import { CheckIcon } from '@/components/onboarding/icons';
import { brand } from '@/constants/brand';
import { SHEET_SPRING } from '@/constants/sheet-motion';
import { toUserErrorMessage } from '@/lib/errors';
import { resizedImageUrl } from '@/lib/image-transform';
import { requestSaveToGalleryAccess } from '@/lib/media-permissions';
import { saveImageToGallery } from '@/lib/save-image';
import { shareImage } from '@/lib/share-image';
import { toast } from '@/stores/toast-store';

const SIDE = 22;
const GAP = 12;
const DISMISS_DISTANCE_RATIO = 0.22;
const DISMISS_VELOCITY = 900;

type SelectImagesSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** The generation's full set of image URLs, in order. */
  urls: string[];
  /**
   * 'save' allows picking any number of images and saves them all in one
   * batch. 'share' is single-select only — the native share sheet only
   * ever takes one file, so picking a new image swaps the selection
   * instead of adding to it.
   */
  mode: 'save' | 'share';
};

/**
 * Shown instead of acting straight away whenever a generation produced more
 * than one image — lets the user pick which of the N results the save/share
 * action should apply to, rather than always acting on just the first.
 */
export function SelectImagesSheet({ visible, onClose, urls, mode }: SelectImagesSheetProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [trackedVisible, setTrackedVisible] = useState(visible);

  const colWidth = (width - SIDE * 2 - GAP) / 2;
  const sheetHeight = Math.min(height * 0.75, height - insets.top - 24);

  const translateY = useSharedValue(sheetHeight);
  const dragOriginY = useSharedValue(0);
  const sheetHeightSV = useSharedValue(sheetHeight);

  // Adjust selection state during render when `visible` flips true, rather
  // than in the effect below. Save starts with everything selected — the
  // common case is "save all of them," deselecting a few is less friction
  // than opting in one by one. Share starts with just the first, since only
  // one can ever be selected there.
  if (visible !== trackedVisible) {
    setTrackedVisible(visible);
    if (visible) {
      setSelected(mode === 'save' ? new Set(urls.map((_, i) => i)) : new Set([0]));
      setBusy(false);
    }
  }

  useEffect(() => {
    sheetHeightSV.value = sheetHeight;
  }, [sheetHeight, sheetHeightSV]);

  useEffect(() => {
    if (!visible) {
      translateY.value = sheetHeight;
      return;
    }
    translateY.value = sheetHeight;
    translateY.value = withSpring(0, SHEET_SPRING);
  }, [visible, sheetHeight, translateY]);

  const finishClose = () => onClose();

  const dismiss = () => {
    if (busy) return;
    translateY.value = withTiming(sheetHeightSV.value, { duration: 220 }, (finished) => {
      if (finished) runOnJS(finishClose)();
    });
  };

  const pan = Gesture.Pan()
    .onBegin(() => {
      dragOriginY.value = translateY.value;
    })
    .onUpdate((e) => {
      if (busy) return;
      translateY.value = Math.max(0, dragOriginY.value + e.translationY);
    })
    .onEnd((e) => {
      if (busy) return;
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

  const toggle = (index: number) => {
    if (mode === 'share') {
      setSelected(new Set([index]));
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const onSave = async () => {
    if (busy || selected.size === 0) return;
    setBusy(true);
    try {
      const granted = await requestSaveToGalleryAccess();
      if (!granted) return;

      const targets = urls.filter((_, i) => selected.has(i));
      let failures = 0;
      for (const url of targets) {
        try {
          await saveImageToGallery(url);
        } catch {
          failures += 1;
        }
      }

      if (failures === 0) {
        toast(
          targets.length === 1 ? 'Saved to your photos' : `Saved ${targets.length} images to your photos`,
          'success',
        );
        finishClose();
      } else if (failures < targets.length) {
        toast(`Saved ${targets.length - failures} of ${targets.length} images`, 'error');
      } else {
        toast('Couldn’t save the selected images', 'error');
      }
    } catch (e) {
      toast(toUserErrorMessage(e, 'Couldn’t save images'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const onShare = async () => {
    if (busy || selected.size === 0) return;
    const index = [...selected][0];
    const url = urls[index];
    if (!url) return;

    setBusy(true);
    try {
      await shareImage(url, 'Share your design');
      finishClose();
    } catch (e) {
      toast(toUserErrorMessage(e, 'Share failed'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const onConfirm = mode === 'save' ? onSave : onShare;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={dismiss} statusBarTranslucent>
      <GestureHandlerRootView style={styles.root}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={dismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss">
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
              <Text style={styles.title}>
                {mode === 'save' ? 'Select images to save' : 'Select an image to share'}
              </Text>
              <Text style={styles.subtitle}>
                {mode === 'save'
                  ? `${selected.size} of ${urls.length} selected`
                  : `Image ${selected.size ? [...selected][0] + 1 : 1} of ${urls.length}`}
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.gridContent}>
              <View style={styles.grid}>
                {urls.map((url, i) => {
                  const isSelected = selected.has(i);
                  return (
                    <Pressable
                      key={url}
                      onPress={() => toggle(i)}
                      disabled={busy}
                      style={[styles.tile, { width: colWidth, height: colWidth }]}
                      accessibilityRole={mode === 'save' ? 'checkbox' : 'radio'}
                      accessibilityState={{ checked: isSelected }}
                      accessibilityLabel={`Image ${i + 1}`}>
                      <Image
                        source={{ uri: resizedImageUrl(url, { width: colWidth, height: colWidth }) }}
                        style={styles.tileImage}
                        contentFit="cover"
                      />
                      <View style={[styles.tileOverlay, !isSelected && styles.tileOverlayDim]} />
                      <View style={[styles.checkBadge, isSelected && styles.checkBadgeActive]}>
                        {isSelected ? <CheckIcon size={11} color="#FFFFFF" /> : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <Pressable
                onPress={() => void onConfirm()}
                disabled={busy || selected.size === 0}
                style={[styles.primaryBtn, (busy || selected.size === 0) && styles.primaryBtnDisabled]}
                accessibilityRole="button"
                accessibilityLabel={mode === 'save' ? 'Save selected images' : 'Share selected image'}>
                {busy ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryLabel}>
                    {selected.size === 0
                      ? mode === 'save'
                        ? 'Select images to save'
                        : 'Select an image to share'
                      : mode === 'save'
                        ? `Save ${selected.size} ${selected.size === 1 ? 'image' : 'images'}`
                        : 'Share'}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
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
    fontSize: 21,
    fontWeight: '800',
    color: brand.ink,
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: brand.muted,
  },
  gridContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  grid: {
    paddingHorizontal: SIDE,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  tile: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: brand.creamDeep,
  },
  tileImage: {
    ...StyleSheet.absoluteFill,
  },
  tileOverlay: {
    ...StyleSheet.absoluteFill,
  },
  tileOverlayDim: {
    backgroundColor: 'rgba(15,23,42,0.4)',
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  checkBadgeActive: {
    backgroundColor: brand.orange,
    borderColor: brand.orange,
  },
  footer: {
    paddingHorizontal: SIDE,
    paddingTop: 12,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.orange,
  },
  primaryBtnDisabled: {
    opacity: 0.45,
  },
  primaryLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
