import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AttachmentZone } from '@/components/playground/attachment-zone';
import {
  ArrowUpIcon,
  ChevronDownIcon,
  CloseIcon,
  PlusAttachIcon,
  SparkleIcon,
} from '@/components/playground/icons';
import { brand } from '@/constants/brand';
import { formatById } from '@/constants/playground';
import type { ComposerAttachment } from '@/stores/chat-composer-store';
import type { ComposerPopover } from '@/components/playground/composer-popovers';

// Real blur on Android is expensive and re-renders on every keystroke here
// (the TextInput lives inside this same card) — that's what made opening
// the "+" popover feel like it hung: the JS thread was busy repainting a
// live blur behind the composer, not the popover itself. Same pattern as
// the tab bar / composer popovers: skip the blur, use an opaque fill.
const CARD_BLUR_INTENSITY = Platform.OS === 'android' ? 0 : 52;

type PlaygroundComposerProps = {
  prompt: string;
  onChangePrompt: (value: string) => void;
  /** Locked-in text from a template's guided-flow selections — read-only, can't be edited away. */
  templateLockedPrompt: string | null;
  onClearTemplateLock: () => void;
  attachments: ComposerAttachment[];
  onRemoveAttachment: (id: string) => void;
  onRetryAttachment: (attachment: ComposerAttachment) => void;
  aspectRatio: string;
  quality: '2K' | '4K';
  imageCount: number;
  popover: ComposerPopover;
  onPopoverChange: (popover: ComposerPopover) => void;
  onAddProduct: () => void;
  onAddReferenceOrTemplate: () => void;
  onLongPressReferenceAdd: () => void;
  onSelectBrandKit: () => void;
  /** Whether any brand kit toggle (logo/name/colors) is currently on. */
  brandKitActive: boolean;
  enhancing: boolean;
  onEnhance: () => void;
  sending: boolean;
  onSend: () => void;
  /** Whether the system clipboard currently holds an image. */
  clipboardHasImage: boolean;
  onLayout?: (event: LayoutChangeEvent) => void;
};

