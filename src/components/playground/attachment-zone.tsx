import { Image } from 'expo-image';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { PlusAttachIcon } from '@/components/playground/icons';
import { brand } from '@/constants/brand';
import { resizedImageUrl } from '@/lib/image-transform';
import type { ComposerAttachment } from '@/stores/chat-composer-store';

const TILE_SIZE = 52;
const THUMB_SIZE = { width: TILE_SIZE, height: TILE_SIZE };
/** Extra room around the tile for the fanned-out back layers to peek into. */
const STACK_PAD = 11;

type AttachmentZoneProps = {
  label: string;
  attachments: ComposerAttachment[];
  onAdd: () => void;
  onLongPressAdd?: () => void;
  addAccessibilityLabel: string;
  addActive?: boolean;
  onRemove: (id: string) => void;
  onRetry: (attachment: ComposerAttachment) => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * One labeled attachment zone (Product, or Reference & Templates) — a single
 * tile that doubles as both the preview and the "add more" affordance.
 * Two or more attachments fan out as a photo stack (peeking layers behind
 * the top image) so it reads at a glance as "more than one" without needing
 * per-chip UI. Tapping it opens the picker sheet, which is where attachments
 * actually get added or removed — an in-flight upload error surfaces as a
 * Retry/Remove prompt on tap instead of an inline badge.
 */
export function AttachmentZone({
  label,
  attachments,
  onAdd,
  onLongPressAdd,
  addAccessibilityLabel,
  addActive,
  onRemove,
  onRetry,
  style,
}: AttachmentZoneProps) {
  const first = attachments[0];
  const isUploading = attachments.some((a) => a.status === 'uploading');
  const erroredItem = attachments.find((a) => a.status === 'error');
  const extraCount = attachments.length - 1;
  // Up to 2 peeking layers behind the top image — enough to read as "a stack"
  // without needing a distinct thumbnail for every single attachment.
  const stackDepth = Math.min(extraCount, 2);
  const midLayer = stackDepth >= 1 ? (attachments[1] ?? first) : null;
  const backLayer = stackDepth >= 2 ? (attachments[2] ?? first) : null;

  const onPress = () => {
    if (erroredItem) {
      Alert.alert('Upload failed', undefined, [
        { text: 'Remove', style: 'destructive', onPress: () => onRemove(erroredItem.id) },
        { text: 'Retry', onPress: () => onRetry(erroredItem) },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    onAdd();
  };

  return (
    <View style={[styles.zone, style]}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPressAdd}
        style={styles.stackWrap}
        accessibilityRole="button"
        accessibilityLabel={
          attachments.length > 0
            ? `${addAccessibilityLabel} — ${attachments.length} attached`
            : addAccessibilityLabel
        }>
        {backLayer ? (
          <Image
            source={{ uri: resizedImageUrl(backLayer.uri, THUMB_SIZE) }}
            style={[styles.layer, styles.layerBack]}
            contentFit="cover"
          />
        ) : null}
        {midLayer ? (
          <Image
            source={{ uri: resizedImageUrl(midLayer.uri, THUMB_SIZE) }}
            style={[styles.layer, styles.layerMid]}
            contentFit="cover"
          />
        ) : null}

        <View
          style={[styles.tile, !first && styles.tileEmpty, !first && addActive && styles.tileEmptyActive]}>
          {first ? (
            <>
              <Image
                source={{ uri: resizedImageUrl(first.uri, THUMB_SIZE) }}
                style={styles.thumb}
                contentFit="cover"
              />
              {isUploading ? (
                <View style={styles.thumbOverlay}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              ) : null}
              {erroredItem ? (
                <View style={[styles.thumbOverlay, styles.thumbErrorOverlay]}>
                  <Text style={styles.errorMark}>!</Text>
                </View>
              ) : null}
              {extraCount > 0 ? (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>+{extraCount}</Text>
                </View>
              ) : null}
              <View style={styles.plusBadge}>
                <PlusAttachIcon size={10} color="#FFFFFF" />
              </View>
            </>
          ) : (
            <PlusAttachIcon color={brand.orangeDeep} />
          )}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  zone: {
    marginBottom: 10,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: brand.muted,
    marginBottom: 6,
    marginLeft: 2,
  },
  stackWrap: {
    width: TILE_SIZE + STACK_PAD * 2,
    height: TILE_SIZE + STACK_PAD * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layer: {
    position: 'absolute',
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 18,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  layerBack: {
    opacity: 0.75,
    transform: [{ translateX: -9 }, { translateY: 9 }, { rotate: '-14deg' }],
  },
  layerMid: {
    opacity: 0.92,
    transform: [{ translateX: -5.5 }, { translateY: 5.5 }, { rotate: '-8deg' }],
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 18,
    borderCurve: 'continuous',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.orangeSoft,
  },
  tileEmpty: {
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(249, 115, 22, 0.45)',
  },
  tileEmptyActive: {
    backgroundColor: brand.orangeSoft,
    borderColor: brand.orange,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  thumbErrorOverlay: {
    backgroundColor: 'rgba(220,38,38,0.6)',
  },
  errorMark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  countBadge: {
    position: 'absolute',
    bottom: 3,
    left: 3,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.75)',
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  plusBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.orange,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
