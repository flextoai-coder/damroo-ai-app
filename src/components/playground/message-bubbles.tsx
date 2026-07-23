import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { ShareIcon, SparkleIcon } from '@/components/playground/icons';
import { PulsingDots, ShimmerBlock } from '@/components/playground/shimmer';
import { brand } from '@/constants/brand';
import { formatById } from '@/constants/playground';
import type { AssistantTurn, UserTurn } from '@/stores/playground-store';

type UserBubbleProps = {
  turn: UserTurn;
};

export function UserBubble({ turn }: UserBubbleProps) {
  return (
    <View style={styles.userWrap}>
      {turn.attachments.length > 0 ? (
        <View style={styles.thumbRow}>
          {turn.attachments.map((a) => (
            <Image
              key={a.id}
              source={{ uri: a.uri }}
              style={styles.thumb}
              contentFit="cover"
            />
          ))}
        </View>
      ) : null}
      <LinearGradient
        colors={[brand.orange, brand.orangeDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.userBubble}>
        <Text style={styles.userText}>{turn.prompt}</Text>
      </LinearGradient>
    </View>
  );
}

type AssistantBubbleProps = {
  turn: AssistantTurn;
  onRegenerate: () => void;
  onSave: () => void;
};

export function AssistantBubble({ turn, onRegenerate, onSave }: AssistantBubbleProps) {
  const { width } = useWindowDimensions();
  const format = formatById(turn.aspectRatio);
  const maxW = Math.min(width * 0.72, 280);
  const imgH = maxW / format.ratio;

  return (
    <View style={styles.assistantRow}>
      <LinearGradient
        colors={[brand.orange, brand.orangeDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.avatar}>
        <SparkleIcon size={14} />
      </LinearGradient>

      <View style={styles.assistantBody}>
        {turn.status === 'loading' ? (
          <>
            <View style={styles.designingRow}>
              <Text style={styles.designing}>Designing</Text>
              <PulsingDots />
            </View>
            <ShimmerBlock style={{ width: maxW, height: imgH }} borderRadius={18} />
            <ShimmerBlock style={styles.captionBarWide} borderRadius={8} />
            <ShimmerBlock style={styles.captionBarNarrow} borderRadius={8} />
          </>
        ) : null}

        {turn.status === 'error' ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{turn.error ?? 'Something went wrong.'}</Text>
            <Pressable onPress={onRegenerate} style={styles.retryBtn}>
              <Text style={styles.retryLabel}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {turn.status === 'done' ? (
          <>
            <View style={[styles.resultFrame, { width: maxW, height: imgH }]}>
              {turn.imageUrl ? (
                <Image
                  source={{ uri: turn.imageUrl }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
              ) : (
                <LinearGradient
                  colors={['#FFEDD5', '#FDBA74', '#FB923C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <View style={styles.badge}>
                <Text style={styles.badgeText}>✦ AUTO-BRANDED</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <GlassAction label="Regenerate" onPress={onRegenerate} />
              <GlassAction label="Save" onPress={onSave} />
              <GlassAction
                icon
                onPress={() => {
                  void Share.share({
                    message: turn.imageUrl ?? 'Created with Damroo AI',
                    url: turn.imageUrl ?? undefined,
                  });
                }}
              />
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}

function GlassAction({
  label,
  icon,
  onPress,
}: {
  label?: string;
  icon?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label ?? 'Share'}>
      <BlurView intensity={36} tint="light" style={[styles.actionBtn, icon && styles.actionIcon]}>
        <View style={styles.actionInner}>
          {icon ? <ShareIcon /> : <Text style={styles.actionLabel}>{label}</Text>}
        </View>
      </BlurView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  userWrap: {
    alignSelf: 'flex-end',
    maxWidth: '82%',
    alignItems: 'flex-end',
    gap: 8,
  },
  thumbRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 6,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: brand.orangeSoft,
  },
  userBubble: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomRightRadius: 6,
  },
  userText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  assistantRow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    maxWidth: '92%',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  assistantBody: {
    gap: 10,
  },
  designingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  designing: {
    fontSize: 13,
    fontWeight: '700',
    color: brand.orangeDeep,
  },
  captionBarWide: {
    width: 160,
    height: 12,
  },
  captionBarNarrow: {
    width: 110,
    height: 12,
  },
  resultFrame: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: brand.orangeSoft,
  },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(15,23,42,0.72)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  actionIcon: {
    width: 34,
    height: 34,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  actionInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: brand.ink,
  },
  errorCard: {
    backgroundColor: 'rgba(254,226,226,0.9)',
    borderRadius: 14,
    padding: 12,
    maxWidth: 260,
    gap: 8,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
  },
  retryBtn: {
    alignSelf: 'flex-start',
  },
  retryLabel: {
    color: brand.orangeDeep,
    fontWeight: '800',
    fontSize: 13,
  },
});
