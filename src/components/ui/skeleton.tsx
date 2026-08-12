import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ShimmerBlock } from '@/components/ui/shimmer';

const SIDE = 22;
const GAP = 14;

/** A single shimmering placeholder box — the base building block for every skeleton below. */
export function SkeletonBox({
  width,
  height,
  borderRadius = 12,
  style,
}: {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <ShimmerBlock style={[{ width, height }, style]} borderRadius={borderRadius} />
  );
}

/** A shimmering text-line placeholder. */
export function SkeletonLine({
  width,
  height = 12,
  style,
}: {
  width: number | `${number}%`;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return <SkeletonBox width={width} height={height} borderRadius={height / 2} style={style} />;
}

/** Horizontal rail of card-shaped placeholders — matches GenerationCard / PosterCard (rail variant). */
export function SkeletonRail({
  itemWidth = 124,
  itemHeight = 158,
  count = 4,
}: {
  itemWidth?: number;
  itemHeight?: number;
  count?: number;
}) {
  return (
    <View style={styles.railRow}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ width: itemWidth, gap: 8 }}>
          <SkeletonBox width={itemWidth} height={itemHeight} borderRadius={12} />
          <SkeletonLine width={Math.round(itemWidth * 0.8)} height={11} />
          <SkeletonLine width={Math.round(itemWidth * 0.5)} height={10} />
        </View>
      ))}
    </View>
  );
}

/** 2-column grid of card-shaped placeholders — matches PosterCard (grid variant) / square tiles. */
export function SkeletonGrid({
  columns = 2,
  itemHeight = 196,
  count = 6,
  showLabel = true,
  screenWidth,
}: {
  columns?: number;
  itemHeight?: number;
  count?: number;
  showLabel?: boolean;
  screenWidth: number;
}) {
  const itemWidth = (screenWidth - SIDE * 2 - GAP * (columns - 1)) / columns;
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ width: itemWidth, gap: 8 }}>
          <SkeletonBox width={itemWidth} height={itemHeight} borderRadius={18} />
          {showLabel ? <SkeletonLine width={Math.round(itemWidth * 0.85)} height={12} /> : null}
        </View>
      ))}
    </View>
  );
}

const MASONRY_HEIGHTS = [180, 230, 150, 210, 190, 240];

/** 2-column Pinterest-style placeholder — matches GenerationsGrid's masonry layout. */
export function SkeletonMasonryGrid({
  screenWidth,
  count = 6,
}: {
  screenWidth: number;
  count?: number;
}) {
  const colWidth = (screenWidth - SIDE * 2 - 12) / 2;
  const left: number[] = [];
  const right: number[] = [];
  for (let i = 0; i < count; i++) {
    (i % 2 === 0 ? left : right).push(MASONRY_HEIGHTS[i % MASONRY_HEIGHTS.length]);
  }

  return (
    <View style={styles.masonryRow}>
      <View style={styles.masonryCol}>
        {left.map((h, i) => (
          <SkeletonBox key={i} width={colWidth} height={h} borderRadius={18} />
        ))}
      </View>
      <View style={styles.masonryCol}>
        {right.map((h, i) => (
          <SkeletonBox key={i} width={colWidth} height={h} borderRadius={18} />
        ))}
      </View>
    </View>
  );
}

/** Full generation-detail placeholder — image frame, prompt lines, action row, remix form. */
export function GenerationDetailSkeleton() {
  return (
    <View style={styles.detail}>
      <SkeletonBox width="100%" height={340} borderRadius={20} />
      <SkeletonLine width={90} height={13} style={styles.detailSectionGap} />
      <View style={{ gap: 8, marginTop: 8 }}>
        <SkeletonLine width="100%" height={14} />
        <SkeletonLine width="70%" height={14} />
      </View>
      <View style={styles.detailActions}>
        <SkeletonBox width="100%" height={48} borderRadius={999} />
        <View style={styles.detailIconRow}>
          <SkeletonBox width="100%" height={48} borderRadius={999} style={{ flex: 1 }} />
          <SkeletonBox width="100%" height={48} borderRadius={999} style={{ flex: 1 }} />
        </View>
      </View>
      <SkeletonLine width={140} height={13} style={styles.detailSectionGap} />
      <SkeletonBox width="100%" height={90} borderRadius={16} style={{ marginTop: 10 }} />
      <SkeletonBox width="100%" height={54} borderRadius={999} style={{ marginTop: 12 }} />
    </View>
  );
}

/** Brand Kit form placeholder — preview card, color swatches, logo box, field blocks. */
export function BrandKitSkeleton() {
  return (
    <View style={styles.brandKit}>
      <View style={styles.brandKitPreview}>
        <SkeletonLine width={70} height={13} />
        <View style={styles.brandKitSwatchRow}>
          <SkeletonBox width={44} height={44} borderRadius={12} />
          <SkeletonBox width={44} height={44} borderRadius={12} />
          <SkeletonBox width={44} height={44} borderRadius={12} />
        </View>
        <SkeletonLine width="60%" height={12} />
      </View>

      <SkeletonLine width={60} height={13} style={styles.brandKitSectionGap} />
      <View style={{ gap: 10, marginTop: 10 }}>
        <SkeletonBox width="100%" height={52} borderRadius={16} />
        <SkeletonBox width="100%" height={52} borderRadius={16} />
        <SkeletonBox width="100%" height={52} borderRadius={16} />
      </View>

      <SkeletonLine width={44} height={13} style={styles.brandKitSectionGap} />
      <View style={styles.brandKitLogoRow}>
        <SkeletonBox width={72} height={72} borderRadius={16} />
        <SkeletonBox width={130} height={44} borderRadius={999} />
      </View>

      <SkeletonLine width={90} height={13} style={styles.brandKitSectionGap} />
      <SkeletonBox width="100%" height={52} borderRadius={16} style={{ marginTop: 10 }} />

      <SkeletonLine width={110} height={13} style={styles.brandKitSectionGap} />
      <SkeletonBox width="100%" height={52} borderRadius={16} style={{ marginTop: 10 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  railRow: {
    flexDirection: 'row',
    gap: GAP,
    paddingHorizontal: SIDE,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SIDE,
    gap: GAP,
  },
  masonryRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: SIDE,
  },
  masonryCol: {
    gap: 12,
  },
  detail: {
    paddingHorizontal: SIDE,
  },
  detailSectionGap: {
    marginTop: 22,
  },
  detailActions: {
    marginTop: 24,
    gap: 10,
  },
  detailIconRow: {
    flexDirection: 'row',
    gap: 10,
  },
  brandKit: {
    marginTop: 14,
  },
  brandKitPreview: {
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.5)',
    padding: 16,
    gap: 12,
  },
  brandKitSwatchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  brandKitSectionGap: {
    marginTop: 22,
  },
  brandKitLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 10,
  },
});
