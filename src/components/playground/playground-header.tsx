import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronBackIcon, NewChatIcon } from '@/components/playground/icons';
import { brand } from '@/constants/brand';
import { modelById } from '@/constants/playground';
import { screenTopPadding } from '@/constants/shell-layout';

type PlaygroundHeaderProps = {
  modelId: string;
  onBack: () => void;
  onNewChat: () => void;
};

export function PlaygroundHeader({ modelId, onBack, onNewChat }: PlaygroundHeaderProps) {
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
        <Text style={styles.model} numberOfLines={1}>
          {model.name}
        </Text>
      </View>

      <GlassCircleButton onPress={onNewChat} accessibilityLabel="New chat">
        <NewChatIcon />
      </GlassCircleButton>
    </View>
  );
}

function GlassCircleButton({
  children,
  onPress,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={styles.circleHit}>
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
  model: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: brand.muted,
  },
});
