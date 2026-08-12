import { Image } from 'expo-image';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { SkeletonBox } from '@/components/ui/skeleton';
import { brand } from '@/constants/brand';
import { useHomeBanners } from '@/hooks/use-home-data';
import { resizedImageUrl } from '@/lib/image-transform';

const SIDE = 22;
/** Wide "hero" aspect suited to horizontal marketing images. */
const ASPECT_RATIO = 16 / 8;

/**
 * Paginated hero carousel — one banner fills the screen per page. Purely
 * bucket-driven (see `fetchBanners`): renders nothing while the bucket is
 * empty, no placeholder/empty-state needed since this is a bonus visual, not
 * core content.
 */
export function HeroBannerCarousel() {
  const { width } = useWindowDimensions();
  const bannersQuery = useHomeBanners();
  const [activeIndex, setActiveIndex] = useState(0);

  const itemWidth = width - SIDE * 2;
  const itemHeight = Math.round(itemWidth / ASPECT_RATIO);

  if (bannersQuery.isLoading) {
    return (
      <View style={[styles.wrap, { paddingHorizontal: SIDE }]}>
        <SkeletonBox width={itemWidth} height={itemHeight} borderRadius={20} />
      </View>
    );
  }

  const banners = bannersQuery.data ?? [];
  if (banners.length === 0) return null;

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(Math.max(0, Math.min(banners.length - 1, index)));
  };

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}>
        {banners.map((banner) => (
          <View key={banner.id} style={[styles.page, { width }]}>
            <Image
              source={{ uri: resizedImageUrl(banner.url, { width: itemWidth, height: itemHeight }) }}
              style={[styles.image, { width: itemWidth, height: itemHeight }]}
              contentFit="cover"
              transition={200}
            />
          </View>
        ))}
      </ScrollView>

      {banners.length > 1 ? (
        <View style={styles.dots}>
          {banners.map((banner, index) => (
            <View
              key={banner.id}
              style={[styles.dot, index === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 22,
  },
  page: {
    paddingHorizontal: SIDE,
  },
  image: {
    borderRadius: 20,
    backgroundColor: brand.creamDeep,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(148,163,184,0.45)',
  },
  dotActive: {
    width: 18,
    backgroundColor: brand.orange,
  },
});
