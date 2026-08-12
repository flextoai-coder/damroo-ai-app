import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
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
import ColorPicker, {
  HueSlider,
  Panel1,
  Preview,
  type ColorFormatsObject,
  type ColorPickerRef,
} from 'reanimated-color-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { brand } from '@/constants/brand';
import { normalizeHexColor } from '@/constants/brand-kit';
import { SHEET_SPRING } from '@/constants/sheet-motion';

const DISMISS_DISTANCE_RATIO = 0.22;
const DISMISS_VELOCITY = 900;
const DEFAULT_COLOR = brand.orange;

type Format = 'HEX' | 'RGB';

type RgbChannels = { r: string; g: string; b: string };

type ColorPickerSheetProps = {
  visible: boolean;
  label: string;
  value: string;
  onClose: () => void;
  onSelect: (hex: string) => void;
};

function toSolidHex(raw: string, fallback: string): string {
  const trimmed = raw.trim();
  const six = normalizeHexColor(trimmed.slice(0, 7));
  if (six) return six;
  if (/^#[0-9A-Fa-f]{8}$/.test(trimmed)) {
    const fromAlpha = normalizeHexColor(trimmed.slice(0, 7));
    if (fromAlpha) return fromAlpha;
  }
  return normalizeHexColor(fallback) ?? DEFAULT_COLOR;
}

function hexToRgb(hex: string): RgbChannels {
  const solid = toSolidHex(hex, DEFAULT_COLOR);
  return {
    r: String(parseInt(solid.slice(1, 3), 16)),
    g: String(parseInt(solid.slice(3, 5), 16)),
    b: String(parseInt(solid.slice(5, 7), 16)),
  };
}

function clampByte(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(255, Math.round(n)));
}

function rgbChannelsToHex(rgb: RgbChannels): string | null {
  if (rgb.r.trim() === '' || rgb.g.trim() === '' || rgb.b.trim() === '') return null;
  const r = Number(rgb.r);
  const g = Number(rgb.g);
  const b = Number(rgb.b);
  if (![r, g, b].every((n) => Number.isFinite(n))) return null;
  const hex =
    '#' +
    [clampByte(r), clampByte(g), clampByte(b)]
      .map((n) => n.toString(16).padStart(2, '0'))
      .join('');
  return hex.toUpperCase();
}

function parseRgbString(rgb: string): RgbChannels | null {
  const match = rgb.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (!match) return null;
  return {
    r: String(clampByte(Number(match[1]))),
    g: String(clampByte(Number(match[2]))),
    b: String(clampByte(Number(match[3]))),
  };
}

