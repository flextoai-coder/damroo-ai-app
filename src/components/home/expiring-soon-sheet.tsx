import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TimerIcon } from '@/components/home/icons';
import { brand } from '@/constants/brand';
import { SHEET_SPRING } from '@/constants/sheet-motion';
import { resizedImageUrl } from '@/lib/image-transform';
import { expiryDate, primaryAssetUrl, type Generation } from '@/services/generations';

const DISMISS_DISTANCE_RATIO = 0.22;
const DISMISS_VELOCITY = 900;
const TILE_SIZE = { width: 108, height: 158 };

type ExpiringSoonSheetProps = {
  visible: boolean;
  onClose: () => void;
  generations: Generation[];
  onSelect: (id: string) => void;
};

function formatExpiryLabel(generation: Generation): string {
  return expiryDate(generation).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Shown once a day (see expiring-notice-gate.ts) when the user has images
 * 5+ days old that haven't been auto-removed yet, so they can download
 * anything they want to keep before the daily retention sweep gets to it.
 */
export function ExpiringSoonSheet({ visible, onClose, generations, onSelect }: ExpiringSoonSheetProps) {
  const insets = useSafeAreaInsets();

  const translateY = useSharedValue(400);
  const dragOriginY = useSharedValue(0);
  const sheetHeightSV = useSharedValue(400);

  useEffect(() => {
    if (!visible) {
      translateY.value = sheetHeightSV.value;
      return;
    }
    translateY.value = sheetHeightSV.value;
    translateY.value = withSpring(0, SHEET_SPRING);
  }, [visible, translateY, sheetHeightSV]);

  const finishClose = () => onClose();

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

  const onSelectAndClose = (id: string) => {
    onSelect(id);
    dismiss();
  };

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
          style={[styles.sheet, sheetStyle, { paddingBottom: Math.max(insets.bottom, 16) }]}
          onLayout={(e) => {
            sheetHeightSV.value = e.nativeEvent.layout.height;
          }}>
          <BlurView intensity={55} tint="light" style={StyleSheet.absoluteFill} />
          <View>
            <GestureDetector gesture={pan}>
              <Animated.View style={styles.handleHit} accessibilityLabel="Drag down to close">
                <View style={styles.handle} />
              </Animated.View>
            </GestureDetector>

            <View style={styles.header}>
              <View style={styles.titleRow}>
                <TimerIcon size={16} color={brand.warningMuted} />
                <Text style={styles.title}>Images expiring soon</Text>
              </View>
              <Text style={styles.subtitle}>
                These are removed 7 days after generation to keep things tidy. Download anything
                you want to keep.
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.railContent}
              decelerationRate="fast">
              {generations.map((generation) => {
                const url = primaryAssetUrl(generation);
                return (
                  <Pressable
                    key={generation.id}
                    onPress={() => onSelectAndClose(generation.id)}
                    style={styles.tile}
                    accessibilityRole="button"
                    accessibilityLabel={generation.prompt}>
                    <View style={styles.imageWrap}>
                      {url ? (
                        <Image
                          source={{ uri: resizedImageUrl(url, TILE_SIZE) }}
                          style={styles.image}
                          contentFit="cover"
                        />
                      ) : (
                        <LinearGradient
                          colors={[brand.orangeSoft, brand.creamDeep]}
                          style={styles.image}
                        />
                      )}
                    </View>
                    <Text style={styles.tileLabel}>Removes {formatExpiryLabel(generation)}</Text>
                  </Pressable>
                );
              })}
              <View style={styles.railEndPad} />
            </ScrollView>

            <Pressable onPress={dismiss} style={styles.ctaHit} accessibilityRole="button" accessibilityLabel="Got it">
              <LinearGradient
                colors={[brand.orange, brand.orangeDeep]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cta}>
                <Text style={styles.ctaLabel}>Got it</Text>
              </LinearGradient>
            </Pressable>
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
  handleHit: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 8,
    minHeight: 32,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(148,163,184,0.55)',
  },
  header: {
    paddingHorizontal: 22,
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: brand.ink,
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
    color: brand.muted,
  },
  railContent: {
    paddingLeft: 22,
    gap: 12,
    alignItems: 'flex-start',
  },
  tile: {
    width: 108,
  },
  imageWrap: {
    width: 108,
    height: 158,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: brand.creamDeep,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  tileLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '700',
    color: brand.warningMuted,
  },
  railEndPad: {
    width: 10,
  },
  ctaHit: {
    marginTop: 18,
    marginHorizontal: 22,
    borderRadius: 18,
    overflow: 'hidden',
  },
  cta: {
    minHeight: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
