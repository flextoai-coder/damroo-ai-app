import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SparkleIcon } from '@/components/playground/icons';
import { brand } from '@/constants/brand';
import { SUGGESTION_CHIPS } from '@/constants/playground';

type EmptyStateProps = {
  onPickSuggestion: (text: string) => void;
};

export function PlaygroundEmptyState({ onPickSuggestion }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[brand.orange, brand.orangeDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.icon}>
        <SparkleIcon size={28} color="#FFFFFF" />
      </LinearGradient>
      <Text style={styles.headline}>What shall we design?</Text>
      <Text style={styles.body}>Describe a poster, story, or offer — Damroo will craft it.</Text>
      <View style={styles.chips}>
        {SUGGESTION_CHIPS.map((chip) => (
          <Pressable
            key={chip}
            onPress={() => onPickSuggestion(chip)}
            accessibilityRole="button"
            accessibilityLabel={chip}
            style={styles.chipHit}>
            <BlurView intensity={36} tint="light" style={styles.chip}>
              <Text style={styles.chipLabel}>{chip}</Text>
            </BlurView>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  headline: {
    fontSize: 24,
    fontWeight: '800',
    color: brand.ink,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  body: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: brand.muted,
    textAlign: 'center',
    maxWidth: 280,
  },
  chips: {
    marginTop: 22,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  chipHit: {
    maxWidth: '100%',
  },
  chip: {
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: brand.ink,
  },
});
