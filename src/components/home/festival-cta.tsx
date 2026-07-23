import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { brand } from '@/constants/brand';

type FestivalCtaProps = {
  onPress: () => void;
};

export function FestivalCta({ onPress }: FestivalCtaProps) {
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Create festival campaign"
        style={styles.card}>
        <LinearGradient
          colors={[brand.orange, '#FB923C', brand.orangeDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}>
          <Text style={styles.kicker}>SEASONAL DROP</Text>
          <Text style={styles.title}>Festival posters,{'\n'}ready in minutes</Text>
          <Text style={styles.body}>
            Spin up Diwali, Holi, and weekend offers tuned to your brand.
          </Text>
          <View style={styles.cta}>
            <Text style={styles.ctaLabel}>Start creating →</Text>
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 22,
    marginBottom: 28,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: brand.orangeDeep,
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  gradient: {
    padding: 20,
    minHeight: 168,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  body: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.9)',
    maxWidth: 280,
  },
  cta: {
    alignSelf: 'flex-start',
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  ctaLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: brand.orangeDeep,
  },
});
