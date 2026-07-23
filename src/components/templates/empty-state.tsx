import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { brand } from '@/constants/brand';

export function TemplatesEmptyState() {
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[brand.orangeSoft, '#FDBA74']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.icon}>
        <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
          <Circle cx="11" cy="11" r="6.5" stroke={brand.orangeDeep} strokeWidth={1.8} />
          <Path
            d="M16.2 16.2L20 20"
            stroke={brand.orangeDeep}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        </Svg>
      </LinearGradient>
      <Text style={styles.title}>No templates found</Text>
      <Text style={styles.body}>Try a different search or filter.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 64,
    paddingBottom: 40,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: brand.ink,
  },
  body: {
    marginTop: 6,
    fontSize: 14,
    color: brand.muted,
    textAlign: 'center',
  },
});
