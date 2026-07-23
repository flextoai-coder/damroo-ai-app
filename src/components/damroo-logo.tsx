import { StyleSheet, Text, View } from 'react-native';

import { brand } from '@/constants/brand';

type Props = {
  size?: number;
};

/** Orange rounded mark + “Damroo.” wordmark. */
export function DamrooLogo({ size = 36 }: Props) {
  const radius = size * 0.28;

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.mark,
          {
            width: size,
            height: size,
            borderRadius: radius,
          },
        ]}>
        <Text style={[styles.sparkle, { fontSize: size * 0.28, top: size * 0.16, left: size * 0.16 }]}>
          ✦
        </Text>
        <Text
          style={[
            styles.sparkle,
            { fontSize: size * 0.18, top: size * 0.46, left: size * 0.5 },
          ]}>
          ✦
        </Text>
      </View>
      <Text style={styles.wordmark}>
        Damroo<Text style={styles.dot}>.</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mark: {
    backgroundColor: brand.orange,
    overflow: 'hidden',
  },
  sparkle: {
    position: 'absolute',
    color: '#fff',
    fontWeight: '700',
  },
  wordmark: {
    fontSize: 28,
    fontWeight: '800',
    color: brand.ink,
    letterSpacing: -0.6,
  },
  dot: {
    color: brand.orange,
  },
});
