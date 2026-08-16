import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TimerIcon } from '@/components/home/icons';
import { brand } from '@/constants/brand';

type ExpiringSoonBannerProps = {
  count: number;
  onPress: () => void;
};

/**
 * Persistent alert below the "Latest Generations by You" rail — unlike the
 * once-a-day ExpiringSoonSheet popup, this stays visible on every Home visit
 * as long as images are still expiring soon, and opens the same sheet.
 */
export function ExpiringSoonBanner({ count, onPress }: ExpiringSoonBannerProps) {
  if (count === 0) return null;

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${count} ${count === 1 ? 'image' : 'images'} expiring soon`}
        style={styles.card}>
        <LinearGradient
          colors={['#FBBF24', brand.warningMuted]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}>
          <View style={styles.blob} />
          <View style={styles.iconChip}>
            <TimerIcon size={17} color="#FFFFFF" />
          </View>
          <View style={styles.copy}>
            <Text style={styles.title} numberOfLines={1}>
              {count === 1 ? '1 image expiring soon' : `${count} images expiring soon`}
            </Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              Removed 7 days after generation — download what you want to keep
            </Text>
          </View>
          <View style={styles.cta}>
            <Text style={styles.ctaLabel}>Review</Text>
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 22,
    marginBottom: 20,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: brand.warningMuted,
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.14)',
    top: -50,
    right: -30,
  },
  iconChip: {
    width: 38,
    height: 38,
    borderRadius: 13,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 16,
  },
  cta: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  ctaLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: brand.warningMuted,
  },
});
