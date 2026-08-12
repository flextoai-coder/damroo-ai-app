import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
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

import { ChevronLeftIcon } from '@/components/onboarding/icons';
import { TemplateStepOptionCard } from '@/components/templates/template-step-option-card';
import { brand } from '@/constants/brand';
import { SHEET_SPRING } from '@/constants/sheet-motion';
import { defaultTemplateSelections, type Template } from '@/services/templates';
import type { TemplateRemixConfig, TemplateStepSelections } from '@/types/template-remix';

const SIDE = 22;
const OPTION_GAP = 12;
const DISMISS_DISTANCE_RATIO = 0.22;
const DISMISS_VELOCITY = 900;

type TemplateConfigureSheetProps = {
  visible: boolean;
  template: Template | null;
  config: TemplateRemixConfig | null;
  onFinish: (selections: TemplateStepSelections) => void;
  onCancel: () => void;
};

/**
 * Bottom-sheet wizard: one step at a time, each a row of visual option
 * cards. "Skip customization" and the final step's "Continue" both submit
 * the same live `selections` state — every step is pre-seeded with its
 * default (first) option on open, so there's nothing extra to merge.
 */
export function TemplateConfigureSheet({
  visible,
  template,
  config,
  onFinish,
  onCancel,
}: TemplateConfigureSheetProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [stepIndex, setStepIndex] = useState(0);
  const [selections, setSelections] = useState<TemplateStepSelections>({});

  const sheetHeight = Math.min(height * 0.82, height - insets.top - 24);
  const optionWidth = (width - SIDE * 2 - OPTION_GAP) / 2;

  const translateY = useSharedValue(sheetHeight);
  const dragOriginY = useSharedValue(0);
  const sheetHeightSV = useSharedValue(sheetHeight);

  useEffect(() => {
    sheetHeightSV.value = sheetHeight;
  }, [sheetHeight, sheetHeightSV]);

  useEffect(() => {
    if (!visible || !config) {
      translateY.value = sheetHeight;
      return;
    }
    setStepIndex(0);
    setSelections(defaultTemplateSelections(config.steps));
    translateY.value = sheetHeight;
    translateY.value = withSpring(0, SHEET_SPRING);
  }, [visible, config, sheetHeight, translateY]);

  const dismiss = () => {
    translateY.value = withTiming(sheetHeightSV.value, { duration: 220 }, (finished) => {
      if (finished) runOnJS(onCancel)();
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
          if (finished) runOnJS(onCancel)();
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

  if (!template || !config) return null;

  const steps = config.steps;
  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const selectedOptionId = selections[step.id];

  const selectOption = (optionId: string) => {
    setSelections((prev) => ({ ...prev, [step.id]: optionId }));
  };

  const goNext = () => {
    if (isLastStep) {
      onFinish(selections);
      return;
    }
    setStepIndex((i) => i + 1);
  };

  const goBack = () => {
    if (stepIndex === 0) {
      dismiss();
      return;
    }
    setStepIndex((i) => i - 1);
  };

  const skipCustomization = () => onFinish(selections);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={dismiss} statusBarTranslucent>
      <GestureHandlerRootView style={styles.root}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={dismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss template configuration">
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
              <Pressable
                onPress={goBack}
                accessibilityRole="button"
                accessibilityLabel={stepIndex === 0 ? 'Close' : 'Go back'}
                style={styles.backButton}>
                <ChevronLeftIcon size={16} color={brand.ink} />
              </Pressable>

              <View style={styles.progressRow}>
                {steps.map((s, i) => {
                  const filled = i <= stepIndex;
                  return filled ? (
                    <LinearGradient
                      key={s.id}
                      colors={[brand.orange, brand.orangeDeep]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.progressSegment}
                    />
                  ) : (
                    <View key={s.id} style={[styles.progressSegment, styles.progressEmpty]} />
                  );
                })}
              </View>

              <Pressable
                onPress={skipCustomization}
                accessibilityRole="button"
                accessibilityLabel="Skip customization"
                style={styles.skipButton}>
                <Text style={styles.skipLabel}>Skip</Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              showsVerticalScrollIndicator={false}>
              <Text style={styles.title}>{step.title}</Text>
              {step.subtitle ? <Text style={styles.subtitle}>{step.subtitle}</Text> : null}

              <View style={styles.optionsRow}>
                {step.options.map((option) => (
                  <TemplateStepOptionCard
                    key={option.id}
                    option={option}
                    selected={option.id === selectedOptionId}
                    onPress={() => selectOption(option.id)}
                    width={optionWidth}
                  />
                ))}
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <Pressable
                onPress={goNext}
                accessibilityRole="button"
                accessibilityLabel={isLastStep ? 'Continue' : 'Next'}
                style={styles.primaryButtonWrap}>
                <LinearGradient
                  colors={[brand.orange, '#FB923C']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.primaryButton}>
                  <Text style={styles.primaryLabel}>
                    {isLastStep ? 'Continue' : 'Next'} <Text style={styles.primaryArrow}>→</Text>
                  </Text>
                </LinearGradient>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  progressRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  progressSegment: {
    flex: 1,
    height: 5,
    borderRadius: 999,
  },
  progressEmpty: {
    backgroundColor: 'rgba(148, 163, 184, 0.28)',
  },
  skipButton: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  skipLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: brand.muted,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    flexGrow: 1,
    paddingHorizontal: SIDE,
    paddingTop: 22,
    paddingBottom: 8,
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
    fontWeight: '500',
    color: brand.muted,
  },
  optionsRow: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: OPTION_GAP,
  },
  footer: {
    paddingHorizontal: SIDE,
    paddingTop: 12,
  },
  primaryButtonWrap: {
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: brand.orangeDeep,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  primaryButton: {
    height: 54,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  primaryArrow: {
    fontWeight: '600',
  },
});
