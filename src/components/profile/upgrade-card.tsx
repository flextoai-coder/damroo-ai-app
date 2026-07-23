import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CheckIcon, CrownIcon } from '@/components/profile/icons';
import { brand } from '@/constants/brand';

const BENEFITS = [
  'Unlimited templates',
  'AI captions & hashtags',
  'Auto-posting',
  'Premium video ads',
  'Remove watermark',
  'Priority support',
] as const;

type UpgradeCardProps = {
  onPress: () => void;
};

/** Hero plan teaser — opens the plans carousel sheet. */
export function UpgradeCard({ onPress }: UpgradeCardProps) {
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="View plans">
        <LinearGradient
          colors={[brand.orange, '#FB923C', brand.orangeDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}>
          <View style={[styles.blob, styles.blobTop]} />
          <View style={[styles.blob, styles.blobBottom]} />

          <View style={styles.crownChip}>
            <CrownIcon size={16} />
          </View>
          <Text style={styles.title}>Upgrade your plan</Text>
          <Text style={styles.subtitle}>Unlock the full studio</Text>

          <View style={styles.benefits}>
            {BENEFITS.map((item) => (
              <View key={item} style={styles.benefit}>
                <View style={styles.check}>
                  <CheckIcon size={10} />
                </View>
                <Text style={styles.benefitText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.cta}>
            <Text style={styles.ctaLabel}>View plans</Text>
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 22,
    paddingHorizontal: 22,
  },
  card: {
    borderRadius: 28,
    // Squircle-friendly continuous corners where supported.
    borderCurve: 'continuous',
    padding: 20,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  blobTop: {
    top: -50,
    right: -40,
  },
  blobBottom: {
    bottom: -60,
    left: -50,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  crownChip: {
    alignSelf: 'flex-start',
    width: 36,
    height: 36,
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.88)',
  },
  benefits: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  benefit: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  check: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 16,
  },
  cta: {
    marginTop: 20,
    height: 48,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: brand.orangeDeep,
  },
});