export function PlaygroundComposer({
  prompt,
  onChangePrompt,
  templateLockedPrompt,
  onClearTemplateLock,
  attachments,
  onRemoveAttachment,
  onRetryAttachment,
  aspectRatio,
  quality,
  imageCount,
  popover,
  onPopoverChange,
  onAddProduct,
  onAddReferenceOrTemplate,
  onLongPressReferenceAdd,
  onSelectBrandKit,
  brandKitActive,
  enhancing,
  onEnhance,
  sending,
  onSend,
  clipboardHasImage,
  onLayout,
}: PlaygroundComposerProps) {
  const insets = useSafeAreaInsets();
  const format = formatById(aspectRatio);
  const hasPendingUpload = attachments.some((a) => a.status === 'uploading');
  const hasLockedPrompt = Boolean(templateLockedPrompt?.trim());
  const canSend = (prompt.trim().length > 0 || hasLockedPrompt) && !sending && !hasPendingUpload;

  const productAttachments = attachments.filter((a) => a.kind === 'product');
  const referenceAttachments = attachments.filter((a) => a.kind !== 'product');

  const referenceMenuActive = popover === 'referenceMenu' || popover === 'paste';
  const brandActive = popover === 'brand';
  const formatActive = popover === 'format';
  const qualityActive = popover === 'quality';

  const plusProgress = useSharedValue(0);
  const chevronProgress = useSharedValue(0);
  const qualityChevronProgress = useSharedValue(0);

  useEffect(() => {
    plusProgress.value = withTiming(brandActive ? 1 : 0, { duration: 200 });
  }, [brandActive, plusProgress]);

  useEffect(() => {
    chevronProgress.value = withTiming(formatActive ? 1 : 0, { duration: 200 });
  }, [formatActive, chevronProgress]);

  useEffect(() => {
    qualityChevronProgress.value = withTiming(qualityActive ? 1 : 0, { duration: 200 });
  }, [qualityActive, qualityChevronProgress]);

  const plusIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${plusProgress.value * 45}deg` }],
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronProgress.value * 180}deg` }],
  }));

  const qualityChevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${qualityChevronProgress.value * 180}deg` }],
  }));

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.wrap,
        {
          paddingBottom: Math.max(insets.bottom, 6),
        },
      ]}>
      <BlurView intensity={CARD_BLUR_INTENSITY} tint="light" style={styles.card}>
        <View style={styles.zonesRow}>
          <AttachmentZone
            label="PRODUCT"
            attachments={productAttachments}
            onAdd={onAddProduct}
            addAccessibilityLabel="Add product image"
            onRemove={onRemoveAttachment}
            onRetry={onRetryAttachment}
          />
          <AttachmentZone
            label="REFERENCE"
            attachments={referenceAttachments}
            onAdd={onAddReferenceOrTemplate}
            onLongPressAdd={clipboardHasImage ? onLongPressReferenceAdd : undefined}
            addAccessibilityLabel="Add reference image or template"
            addActive={referenceMenuActive}
            onRemove={onRemoveAttachment}
            onRetry={onRetryAttachment}
          />
        </View>

        {hasLockedPrompt ? (
          <View style={styles.lockedChip}>
            <Text style={styles.lockedChipLabel}>FROM TEMPLATE</Text>
            <Text style={styles.lockedChipText} numberOfLines={3}>
              {templateLockedPrompt}
            </Text>
            <Pressable
              onPress={onClearTemplateLock}
              hitSlop={8}
              style={styles.lockedChipClose}
              accessibilityLabel="Remove template selections">
              <CloseIcon size={11} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : null}

        <TextInput
          value={prompt}
          onChangeText={onChangePrompt}
          placeholder={
            hasLockedPrompt ? 'Add more details (optional)…' : 'Describe the design you want…'
          }
          placeholderTextColor={brand.mutedSoft}
          multiline
          style={styles.input}
          editable={!sending}
        />

        <View style={styles.controls}>
          <Pressable
            onPress={onSelectBrandKit}
            style={[styles.iconBtn, brandActive && styles.iconBtnActive]}
            accessibilityLabel="Brand Kit">
            <Animated.View style={plusIconStyle}>
              <PlusAttachIcon />
            </Animated.View>
            {brandKitActive ? <View style={styles.brandDot} /> : null}
          </Pressable>

          <Pressable
            onPress={() => onPopoverChange(popover === 'format' ? null : 'format')}
            style={[styles.pill, formatActive && styles.pillActive]}
            accessibilityLabel="Format">
            <View
              style={[
                styles.formatSwatch,
                {
                  width: Math.max(10, format.swatchW * 0.45),
                  height: Math.max(10, format.swatchH * 0.45),
                },
              ]}
            />
            <Text style={styles.pillText}>{format.label}</Text>
            <Animated.View style={chevronStyle}>
              <ChevronDownIcon size={11} color={brand.muted} />
            </Animated.View>
          </Pressable>

          <Pressable
            onPress={() => onPopoverChange(popover === 'quality' ? null : 'quality')}
            style={[styles.pill, qualityActive && styles.pillActive]}
            accessibilityLabel="Quality and image count">
            <Text style={styles.pillText}>
              {quality} · {imageCount}
            </Text>
            <Animated.View style={qualityChevronStyle}>
              <ChevronDownIcon size={11} color={brand.muted} />
            </Animated.View>
          </Pressable>

          <Pressable
            onPress={onEnhance}
            disabled={enhancing || prompt.trim().length === 0}
            style={[styles.enhanceBtn, (enhancing || !prompt.trim()) && styles.enhanceDisabled]}
            accessibilityLabel="Enhance prompt">
            {enhancing ? (
              <ActivityIndicator size="small" color={brand.orangeDeep} />
            ) : (
              <SparkleIcon size={14} color={brand.orangeDeep} />
            )}
          </Pressable>

          <View style={styles.spacer} />

          <Pressable
            onPress={onSend}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel="Send"
            style={styles.sendHit}>
            {canSend ? (
              <LinearGradient
                colors={[brand.orange, brand.orangeDeep]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendBtn}>
                <ArrowUpIcon />
              </LinearGradient>
            ) : (
              <View style={[styles.sendBtn, styles.sendDisabled]}>
                <ArrowUpIcon color="#FFFFFF" />
              </View>
            )}
          </Pressable>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 12,
  },
  card: {
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.95)',
    backgroundColor: Platform.OS === 'android' ? '#FFFFFF' : 'rgba(255,255,255,0.72)',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
  },
  zonesRow: {
    flexDirection: 'row',
    gap: 14,
  },
  lockedChip: {
    marginBottom: 8,
    padding: 10,
    paddingRight: 30,
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: brand.orangeSoft,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.35)',
  },
  lockedChipLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: brand.orangeDeep,
    marginBottom: 3,
  },
  lockedChipText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '500',
    color: brand.ink,
  },
  lockedChipClose: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.55)',
  },
  input: {
    minHeight: 40,
    maxHeight: 120,
    fontSize: 15,
    fontWeight: '500',
    color: brand.ink,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  controls: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  iconBtnActive: {
    backgroundColor: brand.orangeSoft,
  },
  brandDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: brand.orange,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.75)',
    maxWidth: 128,
  },
  pillActive: {
    backgroundColor: brand.orangeSoft,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: brand.ink,
    flexShrink: 1,
  },
  formatSwatch: {
    borderRadius: 3,
    backgroundColor: brand.orange,
  },
  enhanceBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.orangeSoft,
  },
  enhanceDisabled: {
    opacity: 0.45,
  },
  spacer: {
    flex: 1,
  },
  sendHit: {
    width: 40,
    height: 40,
  },
  sendBtn: {
    flex: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    backgroundColor: '#CBD5E1',
  },
});
