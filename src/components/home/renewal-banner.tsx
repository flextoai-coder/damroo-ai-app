import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CrownIcon } from '@/components/profile/icons';
import { brand } from '@/constants/brand';

type RenewalBannerProps = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  onPress: () => void;
};

/** Alert banner shown at the top of Home when a plan is missing/expired or out of credits. */
export function RenewalBanner({ title, subtitle, ctaLabel, onPress }: RenewalBannerProps) {
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={ctaLabel}
        style={styles.card}>
        <LinearGradient
          colors={[brand.orange, '#FB923C', brand.orangeDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}>
          <View style={styles.blob} />
          <View style={styles.crownChip}>
            <CrownIcon size={16} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          </View>
          <View style={styles.cta}>
            <Text style={styles.ctaLabel}>{ctaLabel}</Text>
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
    shadowColor: brand.orangeDeep,
    shadowOpacity: 0.24,
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
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -50,
    right: -30,
  },
  crownChip: {
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
    color: 'rgba(255,255,255,0.88)',
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
    color: brand.orangeDeep,
  },
});
