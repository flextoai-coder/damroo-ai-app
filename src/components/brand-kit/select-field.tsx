import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
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

import { brand } from '@/constants/brand';
import { SHEET_SPRING } from '@/constants/sheet-motion';

const DISMISS_DISTANCE_RATIO = 0.22;
const DISMISS_VELOCITY = 900;

type SelectOptionSheetProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  options: readonly string[];
  value: string;
  onClose: () => void;
  onSelect: (value: string) => void;
};

export function SelectOptionSheet({
  visible,
  title,
  subtitle,
  options,
  value,
  onClose,
  onSelect,
}: SelectOptionSheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const sheetHeight = Math.min(height * 0.56, height - insets.top - 48);

  const translateY = useSharedValue(sheetHeight);
  const dragOriginY = useSharedValue(0);
  const sheetHeightSV = useSharedValue(sheetHeight);

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
          accessibilityLabel={`Dismiss ${title}`}>
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
                accessibilityLabel={`Drag down to close ${title}`}>
                <View style={styles.handle} />
              </Animated.View>
            </GestureDetector>

            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>

            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              bounces={false}>
              {options.map((option) => {
                const selected = value === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => {
                      onSelect(option);
                      dismiss();
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={({ pressed }) => [
                      styles.option,
                      selected && styles.optionSelected,
                      pressed && styles.optionPressed,
                    ]}>
                    <Text
                      style={[styles.optionLabel, selected && styles.optionLabelSelected]}
                      numberOfLines={2}>
                      {option}
                    </Text>
                    {selected ? <Text style={styles.check}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

type MultiSelectOptionSheetProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  options: readonly string[];
  values: string[];
  onClose: () => void;
  onChange: (values: string[]) => void;
};

export function MultiSelectOptionSheet({
  visible,
  title,
  subtitle,
  options,
  values,
  onClose,
  onChange,
}: MultiSelectOptionSheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const sheetHeight = Math.min(height * 0.62, height - insets.top - 48);
  const [draft, setDraft] = useState<string[]>(values);

  const translateY = useSharedValue(sheetHeight);
  const dragOriginY = useSharedValue(0);
  const sheetHeightSV = useSharedValue(sheetHeight);

  useEffect(() => {
    sheetHeightSV.value = sheetHeight;
  }, [sheetHeight, sheetHeightSV]);

  useEffect(() => {
    if (!visible) {
      translateY.value = sheetHeight;
      return;
    }
    setDraft(values);
    translateY.value = sheetHeight;
    translateY.value = withSpring(0, SHEET_SPRING);
  }, [visible, sheetHeight, translateY, values]);

  const finishClose = () => {
    onClose();
  };

  const dismiss = () => {
    translateY.value = withTiming(sheetHeightSV.value, { duration: 220 }, (finished) => {
      if (finished) runOnJS(finishClose)();
    });
  };

  const confirm = () => {
    onChange(draft);
    dismiss();
  };

  const toggle = (option: string) => {
    setDraft((prev) =>
      prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option],
    );
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

  const countLabel =
    draft.length === 0
      ? 'None selected'
      : draft.length === 1
        ? '1 selected'
        : `${draft.length} selected`;

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
          accessibilityLabel={`Dismiss ${title}`}>
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
                accessibilityLabel={`Drag down to close ${title}`}>
                <View style={styles.handle} />
              </Animated.View>
            </GestureDetector>

            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>
                {subtitle ? `${subtitle} · ${countLabel}` : countLabel}
              </Text>
            </View>

            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              bounces={false}>
              {options.map((option) => {
                const selected = draft.includes(option);
                return (
                  <Pressable
                    key={option}
                    onPress={() => toggle(option)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    style={({ pressed }) => [
                      styles.option,
                      selected && styles.optionSelected,
                      pressed && styles.optionPressed,
                    ]}>
                    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                      {selected ? <Text style={styles.checkboxMark}>✓</Text> : null}
                    </View>
                    <Text
                      style={[styles.optionLabel, selected && styles.optionLabelSelected]}
                      numberOfLines={2}>
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              onPress={confirm}
              accessibilityRole="button"
              accessibilityLabel={`Done selecting ${title}`}
              style={({ pressed }) => [styles.doneHit, pressed && styles.doneHitPressed]}>
              <LinearGradient
                colors={[brand.orange, brand.orangeDeep]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.doneBtn}>
                <Text style={styles.doneLabel}>Done</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  options: readonly string[];
  sheetTitle?: string;
  sheetSubtitle?: string;
  onChange: (value: string) => void;
};

export function SelectField({
  label,
  value,
  placeholder = 'Select…',
  options,
  sheetTitle,
  sheetSubtitle,
  onChange,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const display = value.trim() || placeholder;
  const hasValue = Boolean(value.trim());

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Choose ${label}`}
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}>
        <Text
          style={[styles.triggerValue, !hasValue && styles.triggerPlaceholder]}
          numberOfLines={1}>
          {display}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <SelectOptionSheet
        visible={open}
        title={sheetTitle ?? label}
        subtitle={sheetSubtitle}
        options={options}
        value={value}
        onClose={() => setOpen(false)}
        onSelect={onChange}
      />
    </View>
  );
}

type MultiSelectFieldProps = {
  label: string;
  values: string[];
  placeholder?: string;
  options: readonly string[];
  sheetTitle?: string;
  sheetSubtitle?: string;
  onChange: (values: string[]) => void;
};

export function MultiSelectField({
  label,
  values,
  placeholder = 'Select…',
  options,
  sheetTitle,
  sheetSubtitle,
  onChange,
}: MultiSelectFieldProps) {
  const [open, setOpen] = useState(false);
  const hasValue = values.length > 0;
  const display = hasValue
    ? values.length <= 2
      ? values.join(', ')
      : `${values.slice(0, 2).join(', ')} +${values.length - 2}`
    : placeholder;

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Choose ${label}`}
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}>
        <Text
          style={[styles.triggerValue, !hasValue && styles.triggerPlaceholder]}
          numberOfLines={2}>
          {display}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <MultiSelectOptionSheet
        visible={open}
        title={sheetTitle ?? label}
        subtitle={sheetSubtitle}
        options={options}
        values={values}
        onClose={() => setOpen(false)}
        onChange={onChange}
      />
    </View>
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
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,248,241,0.92)',
  },
  sheetInner: {
    flex: 1,
    paddingHorizontal: 20,
  },
  handleHit: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.18)',
  },
  header: {
    gap: 4,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: brand.ink,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: brand.muted,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 8,
    paddingBottom: 8,
  },
  option: {
    minHeight: 54,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionSelected: {
    borderColor: brand.orange,
    backgroundColor: brand.orangeSoft,
  },
  optionPressed: {
    opacity: 0.92,
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: brand.ink,
  },
  optionLabelSelected: {
    color: brand.orangeDeep,
  },
  check: {
    fontSize: 16,
    fontWeight: '800',
    color: brand.orangeDeep,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: 'rgba(148,163,184,0.7)',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: brand.orangeDeep,
    backgroundColor: brand.orange,
  },
  checkboxMark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    marginTop: -1,
  },
  doneHit: {
    marginTop: 12,
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  doneHitPressed: {
    opacity: 0.92,
  },
  doneBtn: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  fieldWrap: {
    gap: 10,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: brand.muted,
  },
  trigger: {
    minHeight: 56,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  triggerPressed: {
    opacity: 0.92,
  },
  triggerValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: brand.ink,
  },
  triggerPlaceholder: {
    color: brand.mutedSoft,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 16,
    fontWeight: '700',
    color: brand.mutedSoft,
  },
});
