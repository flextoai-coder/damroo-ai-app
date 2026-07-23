import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { brand } from '@/constants/brand';
import type { Generation } from '@/services/generations';
import { primaryAssetUrl } from '@/services/generations';

type GenerationsGridProps = {
  generations: Generation[];
  onPressGeneration: (id: string) => void;
  onCreate: () => void;
};

/** 2-column Pinterest-style grid of the user’s completed generations. */
export function GenerationsGrid({
  generations,
  onPressGeneration,
  onCreate,
}: GenerationsGridProps) {
  const { width } = useWindowDimensions();
  const gap = 12;
  const side = 22;
  const colWidth = (width - side * 2 - gap) / 2;

  if (generations.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No generations yet</Text>
        <Text style={styles.emptyBody}>
          Your studio feed will fill here as you create. Start with a new design.
        </Text>
        <Pressable onPress={onCreate} style={styles.emptyCta} accessibilityRole="button">
          <Text style={styles.emptyCtaLabel}>Create your first →</Text>
        </Pressable>
      </View>
    );
  }

  const left: Generation[] = [];
  const right: Generation[] = [];
  generations.forEach((g, i) => {
    (i % 2 === 0 ? left : right).push(g);
  });

  return (
    <View style={styles.row}>
      <View style={[styles.col, { width: colWidth, gap }]}>
        {left.map((g, i) => (
          <GridTile
            key={g.id}
            generation={g}
            height={i % 2 === 0 ? 210 : 168}
            onPress={() => onPressGeneration(g.id)}
          />
        ))}
      </View>
      <View style={[styles.col, { width: colWidth, gap }]}>
        {right.map((g, i) => (
          <GridTile
            key={g.id}
            generation={g}
            height={i % 2 === 0 ? 168 : 210}
            onPress={() => onPressGeneration(g.id)}
          />
        ))}
      </View>
    </View>
  );
}

function GridTile({
  generation,
  height,
  onPress,
}: {
  generation: Generation;
  height: number;
  onPress: () => void;
}) {
  const url = primaryAssetUrl(generation);
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tile, { height }]}
      accessibilityRole="button"
      accessibilityLabel={generation.prompt}>
      {url ? (
        <Image source={{ uri: url }} style={styles.image} contentFit="cover" />
      ) : (
        <LinearGradient
          colors={[brand.creamDeep, brand.orangeSoft]}
          style={styles.image}
        />
      )}
      <LinearGradient
        colors={['rgba(15,23,42,0)', 'rgba(15,23,42,0.55)']}
        style={styles.captionFade}>
        <Text style={styles.caption} numberOfLines={2}>
          {generation.prompt}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 22,
  },
  col: {},
  tile: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: brand.creamDeep,
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  captionFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 10,
    paddingTop: 28,
    paddingBottom: 10,
  },
  caption: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  empty: {
    marginHorizontal: 22,
    padding: 22,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'flex-start',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: brand.ink,
  },
  emptyBody: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: brand.muted,
  },
  emptyCta: {
    marginTop: 14,
    backgroundColor: brand.orange,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  emptyCtaLabel: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
