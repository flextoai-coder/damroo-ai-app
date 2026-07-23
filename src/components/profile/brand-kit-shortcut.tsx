import { BlurView } from 'expo-blur';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChevronRightIcon, PaletteIcon } from '@/components/profile/icons';
import { brand } from '@/constants/brand';

type BrandKitShortcutProps = {
  onPress: () => void;
  colors?: string[];
};

export function BrandKitShortcut({
  onPress,
  colors = [brand.orange, '#FBBF24', brand.ink],
}: BrandKitShortcutProps) {
  return (
    <View style={styles.wrap}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Open Brand Kit">
        <BlurView intensity={36} tint="light" style={styles.card}>
          <View style={styles.inner}>
            <View style={styles.iconTile}>
              <PaletteIcon />
            </View>
            <View style={styles.copy}>
              <Text style={styles.title}>Brand Kit</Text>
              <Text style={styles.body}>Colors, logo & voice</Text>
            </View>
            <View style={styles.dots}>
              {colors.map((c) => (
                <View key={c} style={[styles.dot, { backgroundColor: c }]} />
              ))}
            </View>
            <ChevronRightIcon />
          </View>
        </BlurView>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 18,
    paddingHorizontal: 22,
  },
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,237,213,0.55)',
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
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
    color: brand.ink,
  },
  body: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '500',
    color: brand.muted,
  },
  dots: {
    flexDirection: 'row',
    gap: 5,
    marginRight: 2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
});
