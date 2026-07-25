import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronBackIcon, ChevronDownIcon } from '@/components/playground/icons';
import { brand } from '@/constants/brand';
import { modelById } from '@/constants/playground';
import { screenTopPadding } from '@/constants/shell-layout';

type PlaygroundHeaderProps = {
  modelId: string;
  onBack: () => void;
  onNewChat: () => void;
  onSelectModel: () => void;
  /** Dims and disables the button when there's no active conversation to clear. */
  newChatDisabled?: boolean;
};

export function PlaygroundHeader({
  modelId,
  onBack,
  onNewChat,
  onSelectModel,
  newChatDisabled,
}: PlaygroundHeaderProps) {
  const insets = useSafeAreaInsets();
  const model = modelById(modelId);
  // screenTopPadding already collapses Android safe-top (opaque status bar).

  return (
    <View style={[styles.row, { paddingTop: screenTopPadding(insets.top) }]}>
      <GlassCircleButton onPress={onBack} accessibilityLabel="Go back">
        <ChevronBackIcon />
      </GlassCircleButton>

      <View style={styles.titleBlock}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Playground</Text>
          <View style={styles.liveDot} />
        </View>
        <Pressable
          onPress={onSelectModel}
          accessibilityRole="button"
          accessibilityLabel="Change model"
          hitSlop={6}
          style={styles.modelRow}>
          <Text style={styles.model} numberOfLines={1}>
            {model.name}
          </Text>
          <ChevronDownIcon size={11} color={brand.muted} />
        </Pressable>
      </View>

      <Pressable
        onPress={onNewChat}
        disabled={newChatDisabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: Boolean(newChatDisabled) }}
        accessibilityLabel="New chat"
        style={[styles.newChatHit, newChatDisabled && styles.newChatHitDisabled]}>
        <BlurView intensity={40} tint="light" style={styles.newChatPill}>
          <View style={styles.newChatInner}>
            <Text style={styles.newChatLabel}>New Chat</Text>
          </View>
        </BlurView>
      </Pressable>
    </View>
  );
}

function GlassCircleButton({
  children,
  onPress,
  disabled,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      accessibilityLabel={accessibilityLabel}
      style={[styles.circleHit, disabled && styles.circleHitDisabled]}>
      <BlurView intensity={40} tint="light" style={styles.circle}>
        <View style={styles.circleInner}>{children}</View>
      </BlurView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  circleHit: {
    width: 42,
    height: 42,
  },
  circleHitDisabled: {
    opacity: 0.4,
  },
  newChatHit: {
    height: 42,
  },
  newChatHitDisabled: {
    opacity: 0.4,
  },
  newChatPill: {
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  newChatInner: {
    height: 42,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  newChatLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: brand.ink,
  },
  circle: {
    flex: 1,
    borderRadius: 21,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  circleInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: brand.ink,
    letterSpacing: -0.3,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  modelRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  model: {
    fontSize: 12,
    fontWeight: '600',
    color: brand.muted,
    flexShrink: 1,
  },
});
