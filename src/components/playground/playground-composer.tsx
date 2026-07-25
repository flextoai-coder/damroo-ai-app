import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ArrowUpIcon,
  CloseIcon,
  PlusAttachIcon,
  SparkleIcon,
} from '@/components/playground/icons';
import { brand } from '@/constants/brand';
import { formatById } from '@/constants/playground';
import type { ComposerAttachment } from '@/stores/chat-composer-store';
import type { ComposerPopover } from '@/components/playground/composer-popovers';

type PlaygroundComposerProps = {
  prompt: string;
  onChangePrompt: (value: string) => void;
  attachments: ComposerAttachment[];
  onRemoveAttachment: (id: string) => void;
  onRetryAttachment: (attachment: ComposerAttachment) => void;
  aspectRatio: string;
  popover: ComposerPopover;
  onPopoverChange: (popover: ComposerPopover) => void;
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
  attachments,
  onRemoveAttachment,
  onRetryAttachment,
  aspectRatio,
  popover,
  onPopoverChange,
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
  const canSend = prompt.trim().length > 0 && !sending && !hasPendingUpload;

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.wrap,
        {
          paddingBottom:
            Platform.OS === 'android' ? 8 : Math.max(insets.bottom, 6),
        },
      ]}>
      <BlurView intensity={52} tint="light" style={styles.card}>
        {attachments.length > 0 ? (
          <View style={styles.attachRow}>
            {attachments.map((item) => {
              const isUploading = item.status === 'uploading';
              const isError = item.status === 'error';
              return (
                <Pressable
                  key={item.id}
                  onPress={isError ? () => onRetryAttachment(item) : undefined}
                  disabled={!isError}
                  style={[styles.attachChip, isError && styles.attachChipError]}>
                  <View style={styles.attachThumbWrap}>
                    <Image
                      source={{ uri: item.uri }}
                      style={styles.attachThumb}
                      contentFit="cover"
                    />
                    {isUploading ? (
                      <View style={styles.attachThumbOverlay}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      </View>
                    ) : null}
                    {isError ? (
                      <View style={[styles.attachThumbOverlay, styles.attachThumbErrorOverlay]}>
                        <Text style={styles.attachErrorMark}>!</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.attachCopy}>
                    <Text style={styles.attachKind}>
                      {item.kind === 'template' ? 'TEMPLATE' : 'REFERENCE'}
                    </Text>
                    <Text style={styles.attachTitle} numberOfLines={1}>
                      {isUploading
                        ? 'Uploading…'
                        : isError
                          ? 'Upload failed — tap to retry'
                          : item.title}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => onRemoveAttachment(item.id)}
                    hitSlop={8}
                    accessibilityLabel="Remove attachment">
                    <CloseIcon />
                  </Pressable>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <TextInput
          value={prompt}
          onChangeText={onChangePrompt}
          placeholder="Describe the design you want…"
          placeholderTextColor={brand.mutedSoft}
          multiline
          style={styles.input}
          editable={!sending}
        />

        <View style={styles.controls}>
          <Pressable
            onPress={() => onPopoverChange(popover === 'attach' ? null : 'attach')}
            onLongPress={() => {
              if (clipboardHasImage) onPopoverChange('paste');
            }}
            style={styles.iconBtn}
            accessibilityLabel="Attach"
            accessibilityHint={
              clipboardHasImage ? 'Long press to paste a copied image' : undefined
            }>
            <PlusAttachIcon />
          </Pressable>

          <Pressable
            onPress={() => onPopoverChange(popover === 'format' ? null : 'format')}
            style={styles.pill}
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
    backgroundColor: 'rgba(255,255,255,0.72)',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
  },
  attachRow: {
    gap: 8,
    marginBottom: 10,
  },
  attachChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: brand.border,
  },
  attachChipError: {
    borderColor: 'rgba(220,38,38,0.5)',
    backgroundColor: 'rgba(254,226,226,0.7)',
  },
  attachThumbWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    overflow: 'hidden',
  },
  attachThumb: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: brand.orangeSoft,
  },
  attachThumbOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  attachThumbErrorOverlay: {
    backgroundColor: 'rgba(220,38,38,0.55)',
  },
  attachErrorMark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  attachCopy: {
    flex: 1,
    minWidth: 0,
  },
  attachKind: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: brand.orangeDeep,
  },
  attachTitle: {
    marginTop: 1,
    fontSize: 13,
    fontWeight: '600',
    color: brand.ink,
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
