import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type ShimmerBlockProps = {
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
};

/** Soft sliding highlight used for loading skeletons. */
export function ShimmerBlock({ style, borderRadius = 14 }: ShimmerBlockProps) {
  const x = useSharedValue(-80);

  useEffect(() => {
    x.value = withRepeat(
      withTiming(220, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      -1,
      false,
    );
  }, [x]);

  const shine = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  return (
    <View style={[styles.base, { borderRadius }, style]}>
      <Animated.View style={[styles.shineWrap, shine]}>
        <LinearGradient
          colors={[
            'rgba(255,255,255,0)',
            'rgba(255,255,255,0.55)',
            'rgba(255,255,255,0)',
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.shine}
        />
      </Animated.View>
    </View>
  );
}

type PulsingDotsProps = {
  color?: string;
};

export function PulsingDots({ color = '#EA580C' }: PulsingDotsProps) {
  return (
    <View style={styles.dots}>
      {[0, 1, 2].map((i) => (
        <PulsingDot key={i} delay={i * 160} color={color} />
      ))}
    </View>
  );
}

function PulsingDot({ delay, color }: { delay: number; color: string }) {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 420, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      ),
    );
  }, [delay, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    backgroundColor: 'rgba(253, 186, 116, 0.35)',
  },
  shineWrap: {
    ...StyleSheet.absoluteFill,
    width: 90,
  },
  shine: {
    flex: 1,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