export function ColorPickerSheet({
  visible,
  label,
  value,
  onClose,
  onSelect,
}: ColorPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const sheetHeight = Math.min(height * 0.78, height - insets.top - 40);
  const pickerRef = useRef<ColorPickerRef>(null);
  const inputFocusedRef = useRef(false);
  const valueRef = useRef(value);
  valueRef.current = value;

  const seed = toSolidHex(value, DEFAULT_COLOR);
  /** Stable seed for ColorPicker — never bind live draft back into `value`. */
  const [pickerSeed, setPickerSeed] = useState(seed);
  const [draftHex, setDraftHex] = useState(seed);
  const [format, setFormat] = useState<Format>('HEX');
  const [hexText, setHexText] = useState(seed);
  const [rgbText, setRgbText] = useState<RgbChannels>(() => hexToRgb(seed));

  const translateY = useSharedValue(sheetHeight);
  const dragOriginY = useSharedValue(0);
  const sheetHeightSV = useSharedValue(sheetHeight);

  useEffect(() => {
    sheetHeightSV.value = sheetHeight;
  }, [sheetHeight, sheetHeightSV]);

  useEffect(() => {
    if (!visible) {
      translateY.value = sheetHeight;
      inputFocusedRef.current = false;
      return;
    }

    const next = toSolidHex(valueRef.current, DEFAULT_COLOR);
    setPickerSeed(next);
    setDraftHex(next);
    setHexText(next);
    setRgbText(hexToRgb(next));
    setFormat('HEX');
    translateY.value = sheetHeight;
    translateY.value = withSpring(0, SHEET_SPRING);

    // Ensure thumbs land on the opening color after mount.
    requestAnimationFrame(() => {
      pickerRef.current?.setColor(next, 0);
    });
    // Re-seed only on a real open/close transition — `onApply` updates the
    // parent's `value` while this sheet is still visible and mid-dismiss;
    // reacting to that here would reset translateY and reopen the sheet.
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

  /** Spectrum / hue moved → keep Apply + text fields in sync (unless typing). */
  const syncFromPicker = (colors: ColorFormatsObject) => {
    const hex = toSolidHex(colors.hex, DEFAULT_COLOR);
    setDraftHex(hex);
    if (inputFocusedRef.current) return;
    setHexText(hex);
    setRgbText(parseRgbString(colors.rgb) ?? hexToRgb(hex));
  };

  const applyColorToPicker = (hex: string) => {
    const solid = toSolidHex(hex, DEFAULT_COLOR);
    setDraftHex(solid);
    pickerRef.current?.setColor(solid, 0);
  };

  const onHexChange = (text: string) => {
    const cleaned = text.replace(/[^#0-9A-Fa-f]/g, '').slice(0, 7);
    const withHash =
      cleaned.length === 0 ? '#' : cleaned.startsWith('#') ? cleaned : `#${cleaned}`;
    setHexText(withHash.toUpperCase());

    const solid = normalizeHexColor(withHash);
    if (!solid) return;
    setRgbText(hexToRgb(solid));
    applyColorToPicker(solid);
  };

  const onRgbChannelChange = (channel: keyof RgbChannels, text: string) => {
    const digits = text.replace(/[^0-9]/g, '').slice(0, 3);
    const next = { ...rgbText, [channel]: digits };
    setRgbText(next);

    const hex = rgbChannelsToHex(next);
    if (!hex) return;
    setHexText(hex);
    applyColorToPicker(hex);
  };

  const onApply = () => {
    onSelect(toSolidHex(draftHex, DEFAULT_COLOR));
    dismiss();
  };

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
          accessibilityLabel="Dismiss color picker">
          <Animated.View style={[styles.scrim, scrimStyle]} pointerEvents="none" />
        </Pressable>

        <Animated.View
          style={[
            styles.sheet,
            sheetStyle,
            { height: sheetHeight, paddingBottom: Math.max(insets.bottom, 12) },
          ]}>
          <BlurView intensity={55} tint="light" style={StyleSheet.absoluteFill} />
          <KeyboardAvoidingView
            style={styles.sheetInner}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <GestureDetector gesture={pan}>
              <Animated.View
                style={styles.handleHit}
                accessibilityRole="adjustable"
                accessibilityLabel="Drag down to close color picker">
                <View style={styles.handle} />
              </Animated.View>
            </GestureDetector>

            <View style={styles.header}>
              <Text style={styles.title}>{label} color</Text>
              <Text style={styles.subtitle}>Spectrum, HEX, and RGB stay in sync</Text>
            </View>

            <ColorPicker
              ref={pickerRef}
              value={pickerSeed}
              style={styles.picker}
              sliderThickness={28}
              thumbSize={28}
              thumbShape="ring"
              boundedThumb
              onChangeJS={syncFromPicker}
              onCompleteJS={syncFromPicker}>
              <Preview
                style={styles.preview}
                textStyle={styles.previewText}
                colorFormat="hex"
                hideInitialColor
              />
              <Panel1 style={styles.panel} />
              <HueSlider style={styles.hue} />
            </ColorPicker>

            <View style={styles.formatTabs}>
              {(['HEX', 'RGB'] as const).map((tab) => {
                const active = format === tab;
                return (
                  <Pressable
                    key={tab}
                    onPress={() => setFormat(tab)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[styles.formatTab, active && styles.formatTabActive]}>
                    <Text style={[styles.formatTabLabel, active && styles.formatTabLabelActive]}>
                      {tab}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {format === 'HEX' ? (
              <TextInput
                value={hexText}
                onChangeText={onHexChange}
                onFocus={() => {
                  inputFocusedRef.current = true;
                }}
                onBlur={() => {
                  inputFocusedRef.current = false;
                  const solid = normalizeHexColor(hexText);
                  if (solid) {
                    setHexText(solid);
                    setRgbText(hexToRgb(solid));
                    applyColorToPicker(solid);
                  } else {
                    setHexText(draftHex);
                  }
                }}
                autoCapitalize="characters"
                autoCorrect={false}
                autoComplete="off"
                maxLength={7}
                placeholder="#F97316"
                placeholderTextColor={brand.mutedSoft}
                selectionColor={brand.orange}
                accessibilityLabel={`${label} hex color`}
                style={styles.hexInput}
              />
            ) : (
              <View style={styles.rgbRow}>
                {(['r', 'g', 'b'] as const).map((channel) => (
                  <View key={channel} style={styles.rgbField}>
                    <TextInput
                      value={rgbText[channel]}
                      onChangeText={(text) => onRgbChannelChange(channel, text)}
                      onFocus={() => {
                        inputFocusedRef.current = true;
                      }}
                      onBlur={() => {
                        inputFocusedRef.current = false;
                        const hex = rgbChannelsToHex(rgbText);
                        if (hex) {
                          const clamped = hexToRgb(hex);
                          setRgbText(clamped);
                          setHexText(hex);
                          applyColorToPicker(hex);
                        } else {
                          setRgbText(hexToRgb(draftHex));
                        }
                      }}
                      keyboardType="number-pad"
                      inputMode="numeric"
                      maxLength={3}
                      placeholder="0"
                      placeholderTextColor={brand.mutedSoft}
                      selectionColor={brand.orange}
                      accessibilityLabel={`${label} ${channel.toUpperCase()} channel`}
                      style={styles.rgbInput}
                    />
                    <Text style={styles.rgbTitle}>{channel.toUpperCase()}</Text>
                  </View>
                ))}
              </View>
            )}

            <Pressable
              onPress={onApply}
              accessibilityRole="button"
              accessibilityLabel={`Apply ${label} color`}
              style={({ pressed }) => [styles.applyBtn, pressed && styles.applyPressed]}>
              <LinearGradient
                colors={[brand.orange, brand.orangeDeep]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.applyGradient}>
                <View style={[styles.applySwatch, { backgroundColor: draftHex }]} />
                <Text style={styles.applyLabel}>Apply {draftHex}</Text>
              </LinearGradient>
            </Pressable>
          </KeyboardAvoidingView>
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
    marginBottom: 14,
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
  picker: {
    flexGrow: 1,
    gap: 14,
  },
  preview: {
    height: 48,
    borderRadius: 14,
    borderCurve: 'continuous',
  },
  previewText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  panel: {
    flex: 1,
    minHeight: 140,
    borderRadius: 18,
    borderCurve: 'continuous',
  },
  hue: {
    borderRadius: 14,
    borderCurve: 'continuous',
  },
  formatTabs: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    marginBottom: 10,
  },
  formatTab: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.95)',
  },
  formatTabActive: {
    backgroundColor: brand.ink,
    borderColor: brand.ink,
  },
  formatTabLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: brand.muted,
    letterSpacing: 0.4,
  },
  formatTabLabelActive: {
    color: '#FFFFFF',
  },
  hexInput: {
    minHeight: 48,
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    color: brand.ink,
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 14,
    textAlign: 'center',
    letterSpacing: 1,
  },
  rgbRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rgbField: {
    flex: 1,
    gap: 6,
    alignItems: 'center',
  },
  rgbInput: {
    width: '100%',
    minHeight: 48,
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    color: brand.ink,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  rgbTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: brand.muted,
  },
  applyBtn: {
    marginTop: 16,
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  applyPressed: {
    opacity: 0.9,
  },
  applyGradient: {
    minHeight: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  applySwatch: {
    width: 22,
    height: 22,
    borderRadius: 8,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  applyLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
