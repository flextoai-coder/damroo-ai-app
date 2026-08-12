import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { brand } from '@/constants/brand';
import { categoryLabel } from '@/constants/templates';
import { resizedImageUrl } from '@/lib/image-transform';
import { templatePreviewUrl } from '@/services/templates';
import type { Enums } from '@/types/database';

/** Rail cards are a fixed 124px card; grid cards are ~half the screen width — sized generously either way. */
const RAIL_IMAGE_SIZE = { width: 130, height: 170 };
const GRID_IMAGE_SIZE = { width: 220, height: 220 };

type PosterCardProps = {
  title: string;
  /** Shown under the title (category preferred, else industry). */
  industry?: string;
  category?: Enums<'template_category'> | string;
  ribbon?: Enums<'template_source'> | null;
  previewPath?: string | null;
  onPress: () => void;
  /** `rail` = Home carousel (fixed 124px). `grid` = Templates 2-col (full column width). */
  variant?: 'rail' | 'grid';
  style?: StyleProp<ViewStyle>;
};

/** Template / recommendation card used on Home rails and Templates grid. */
export function PosterCard({
  title,
  industry,
  category,
  ribbon = null,
  previewPath,
  onPress,
  variant = 'rail',
  style,
}: PosterCardProps) {
  const url = templatePreviewUrl(previewPath);
  const caption = category ? categoryLabel(category) : industry;
  const isGrid = variant === 'grid';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={[isGrid ? styles.cardGrid : styles.cardRail, style]}>
      <BlurView intensity={28} tint="light" style={styles.blur}>
        <View style={styles.inner}>
          <View style={[styles.imageWrap, isGrid && styles.imageWrapGrid]}>
            {url ? (
              <Image
                source={{ uri: resizedImageUrl(url, isGrid ? GRID_IMAGE_SIZE : RAIL_IMAGE_SIZE) }}
                style={styles.image}
                contentFit="cover"
              />
            ) : (
              <LinearGradient
                colors={['#FFEDD5', '#FDBA74']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.placeholder}>
                <Text style={styles.placeholderBadge}>TEMPLATE</Text>
              </LinearGradient>
            )}
            {ribbon ? (
              <View
                style={[
                  styles.ribbon,
                  ribbon === 'official' ? styles.ribbonOfficial : styles.ribbonCreator,
                ]}>
                <Text style={styles.ribbonText}>
                  {ribbon === 'official' ? 'OFFICIAL' : 'CREATOR'}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.title, isGrid && styles.titleGrid]} numberOfLines={2}>
            {title}
          </Text>
          {caption ? (
            <Text style={styles.meta} numberOfLines={1}>
              {caption}
            </Text>
          ) : null}
        </View>
      </BlurView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardRail: {
    width: 124,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  cardGrid: {
    width: '100%',
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
  imageWrapGrid: {
    height: 196,
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
  placeholderBadge: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: brand.orangeDeep,
  },
  ribbon: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  ribbonOfficial: {
    backgroundColor: 'rgba(15,23,42,0.78)',
  },
  ribbonCreator: {
    backgroundColor: 'rgba(234,88,12,0.9)',
  },
  ribbonText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: brand.ink,
    lineHeight: 17,
    minHeight: 34,
  },
  titleGrid: {
    fontSize: 14,
    minHeight: 36,
  },
  meta: {
    marginTop: 2,
    fontSize: 11,
    color: brand.muted,
  },
});
