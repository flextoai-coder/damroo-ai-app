import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { brand } from '@/constants/brand';

type Edge = 'top' | 'bottom' | 'left' | 'right';

type AppScreenProps = {
  children: ReactNode;
  /** Which safe-area edges to pad interactive content for. Background always bleeds edge-to-edge. */
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Extra bottom space (e.g. floating tab bar clearance). */
  bottomExtra?: number;
  /** Soft orange glow blobs (home dashboard). */
  glowBlobs?: boolean;
};

/**
 * Diffuse radial wash. Extra mid-stops feather the edge so Android (no reliable
 * UIBlur) still reads as soft/blurred like iOS.
 */
function BlobWash({
  gradientId,
  coreOpacity = 0.4,
}: {
  gradientId: string;
  coreOpacity?: number;
}) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id={gradientId} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#F97316" stopOpacity={coreOpacity} />
          <Stop offset="18%" stopColor="#FB923C" stopOpacity={coreOpacity * 0.72} />
          <Stop offset="40%" stopColor="#FDBA74" stopOpacity={coreOpacity * 0.4} />
          <Stop offset="62%" stopColor="#FDBA74" stopOpacity={coreOpacity * 0.18} />
          <Stop offset="82%" stopColor="#FED7AA" stopOpacity={coreOpacity * 0.07} />
          <Stop offset="100%" stopColor="#FED7AA" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100" height="100" fill={`url(#${gradientId})`} />
    </Svg>
  );
}

function SoftBlob({
  style,
  gradientId,
  intensity = 90,
}: {
  style: StyleProp<ViewStyle>;
  gradientId: string;
  intensity?: number;
}) {
  // Android: layered washes simulate blur (dimezis blur on a solid radial often
  // stays hard-edged vs iOS UIVisualEffect). iOS keeps the real BlurView.
  if (Platform.OS !== 'ios') {
    return (
      <View style={[styles.blobHost, style]} pointerEvents="none">
        <View style={[styles.blobLayer, styles.blobLayerOuter]}>
          <BlobWash gradientId={`${gradientId}_outer`} coreOpacity={0.22} />
        </View>
        <View style={[styles.blobLayer, styles.blobLayerMid]}>
          <BlobWash gradientId={`${gradientId}_mid`} coreOpacity={0.3} />
        </View>
        <View style={[styles.blobLayer, styles.blobLayerCore]}>
          <BlobWash gradientId={`${gradientId}_core`} coreOpacity={0.36} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.blobHost, style]} pointerEvents="none">
      <View style={styles.blobTarget}>
        <BlobWash gradientId={gradientId} coreOpacity={0.5} />
      </View>
      <BlurView intensity={intensity} tint="default" style={styles.blobBlur} />
    </View>
  );
}

/**
 * Full-bleed Damroo canvas that draws under the status bar + gesture/nav area,
 * while padding children so controls stay in the safe region.
 */
export function AppScreen({
  children,
  edges = ['top', 'left', 'right'],
  style,
  contentStyle,
  bottomExtra = 0,
  glowBlobs = false,
}: AppScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, style]}>
      <LinearGradient
        colors={[brand.canvasTop, brand.canvasBottom]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {glowBlobs ? (
        <>
          <SoftBlob style={styles.blobTopLeft} gradientId="glowTop" intensity={95} />
          <SoftBlob style={styles.blobBottomRight} gradientId="glowBottom" intensity={100} />
        </>
      ) : null}

      <View
        style={[
          styles.content,
          {
            paddingTop: edges.includes('top') ? insets.top : 0,
            paddingBottom:
              (edges.includes('bottom') ? insets.bottom : 0) + bottomExtra,
            paddingLeft: edges.includes('left') ? Math.max(insets.left, 0) : 0,
            paddingRight: edges.includes('right') ? Math.max(insets.right, 0) : 0,
          },
          contentStyle,
        ]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: brand.canvasBottom,
    // Glow blobs deliberately bleed past this screen's own edge so they're
    // invisible at rest — without this, that bleed gets exposed mid-slide
    // during tab transitions (each screen translates as a rigid unit, so
    // the overflow briefly re-enters the viewport from the other side).
    overflow: 'hidden',
  },
  blobHost: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    overflow: 'hidden',
  },
  blobTarget: {
    ...StyleSheet.absoluteFill,
  },
  blobBlur: {
    ...StyleSheet.absoluteFill,
  },
  blobLayer: {
    position: 'absolute',
  },
  blobLayerOuter: {
    top: -28,
    left: -28,
    right: -28,
    bottom: -28,
    opacity: 0.85,
  },
  blobLayerMid: {
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    opacity: 0.9,
  },
  blobLayerCore: {
    top: 36,
    left: 36,
    right: 36,
    bottom: 36,
  },
  blobTopLeft: {
    top: -120,
    left: -130,
  },
  blobBottomRight: {
    bottom: 40,
    right: -140,
    width: 380,
    height: 380,
    borderRadius: 190,
  },
  content: {
    flex: 1,
  },
});
