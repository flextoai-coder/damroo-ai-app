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
import { resizedImageUrl } from '@/lib/image-transform';
import type { Banner } from '@/services/banners';

const SIDE = 22;
/** Wide "hero" aspect suited to horizontal marketing images. */
const ASPECT_RATIO = 16 / 8;

type BannerCarouselProps = {
  banners: Banner[];
  loading: boolean;
};

/**
 * Paginated banner carousel — one banner fills the screen per page. Purely
 * bucket-driven (see `services/banners.ts`): renders nothing while its
 * folder is empty, no placeholder/empty-state needed since this is a bonus
 * visual, not core content. Shared by both Home banner slots (Hero Banners,
 * Banner Position 2) — which folder's data it shows is entirely up to the
 * caller, passed in as props.
 */
export function BannerCarousel({ banners, loading }: BannerCarouselProps) {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);

  const itemWidth = width - SIDE * 2;
  const itemHeight = Math.round(itemWidth / ASPECT_RATIO);

  if (loading) {
    return (
      <View style={[styles.wrap, { paddingHorizontal: SIDE }]}>
        <SkeletonBox width={itemWidth} height={itemHeight} borderRadius={20} />
      </View>
    );
  }

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
