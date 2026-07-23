import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { brand } from '@/constants/brand';

/** Warm cream canvas + soft orange glow blobs (bleeds under status + gesture areas). */
export function OnboardingCanvas() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root} pointerEvents="none">
      <LinearGradient
        colors={[brand.canvasTop, brand.canvasBottom]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.blob, styles.blobTopLeft]} />
      <View style={[styles.blob, styles.blobBottomRight]} />
      <LinearGradient
        colors={['rgba(253,243,231,0.7)', brand.creamBandClear]}
        style={[styles.scrimTop, { height: Math.max(insets.top, 12) + 100 }]}
      />
      <LinearGradient
        colors={[brand.canvasBottomClear, brand.canvasBottom]}
        style={[styles.scrimBottom, { height: Math.max(insets.bottom, 12) + 140 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
  },
  blob: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(249, 115, 22, 0.16)',
  },
  blobTopLeft: {
    top: -70,
    left: -80,
  },
  blobBottomRight: {
    bottom: -40,
    right: -90,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
  },
  scrimTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  scrimBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
