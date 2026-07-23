import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { brand } from '@/constants/brand';
import { formatRelativeTime } from '@/lib/relative-time';

type GenerationCardProps = {
  title: string;
  createdAt?: string;
  imageUrl?: string | null;
  placeholder?: boolean;
  onPress: () => void;
};

export function GenerationCard({
  title,
  createdAt,
  imageUrl,
  placeholder = false,
  onPress,
}: GenerationCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={styles.card}>
      <BlurView intensity={28} tint="light" style={styles.blur}>
        <View style={styles.inner}>
          <View style={styles.imageWrap}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
            ) : (
              <LinearGradient
                colors={[brand.orangeSoft, brand.creamDeep]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.placeholder}>
                <View style={styles.stripe} />
                {placeholder ? <Text style={styles.placeholderLabel}>Preview</Text> : null}
              </LinearGradient>
            )}
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.meta}>
            {createdAt ? formatRelativeTime(createdAt) : 'Ready to create'}
          </Text>
        </View>
      </BlurView>
    </Pressable>
  );
}

export function NewDesignTile({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="New design"
      style={styles.newTile}>
      <LinearGradient
        colors={[brand.orange, brand.orangeDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.plusChip}>
        <Text style={styles.plus}>+</Text>
      </LinearGradient>
      <Text style={styles.newLabel}>New design</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 124,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  blur: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  inner: {
    backgroundColor: 'rgba(255,255,255,0.62)',
    padding: 8,
    paddingBottom: 10,
  },
  imageWrap: {
    width: '100%',
    height: 158,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stripe: {
    ...StyleSheet.absoluteFill,
    opacity: 0.25,
    backgroundColor: 'transparent',
    borderTopWidth: 40,
    borderTopColor: 'rgba(255,255,255,0.35)',
    transform: [{ rotate: '-18deg' }, { scale: 1.4 }],
  },
  placeholderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: brand.orangeDeep,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: brand.ink,
  },
  meta: {
    marginTop: 2,
    fontSize: 11,
    color: brand.muted,
  },
  newTile: {
    width: 124,
    height: 200,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(249, 115, 22, 0.45)',
    backgroundColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  plusChip: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '500',
    marginTop: -2,
  },
  newLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: brand.orangeDeep,
  },
});
