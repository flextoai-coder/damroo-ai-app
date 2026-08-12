import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CheckIcon } from '@/components/onboarding/icons';
import { brand } from '@/constants/brand';
import { resizedImageUrl } from '@/lib/image-transform';
import type { TemplateStepOption } from '@/types/template-remix';

/** Generous upper bound — cards are always 2-up, so no single one is ever wider than this. */
const THUMB_SIZE = 220;

type TemplateStepOptionCardProps = {
  option: TemplateStepOption;
  selected: boolean;
  onPress: () => void;
  /** Fixed pixel width — the grid always shows exactly 2 cards per row, regardless of option count. */
  width: number;
};

export function TemplateStepOptionCard({
  option,
  selected,
  onPress,
  width,
}: TemplateStepOptionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={option.label}
      style={[styles.card, { width }, selected && styles.cardSelected]}>
      {selected ? (
        <View style={styles.checkBadge}>
          <CheckIcon size={11} color="#FFFFFF" />
        </View>
      ) : null}

      <View style={styles.thumbWrap}>
        {option.thumbnailUrl ? (
          <Image
            source={{ uri: resizedImageUrl(option.thumbnailUrl, { width: THUMB_SIZE, height: THUMB_SIZE }) }}
            style={styles.thumb}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]} />
        )}
      </View>

      <Text style={styles.label} numberOfLines={1}>
        {option.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    padding: 8,
    paddingBottom: 10,
  },
  cardSelected: {
    borderColor: brand.orange,
    backgroundColor: 'rgba(255, 237, 213, 0.55)',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: brand.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    backgroundColor: brand.orangeSoft,
  },
  label: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: brand.ink,
    textAlign: 'center',
  },
});
