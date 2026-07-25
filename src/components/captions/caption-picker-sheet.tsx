import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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

import { brand } from '@/constants/brand';
import { SHEET_SPRING } from '@/constants/sheet-motion';
import { useSession } from '@/hooks/use-session';
import { track } from '@/lib/analytics';
import { toUserErrorMessage } from '@/lib/errors';
import {
  fetchGenerationsForCaptioning,
  primaryAssetUrl,
  type CaptionableGeneration,
} from '@/services/generations';
import { generateCaption } from '@/services/playground';
import { toast } from '@/stores/toast-store';

const SIDE = 22;
const GAP = 14;
const DISMISS_DISTANCE_RATIO = 0.22;
const DISMISS_VELOCITY = 900;

type CaptionPickerSheetProps = {
  visible: boolean;
  onClose: () => void;
};

/** Bottom sheet: pick a past generation to write (or rewrite) a caption for. */
export function CaptionPickerSheet({ visible, onClose }: CaptionPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const { user, profile } = useSession();
  const [hideCaptioned, setHideCaptioned] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['generations', 'captionable', user?.id],
    queryFn: () => fetchGenerationsForCaptioning(user!.id),
    enabled: visible && Boolean(user?.id),
  });

  const generations = query.data ?? [];
  const visibleGenerations = hideCaptioned
    ? generations.filter((g) => !g.hasCaption)
    : generations;

  const colWidth = (width - SIDE * 2 - GAP) / 2;
  const sheetHeight = Math.min(height * 0.88, height - insets.top - 24);

  const translateY = useSharedValue(sheetHeight);
  const dragOriginY = useSharedValue(0);
  const sheetHeightSV = useSharedValue(sheetHeight);

  useEffect(() => {
    sheetHeightSV.value = sheetHeight;
  }, [sheetHeight, sheetHeightSV]);

  useEffect(() => {
    if (!visible) {
      setHideCaptioned(false);
      setBusyId(null);
      translateY.value = sheetHeight;
      return;
    }

    translateY.value = sheetHeight;
    translateY.value = withSpring(0, SHEET_SPRING);
  }, [visible, sheetHeight, translateY]);

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

  const onPick = async (generation: CaptionableGeneration) => {
    if (busyId || !user?.id) return;
    setBusyId(generation.id);
    try {
      await generateCaption({
        generationId: generation.id,
        prompt: generation.prompt,
        businessName: profile?.business_name ?? undefined,
      });
      toast('Caption ready', 'success');
      track('caption_generated', { generation_id: generation.id });
      dismiss();
      router.push(`/generation/${generation.id}` as Href);
    } catch (e) {
      toast(toUserErrorMessage(e, 'Couldn’t generate caption'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const allEmpty = generations.length === 0;

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
          accessibilityLabel="Dismiss caption picker">
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
              <View style={styles.headerCopy}>
                <Text style={styles.title}>Generate captions</Text>
                <Text style={styles.subtitle}>Pick a generation to write a caption for</Text>
              </View>
              <Pressable onPress={dismiss} style={styles.closeBtn} accessibilityLabel="Close">
                <Text style={styles.closeLabel}>Close</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => setHideCaptioned((v) => !v)}
              style={styles.toggleRow}
              accessibilityRole="switch"
              accessibilityState={{ checked: hideCaptioned }}
              accessibilityLabel="Hide already captioned">
              <View style={styles.toggleCopy}>
                <Text style={styles.toggleTitle}>Hide already captioned</Text>
                <Text style={styles.toggleSubtitle}>Only show generations that still need one</Text>
              </View>
              <Switch
                value={hideCaptioned}
                onValueChange={setHideCaptioned}
                trackColor={{ false: '#E2E8F0', true: brand.orange }}
                thumbColor="#FFFFFF"
                style={styles.toggleSwitch}
              />
            </Pressable>

            {query.isLoading ? (
              <View style={styles.loader}>
                <ActivityIndicator color={brand.orange} />
              </View>
            ) : query.isError ? (
              <View style={styles.loader}>
                <Text style={styles.errorText}>Couldn’t load your generations.</Text>
                <Pressable onPress={() => void query.refetch()}>
                  <Text style={styles.retry}>Tap to retry</Text>
                </Pressable>
              </View>
            ) : visibleGenerations.length === 0 ? (
              <View style={styles.loader}>
                <Text style={styles.errorText}>
                  {allEmpty
                    ? 'No generations yet — create one first.'
                    : 'All your generations already have captions.'}
                </Text>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.gridContent}>
                <View style={styles.grid}>
                  {visibleGenerations.map((g) => (
                    <GenerationTile
                      key={g.id}
                      generation={g}
                      width={colWidth}
                      busy={busyId === g.id}
                      onPress={() => void onPick(g)}
                    />
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function GenerationTile({
  generation,
  width,
  busy,
  onPress,
}: {
  generation: CaptionableGeneration;
  width: number;
  busy: boolean;
  onPress: () => void;
}) {
  const url = primaryAssetUrl(generation);
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      style={[styles.tile, { width, height: width }]}
      accessibilityRole="button"
      accessibilityLabel={generation.prompt}>
      {url ? (
        <Image source={{ uri: url }} style={styles.tileImage} contentFit="cover" />
      ) : (
        <LinearGradient colors={[brand.creamDeep, brand.orangeSoft]} style={styles.tileImage} />
      )}
      {generation.hasCaption ? (
        <View style={styles.captionBadge}>
          <Text style={styles.captionBadgeText}>Captioned</Text>
        </View>
      ) : null}
      {busy ? (
        <View style={styles.tileBusy}>
          <ActivityIndicator color="#FFFFFF" />
        </View>
      ) : null}
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: brand.ink,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '500',
    color: brand.muted,
  },
  closeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  closeLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: brand.orangeDeep,
  },
  toggleRow: {
    marginTop: 14,
    marginHorizontal: SIDE,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: brand.border,
  },
  toggleCopy: {
    flex: 1,
    minWidth: 0,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: brand.ink,
  },
  toggleSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: brand.muted,
  },
  toggleSwitch: {
    pointerEvents: 'none',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  errorText: {
    color: brand.muted,
    fontWeight: '600',
    textAlign: 'center',
  },
  retry: {
    color: brand.orangeDeep,
    fontWeight: '800',
  },
  gridContent: {
    paddingTop: 14,
    paddingBottom: 24,
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
  tileImage: {
    ...StyleSheet.absoluteFill,
  },
  captionBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(15,23,42,0.72)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  captionBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  tileBusy: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15,23,42,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
