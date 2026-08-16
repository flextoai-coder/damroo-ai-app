import { Image } from 'expo-image';
import { Modal, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloseIcon } from '@/components/playground/icons';
import { SHEET_SPRING } from '@/constants/sheet-motion';
import { resizedImageUrl } from '@/lib/image-transform';

const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const DISMISS_DISTANCE = 110;
const DISMISS_VELOCITY = 800;

type ImageViewerModalProps = {
  visible: boolean;
  onClose: () => void;
  /** Full-resolution source — never the resized thumbnail proxy. */
  url: string | null;
};

/**
 * Full-screen pinch-to-zoom viewer for a single image, opened by tapping a
 * thumbnail elsewhere in the app. Always loads the original untouched URL —
 * the whole point is to show detail the resized list/grid thumbnail can't.
 * Uses the already-cached resized thumbnail as a placeholder so something
 * sharp-enough shows instantly while the full-resolution file streams in.
 */
export function ImageViewerModal({ visible, onClose, url }: ImageViewerModalProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const dismissY = useSharedValue(0);

  const resetZoom = () => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    dismissY.value = 0;
  };

  const close = () => {
    resetZoom();
    onClose();
  };

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(1, Math.min(MAX_SCALE, savedScale.value * e.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value === 1) {
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      } else {
        dismissY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (scale.value > 1) {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
        return;
      }
      const shouldDismiss =
        dismissY.value > DISMISS_DISTANCE || e.velocityY > DISMISS_VELOCITY;
      if (shouldDismiss) {
        runOnJS(close)();
      } else {
        dismissY.value = withSpring(0, SHEET_SPRING);
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withTiming(DOUBLE_TAP_SCALE);
        savedScale.value = DOUBLE_TAP_SCALE;
      }
    });

  const composedGesture = Gesture.Exclusive(doubleTap, Gesture.Simultaneous(pinch, pan));

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value + dismissY.value },
      { scale: scale.value },
    ],
  }));

  const backdropStyle = useAnimatedStyle(() => {
    const progress = 1 - Math.min(Math.abs(dismissY.value) / 300, 1);
    return { opacity: Math.max(0.3, progress) };
  });

  if (!url) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
      statusBarTranslucent>
      <GestureHandlerRootView style={styles.root}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />

        <Pressable
          style={[styles.closeBtn, { top: insets.top + 10 }]}
          onPress={close}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close">
          <CloseIcon size={18} color="#FFFFFF" />
        </Pressable>

        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[styles.imageWrap, { width, height }, imageStyle]}>
            <Image
              source={{ uri: url }}
              placeholder={{ uri: resizedImageUrl(url, { width }) }}
              style={StyleSheet.absoluteFill}
              contentFit="contain"
              transition={150}
              // Decode at the source's native resolution instead of
              // downsampling to the container size (expo-image's default) —
              // otherwise pinching in past the initial container size would
              // just upscale an already-downsampled texture instead of
              // revealing real detail, defeating the point of a zoom viewer.
              allowDownscaling={false}
            />
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
  },
  imageWrap: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
});
