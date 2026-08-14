import { BlurView } from 'expo-blur';
import { useEffect, useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  BrandIcon,
  CheckIcon,
  ChevronBackIcon,
  PasteIcon,
  SparkleIcon,
  TemplateIcon,
  UploadIcon,
} from '@/components/playground/icons';
import { brand } from '@/constants/brand';
import {
  creditsPerImage,
  MAX_IMAGE_COUNT,
  MIN_IMAGE_COUNT,
  PLAYGROUND_FORMATS,
  PLAYGROUND_MODELS,
  PLAYGROUND_QUALITIES,
  PLAYGROUND_VARIATIONS,
  type PlaygroundFormat,
} from '@/constants/playground';
import type { ImageVariation } from '@/stores/chat-composer-store';

export type ComposerPopover =
  | 'referenceMenu'
  | 'model'
  | 'format'
  | 'quality'
  | 'paste'
  | 'brand'
  | null;

// Android's BlurView renders far less translucent glass than iOS's — fall
// back to a fully opaque fill there instead of a see-through menu.
const POPOVER_BLUR_INTENSITY = Platform.OS === 'android' ? 0 : 48;

type PopoverShellProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Measured height of the composer card below, so the popover sits just above it instead of overlapping. */
  composerHeight: number;
};

export function ComposerPopoverShell({
  visible,
  onClose,
  children,
  composerHeight,
}: PopoverShellProps) {
  const [mounted, setMounted] = useState(visible);
  const [trackedVisible, setTrackedVisible] = useState(visible);
  const progress = useSharedValue(visible ? 1 : 0);
  // `height` is <= 0 (it's the amount content should translate up by) — negate
  // it to get extra bottom padding so the sheet clears the keyboard as it rises,
  // without needing to dismiss the keyboard first.
  const { height: kbHeight } = useReanimatedKeyboardAnimation();

  // Adjust mounted state during render when `visible` flips true, so the
  // sheet is present before the effect below starts animating it in.
  if (visible !== trackedVisible) {
    setTrackedVisible(visible);
    if (visible) setMounted(true);
  }

  useEffect(() => {
    if (visible) {
      progress.value = withTiming(1, { duration: 200 });
    } else {
      progress.value = withTiming(0, { duration: 160 }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [visible, progress]);

  const sheetStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: (1 - progress.value) * 14 },
      { scale: 0.97 + progress.value * 0.03 },
    ],
  }));

  const sheetWrapStyle = useAnimatedStyle(() => ({
    paddingBottom: composerHeight + 10 - kbHeight.value,
  }));

  if (!mounted) return null;

  return (
    <View style={styles.layer} pointerEvents="box-none">
      {visible ? (
        // Mounted only while actually visible, not for the whole `mounted`
        // (open + closing-fade) window — otherwise it keeps swallowing taps
        // once a popover starts closing (including a tap meant to open a
        // *different* popover). This must be a mount/unmount, not a
        // `pointerEvents` toggle on a persistent node: RN/Fabric can cache
        // hit-testing on a view and fail to reliably re-enable it once
        // `pointerEvents` flips back to `'auto'`, which left the scrim stuck
        // un-tappable (popovers would open but the "tap outside to close"
        // affordance stopped working) after the first open/close cycle.
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Dismiss" />
      ) : null}
      <Animated.View
        style={[styles.sheetWrap, sheetWrapStyle]}
        // `sheetWrap`'s bottom padding reserves empty space so the visible
        // card sits above the composer instead of overlapping it — but that
        // padding sits exactly over the composer's own buttons (+, format,
        // quality) on screen. Without `box-none`, this wrapper's default
        // hit-testing swallows every tap that lands in that empty padding —
        // including a second tap on the same button meant to close the
        // popover — before it can reach the scrim or the button underneath.
        pointerEvents="box-none">
        <Animated.View style={sheetStyle}>
          <BlurView intensity={POPOVER_BLUR_INTENSITY} tint="light" style={styles.sheet}>
            {children}
          </BlurView>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

type ReferenceZonePopoverProps = {
  onAddReference: () => void;
  onTemplate: () => void;
};

/** Opened from the Reference & Templates zone's own "+". */
export function ReferenceZonePopover({ onAddReference, onTemplate }: ReferenceZonePopoverProps) {
  return (
    <View style={styles.list}>
      <Row
        icon={<UploadIcon />}
        title="Add reference image"
        subtitle="Reuse a past upload or generation"
        onPress={onAddReference}
      />
      <View style={styles.divider} />
      <Row
        icon={<TemplateIcon />}
        title="Use a template"
        subtitle="Remix a branded starting point"
        onPress={onTemplate}
      />
    </View>
  );
}

type BrandKitPopoverProps = {
  useBrandLogo: boolean;
  useBrandName: boolean;
  useBrandColors: boolean;
  onToggleBrandLogo: (value: boolean) => void;
  onToggleBrandName: (value: boolean) => void;
  onToggleBrandColors: (value: boolean) => void;
  /** Each toggle only works once its underlying brand kit data actually exists. */
  hasLogo: boolean;
  hasName: boolean;
  hasColors: boolean;
  /** Returns to the popover this one was opened from, when it was opened from one. */
  onBack?: () => void;
};

export function BrandKitPopover({
  useBrandLogo,
  useBrandName,
  useBrandColors,
  onToggleBrandLogo,
  onToggleBrandName,
  onToggleBrandColors,
  hasLogo,
  hasName,
  hasColors,
  onBack,
}: BrandKitPopoverProps) {
  return (
    <View style={styles.list}>
      {onBack ? (
        <>
          <Pressable
            onPress={onBack}
            style={styles.backRow}
            accessibilityRole="button"
            accessibilityLabel="Back">
            <ChevronBackIcon size={18} />
            <Text style={styles.backLabel}>Brand Kit</Text>
          </Pressable>
          <View style={styles.divider} />
        </>
      ) : null}
      <Text style={styles.sectionLabel}>Brand kit for this generation</Text>
      <ToggleRow
        icon={<BrandIcon />}
        title="Use brand logo"
        subtitle={
          hasLogo
            ? 'Attach your logo as a reference image — the model finds the best placement'
            : 'Upload a logo in Brand Kit to enable this'
        }
        value={useBrandLogo}
        onValueChange={onToggleBrandLogo}
        disabled={!hasLogo}
      />
      <ToggleRow
        icon={<BrandIcon />}
        title="Use brand name"
        subtitle={
          hasName
            ? 'Fit your business name using your saved typography — nothing else'
            : 'Add a business name in Profile to enable this'
        }
        value={useBrandName}
        onValueChange={onToggleBrandName}
        disabled={!hasName}
      />
      <ToggleRow
        icon={<BrandIcon />}
        title="Use brand colors"
        subtitle={
          hasColors
            ? 'Apply your brand color palette'
            : 'Set brand colors in Brand Kit to enable this'
        }
        value={useBrandColors}
        onValueChange={onToggleBrandColors}
        disabled={!hasColors}
      />
    </View>
  );
}

type PastePopoverProps = {
  onPaste: () => void;
};

/** Revealed by long-pressing the attach button when the clipboard has an image. */
export function PastePopover({ onPaste }: PastePopoverProps) {
  return (
    <View style={styles.list}>
      <Row
        icon={<PasteIcon />}
        title="Paste"
        subtitle="Use the image you've copied"
        onPress={onPaste}
      />
    </View>
  );
}

type ModelPopoverProps = {
  activeId: string;
  onSelect: (id: string) => void;
  /** Returns to the popover this one was opened from, when it was opened from one. */
  onBack?: () => void;
};

export function ModelPopover({ activeId, onSelect, onBack }: ModelPopoverProps) {
  return (
    <View style={styles.list}>
      {onBack ? (
        <>
          <Pressable
            onPress={onBack}
            style={styles.backRow}
            accessibilityRole="button"
            accessibilityLabel="Back">
            <ChevronBackIcon size={18} />
            <Text style={styles.backLabel}>Select model</Text>
          </Pressable>
          <View style={styles.divider} />
        </>
      ) : null}
      {PLAYGROUND_MODELS.map((model, index) => (
        <View key={model.id}>
          {index > 0 ? <View style={styles.divider} /> : null}
          <Row
            icon={<SparkleIcon size={16} color={brand.orangeDeep} />}
            title={model.name}
            subtitle={model.description}
            trailing={activeId === model.id ? <CheckIcon /> : null}
            onPress={() => onSelect(model.id)}
          />
        </View>
      ))}
    </View>
  );
}

type FormatPopoverProps = {
  activeId: string;
  onSelect: (id: string) => void;
};

export function FormatPopover({ activeId, onSelect }: FormatPopoverProps) {
  return (
    <View style={styles.formatRow}>
      {PLAYGROUND_FORMATS.map((format) => (
        <FormatSwatch
          key={format.id}
          format={format}
          active={activeId === format.id}
          onPress={() => onSelect(format.id)}
        />
      ))}
    </View>
  );
}

type QualityCountPopoverProps = {
  modelId: string;
  quality: '2K' | '4K';
  onSelectQuality: (quality: '2K' | '4K') => void;
  imageCount: number;
  onChangeImageCount: (count: number) => void;
  variation: ImageVariation;
  onSelectVariation: (variation: ImageVariation) => void;
};

export function QualityCountPopover({
  modelId,
  quality,
  onSelectQuality,
  imageCount,
  onChangeImageCount,
  variation,
  onSelectVariation,
}: QualityCountPopoverProps) {
  const variationEnabled = imageCount > 1;
  const totalCredits = creditsPerImage(modelId, quality) * imageCount;

  return (
    <View>
      <Text style={styles.sectionLabel}>Quality</Text>
      <View style={styles.qualityRow}>
        {PLAYGROUND_QUALITIES.map((q) => {
          const active = quality === q.id;
          return (
            <Pressable
              key={q.id}
              onPress={() => onSelectQuality(q.id)}
              style={[styles.qualityCard, active && styles.qualityCardActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${q.label} — ${q.description}`}>
              <Text style={[styles.qualityLabel, active && styles.qualityLabelActive]}>
                {q.label}
              </Text>
              <Text style={[styles.qualityDescription, active && styles.qualityDescriptionActive]}>
                {q.description}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionLabel}>Number of images</Text>
      <View style={styles.stepperRow}>
        <Pressable
          onPress={() => onChangeImageCount(imageCount - 1)}
          disabled={imageCount <= MIN_IMAGE_COUNT}
          style={[styles.stepperBtn, imageCount <= MIN_IMAGE_COUNT && styles.stepperBtnDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Fewer images">
          <Text style={styles.stepperGlyph}>−</Text>
        </Pressable>
        <Text style={styles.stepperValue}>{imageCount}</Text>
        <Pressable
          onPress={() => onChangeImageCount(imageCount + 1)}
          disabled={imageCount >= MAX_IMAGE_COUNT}
          style={[styles.stepperBtn, imageCount >= MAX_IMAGE_COUNT && styles.stepperBtnDisabled]}
          accessibilityRole="button"
          accessibilityLabel="More images">
          <Text style={styles.stepperGlyph}>+</Text>
        </Pressable>
        <Text style={styles.stepperHint}>
          {totalCredits} credit{totalCredits > 1 ? 's' : ''} for this generation
        </Text>
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionLabel}>Variation</Text>
      <Text style={styles.variationHint}>
        {variationEnabled
          ? 'Same product & reference every time — only style, pose, and angle vary.'
          : 'Generate more than 1 image to vary style, pose, and angle between them.'}
      </Text>
      <View style={[styles.qualityRow, !variationEnabled && styles.sectionDisabled]}>
        {PLAYGROUND_VARIATIONS.map((v) => {
          const active = variationEnabled && variation === v.id;
          return (
            <Pressable
              key={v.id}
              onPress={() => onSelectVariation(v.id)}
              disabled={!variationEnabled}
              style={[styles.qualityCard, active && styles.qualityCardActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled: !variationEnabled }}
              accessibilityLabel={`${v.label} — ${v.description}`}>
              <Text style={[styles.qualityLabel, active && styles.qualityLabelActive]}>
                {v.label}
              </Text>
              <Text style={[styles.qualityDescription, active && styles.qualityDescriptionActive]}>
                {v.description}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function FormatSwatch({
  format,
  active,
  onPress,
}: {
  format: PlaygroundFormat;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.swatchCard, active && styles.swatchActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={format.label}>
      <View
        style={[
          styles.swatch,
          {
            width: format.swatchW,
            height: format.swatchH,
            backgroundColor: active ? brand.orange : 'rgba(249,115,22,0.22)',
          },
        ]}
      />
      <Text style={[styles.swatchLabel, active && styles.swatchLabelActive]}>{format.label}</Text>
    </Pressable>
  );
}

function Row({
  icon,
  title,
  subtitle,
  trailing,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  trailing?: ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.row} accessibilityRole="button">
      <View style={styles.rowIcon}>{icon}</View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      {trailing}
    </Pressable>
  );
}

function ToggleRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  disabled,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      style={[styles.row, disabled && styles.rowDisabled]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: Boolean(disabled) }}
      accessibilityLabel={title}>
      <View style={styles.rowIcon}>{icon}</View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#E2E8F0', true: brand.orange }}
        thumbColor="#FFFFFF"
        style={styles.toggleSwitch}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    // Well above the chat list (unstyled, so effectively 0) — zIndex alone
    // is unreliable on Android without a matching elevation.
    zIndex: 100,
    elevation: 100,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
  },
  sheetWrap: {
    paddingHorizontal: 14,
  },
  sheet: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.95)',
    backgroundColor: Platform.OS === 'android' ? '#FFFFFF' : 'rgba(255,255,255,0.72)',
  },
  list: {
    paddingVertical: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  rowDisabled: {
    opacity: 0.45,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  backLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: brand.ink,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.orangeSoft,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: brand.ink,
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: brand.muted,
  },
  toggleSwitch: {
    pointerEvents: 'none',
  },
  sectionLabel: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 2,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: brand.muted,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(148,163,184,0.35)',
    marginHorizontal: 14,
  },
  formatRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  swatchCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  swatchActive: {
    borderColor: brand.orange,
    backgroundColor: 'rgba(255,237,213,0.85)',
  },
  swatch: {
    borderRadius: 6,
  },
  swatchLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: brand.muted,
  },
  swatchLabelActive: {
    color: brand.orangeDeep,
  },
  qualityRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 12,
    gap: 8,
  },
  qualityCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  qualityCardActive: {
    borderColor: brand.orange,
    backgroundColor: 'rgba(255,237,213,0.85)',
  },
  qualityLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: brand.ink,
  },
  qualityLabelActive: {
    color: brand.orangeDeep,
  },
  qualityDescription: {
    fontSize: 11,
    fontWeight: '500',
    color: brand.muted,
    textAlign: 'center',
  },
  qualityDescriptionActive: {
    color: brand.orangeDeep,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 14,
    gap: 12,
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.orangeSoft,
  },
  stepperBtnDisabled: {
    opacity: 0.4,
  },
  stepperGlyph: {
    fontSize: 18,
    fontWeight: '800',
    color: brand.orangeDeep,
    lineHeight: 20,
  },
  stepperValue: {
    minWidth: 24,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: brand.ink,
  },
  stepperHint: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: brand.muted,
    textAlign: 'right',
  },
  variationHint: {
    paddingHorizontal: 14,
    paddingTop: 2,
    fontSize: 11,
    fontWeight: '500',
    color: brand.muted,
  },
  sectionDisabled: {
    opacity: 0.4,
  },
});
