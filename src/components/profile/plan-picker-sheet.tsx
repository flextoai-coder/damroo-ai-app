import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewToken,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloseIcon } from '@/components/playground/icons';
import { CheckIcon, CrownIcon } from '@/components/profile/icons';
import { brand } from '@/constants/brand';
import { formatPlanPrice, PLANS, type Plan, type PlanId } from '@/constants/plans';
import { SHEET_SPRING } from '@/constants/sheet-motion';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Plan>);

const DISMISS_DISTANCE_RATIO = 0.22;
const DISMISS_VELOCITY = 900;
const ACTIVE_SCALE = 1;
const INACTIVE_SCALE = 0.86;

type PlanPickerSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Currently active subscription plan, if any. Marked "Active" and not selectable. */
  currentPlanId?: PlanId | null;
  /** Plan the carousel opens scrolled to. Defaults to currentPlanId, else Growth. */
  initialPlanId?: PlanId | null;
  onSelectPlan: (plan: Plan) => void;
};

export function PlanPickerSheet({
  visible,
  onClose,
  currentPlanId = null,
  initialPlanId = null,
  onSelectPlan,
}: PlanPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlatList<Plan>>(null);
  const [activeIndex, setActiveIndex] = useState(1);

  const itemWidth = Math.round(width * 0.72);
  const itemGap = 14;
  const sideInset = (width - itemWidth) / 2;
  const snapInterval = itemWidth + itemGap;
  const sheetHeight = Math.min(height * 0.78, height - insets.top - 40);

  const translateY = useSharedValue(sheetHeight);
  const dragOriginY = useSharedValue(0);
  const sheetHeightSV = useSharedValue(sheetHeight);
  const scrollX = useSharedValue(snapInterval); // start on Growth (index 1)

  useEffect(() => {
    sheetHeightSV.value = sheetHeight;
  }, [sheetHeight, sheetHeightSV]);

  useEffect(() => {
    if (!visible) {
      translateY.value = sheetHeight;
      return;
    }

    const targetPlanId = initialPlanId ?? currentPlanId;
    const startIndex = targetPlanId
      ? Math.max(
          0,
          PLANS.findIndex((p) => p.id === targetPlanId),
        )
      : 1;
    const safeIndex = startIndex >= 0 ? startIndex : 1;
    setActiveIndex(safeIndex);
    scrollX.value = safeIndex * snapInterval;
    translateY.value = sheetHeight;
    translateY.value = withSpring(0, SHEET_SPRING);

    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        offset: safeIndex * snapInterval,
        animated: false,
      });
    });
  }, [visible, sheetHeight, translateY, currentPlanId, initialPlanId, snapInterval, scrollX]);

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

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / snapInterval);
    setActiveIndex(Math.max(0, Math.min(PLANS.length - 1, index)));
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];
    if (typeof first?.index === 'number') {
      setActiveIndex(first.index);
    }
  }).current;

  const activePlan = PLANS[activeIndex] ?? PLANS[1];
  const isCurrent = currentPlanId != null && activePlan?.id === currentPlanId;

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
          accessibilityLabel="Dismiss plans">
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
              <Animated.View style={styles.handleHit} accessibilityLabel="Drag down to close">
                <View style={styles.handle} />
              </Animated.View>
            </GestureDetector>

            <Pressable
              onPress={dismiss}
              hitSlop={10}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close">
              <CloseIcon size={13} color={brand.muted} />
            </Pressable>

            <View style={styles.header}>
              <Text style={styles.title}>Choose your plan</Text>
              <Text style={styles.subtitle}>1 credit = 1 image · No rollover</Text>
            </View>

            <AnimatedFlatList
              ref={listRef}
              horizontal
              data={PLANS}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={snapInterval}
              snapToAlignment="start"
              disableIntervalMomentum
              bounces
              onScroll={onScroll}
              scrollEventThrottle={16}
              onMomentumScrollEnd={onMomentumEnd}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
              contentContainerStyle={{
                paddingHorizontal: sideInset,
                alignItems: 'center',
                paddingTop: 8,
                paddingBottom: 8,
              }}
              getItemLayout={(_, index) => ({
                length: snapInterval,
                offset: snapInterval * index,
                index,
              })}
              renderItem={({ item, index }) => (
                <PlanCarouselCard
                  plan={item}
                  index={index}
                  scrollX={scrollX}
                  itemWidth={itemWidth}
                  itemGap={itemGap}
                  snapInterval={snapInterval}
                  isCurrent={currentPlanId === item.id}
                />
              )}
            />

            <View style={styles.dots}>
              {PLANS.map((plan, index) => (
                <View
                  key={plan.id}
                  style={[styles.dot, index === activeIndex && styles.dotActive]}
                />
              ))}
            </View>

            <Pressable
              onPress={() => {
                if (!activePlan || isCurrent) return;
                onSelectPlan(activePlan);
              }}
              disabled={isCurrent}
              accessibilityRole="button"
              accessibilityLabel={
                isCurrent ? `${activePlan.name} is your current plan` : `Choose ${activePlan.name}`
              }
              style={({ pressed }) => [
                styles.ctaHit,
                (isCurrent || pressed) && styles.ctaHitDim,
              ]}>
              <LinearGradient
                colors={[brand.orange, brand.orangeDeep]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cta}>
                <Text style={styles.ctaLabel}>
                  {isCurrent
                    ? 'Current plan'
                    : `Choose ${activePlan.name} · ${formatPlanPrice(activePlan.priceInr)}/mo`}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function PlanCarouselCard({
  plan,
  index,
  scrollX,
  itemWidth,
  itemGap,
  snapInterval,
  isCurrent,
}: {
  plan: Plan;
  index: number;
  scrollX: SharedValue<number>;
  itemWidth: number;
  itemGap: number;
  snapInterval: number;
  isCurrent: boolean;
}) {
  const animStyle = useAnimatedStyle(() => {
    const center = index * snapInterval;
    const scale = interpolate(
      scrollX.value,
      [center - snapInterval, center, center + snapInterval],
      [INACTIVE_SCALE, ACTIVE_SCALE, INACTIVE_SCALE],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      scrollX.value,
      [center - snapInterval, center, center + snapInterval],
      [0.72, 1, 0.72],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.cardWrap,
        { width: itemWidth, marginRight: index === PLANS.length - 1 ? 0 : itemGap },
        animStyle,
      ]}>
      <LinearGradient
        colors={plan.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, styles.squircle]}>
        <View style={[styles.blob, styles.blobTop]} />
        <View style={[styles.blob, styles.blobBottom]} />

        <View style={styles.cardTop}>
          <View style={styles.crownChip}>
            <CrownIcon size={15} />
          </View>
          {isCurrent ? (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>Active</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.planName}>{plan.name}</Text>
        <Text style={styles.planTagline}>{plan.tagline}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPlanPrice(plan.priceInr)}</Text>
          <Text style={styles.priceUnit}>/ month</Text>
        </View>
        <Text style={styles.credits}>{plan.credits.toLocaleString('en-IN')} credits</Text>

        <View style={styles.benefits}>
          {plan.benefits.map((benefit) => (
            <View key={benefit} style={styles.benefit}>
              <View style={styles.check}>
                <CheckIcon size={9} />
              </View>
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </Animated.View>
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
    paddingBottom: 8,
    minHeight: 32,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(148,163,184,0.55)',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 18,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148,163,184,0.16)',
  },
  header: {
    paddingHorizontal: 22,
    marginBottom: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: brand.ink,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '500',
    color: brand.muted,
  },
  cardWrap: {
    borderRadius: 36,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  squircle: {
    borderRadius: 36,
    borderCurve: 'continuous',
  },
  card: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    minHeight: 390,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  blobTop: {
    top: -50,
    right: -40,
  },
  blobBottom: {
    bottom: -60,
    left: -50,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  crownChip: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  planName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  planTagline: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 18,
  },
  priceRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  price: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.6,
  },
  priceUnit: {
    marginBottom: 5,
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
  },
  credits: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  benefits: {
    marginTop: 18,
    gap: 10,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  check: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 17,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 14,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(148,163,184,0.45)',
  },
  dotActive: {
    width: 18,
    backgroundColor: brand.orange,
  },
  ctaHit: {
    marginHorizontal: 22,
    borderRadius: 18,
    overflow: 'hidden',
  },
  ctaHitDim: {
    opacity: 0.7,
  },
  cta: {
    minHeight: 52,
    borderRadius: 18,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
