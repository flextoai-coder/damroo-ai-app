import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { forwardRef, type ReactElement } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { brand } from '@/constants/brand';
import { formatById } from '@/constants/playground';
import { resizedImageUrl } from '@/lib/image-transform';
import type { Generation } from '@/services/generations';
import { primaryAssetUrl } from '@/services/generations';
import { SkeletonMasonryGrid } from '@/components/ui/skeleton';

const GAP = 12;
const SIDE = 22;
const MIN_TILE_HEIGHT = 110;
const MAX_TILE_HEIGHT = 320;

/**
 * The FlashList's own `contentContainerStyle` horizontal padding (below) — it
 * wraps the grid tiles *and* `ListHeaderComponent` alike, since FlashList
 * applies one shared container to the whole list. Grid tiles want this (each
 * tile also carries `margin: GAP / 2`, netting the intended `SIDE` inset),
 * but the header carries its own independent `SIDE` padding per section
 * already — callers must cancel this out on their header's outer wrapper
 * (`marginHorizontal: -GRID_CONTAINER_INSET`) or it stacks to `SIDE * 2 - GAP / 2`.
 */
export const GRID_CONTAINER_INSET = SIDE - GAP / 2;

/** Tile height that reproduces the generation's actual aspect ratio at the given column width. */
function tileHeight(generation: Generation, width: number): number {
  const ratio = formatById(generation.aspect_ratio).ratio;
  return Math.min(MAX_TILE_HEIGHT, Math.max(MIN_TILE_HEIGHT, width / ratio));
}

type GenerationsGridProps = {
  generations: Generation[];
  onPressGeneration: (id: string) => void;
  onCreate: () => void;
  /** Rendered above the grid — carries the rest of the Home screen so the whole page is one virtualized list. */
  ListHeaderComponent?: ReactElement | null;
  /** First page still in flight — shows the shimmer skeleton instead of the empty state. */
  loading?: boolean;
  /** Tapped from the "Load more" button — deliberately not auto-triggered by scroll, so the feed doesn't keep fetching/rendering more tiles as the user scrolls. */
  onLoadMore?: () => void;
  /** Whether another page exists — shows the "Load more" button when true. */
  hasMore?: boolean;
  loadingMore?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollEventThrottle?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

/**
 * 2-column Pinterest-style, infinitely-scrollable feed of the user's completed
 * generations. Renders as a single FlashList (masonry mode) so the whole Home
 * page — header sections included — stays virtualized instead of nesting a
 * list inside a ScrollView.
 */
export const GenerationsGrid = forwardRef<FlashListRef<Generation>, GenerationsGridProps>(
  function GenerationsGrid(
    {
      generations,
      onPressGeneration,
      onCreate,
      ListHeaderComponent,
      loading,
      onLoadMore,
      hasMore,
      loadingMore,
      refreshing,
      onRefresh,
      onScroll,
      scrollEventThrottle,
      contentContainerStyle,
    },
    ref,
  ) {
    const { width } = useWindowDimensions();
    const colWidth = (width - SIDE * 2 - GAP) / 2;

    return (
      <FlashList
        ref={ref}
        data={generations}
        keyExtractor={(g) => g.id}
        masonry
        numColumns={2}
        optimizeItemArrangement
        contentContainerStyle={[{ paddingHorizontal: SIDE - GAP / 2 }, contentContainerStyle]}
        ListHeaderComponent={ListHeaderComponent}
        renderItem={({ item }) => (
          <GridTile
            generation={item}
            width={colWidth}
            height={tileHeight(item, colWidth)}
            onPress={() => onPressGeneration(item.id)}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <SkeletonMasonryGrid screenWidth={width} />
          ) : (
            <EmptyState onCreate={onCreate} />
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={styles.footer} color={brand.orange} />
          ) : hasMore ? (
            <Pressable
              onPress={onLoadMore}
              style={styles.loadMoreBtn}
              accessibilityRole="button"
              accessibilityLabel="Load more generations">
              <Text style={styles.loadMoreLabel}>Load more</Text>
            </Pressable>
          ) : null
        }
        refreshing={refreshing}
        onRefresh={onRefresh}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        showsVerticalScrollIndicator={false}
      />
    );
  },
);

function EmptyState({ onCreate }: { onCreate: () => void }) {
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

function GridTile({
  generation,
  width,
  height,
  onPress,
}: {
  generation: Generation;
  width: number;
  height: number;
  onPress: () => void;
}) {
  const url = primaryAssetUrl(generation);
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tile, { width, height, margin: GAP / 2 }]}
      accessibilityRole="button"
      accessibilityLabel={generation.prompt}>
      {url ? (
        <Image
          source={{ uri: resizedImageUrl(url, { width, height }) }}
          style={styles.image}
          contentFit="cover"
        />
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
  footer: {
    marginVertical: 16,
  },
  loadMoreBtn: {
    alignSelf: 'center',
    marginVertical: 16,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.35)',
  },
  loadMoreLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: brand.orangeDeep,
  },
  empty: {
    marginHorizontal: 22,
    marginTop: 4,
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
