import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { SparkleIcon } from '@/components/playground/icons';
import { brand } from '@/constants/brand';
import { PLAYGROUND_PROMPT_TIPS } from '@/constants/playground';

const ROTATE_INTERVAL_MS = 2800;
const TRANSITION_MS = 380;

/** Scattered ambient sparkles — purely decorative, sit behind the content. */
const SPARKLES: { top: `${number}%`; left: `${number}%`; size: number; delay: number }[] = [
  { top: '10%', left: '14%', size: 13, delay: 0 },
  { top: '18%', left: '80%', size: 10, delay: 320 },
  { top: '34%', left: '6%', size: 8, delay: 640 },
  { top: '30%', left: '90%', size: 9, delay: 960 },
  { top: '58%', left: '86%', size: 12, delay: 160 },
  { top: '64%', left: '10%', size: 9, delay: 480 },
  { top: '80%', left: '72%', size: 11, delay: 800 },
  { top: '78%', left: '24%', size: 8, delay: 1120 },
];

function Twinkle({
  top,
  left,
  size,
  delay,
}: {
  top: `${number}%`;
  left: `${number}%`;
  size: number;
  delay: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }), -1, true),
    );
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.12 + progress.value * 0.5,
    transform: [{ scale: 0.8 + progress.value * 0.4 }],
  }));

  return (
    <Animated.View style={[styles.twinkle, { top, left }, style]}>
      <SparkleIcon size={size} color={brand.orange} />
    </Animated.View>
  );
}

function BackgroundShimmer() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {SPARKLES.map((s, i) => (
        <Twinkle key={i} {...s} />
      ))}
    </View>
  );
}

/** Empty Playground screen — the rotating line is inspiration only, not tappable. */
export function PlaygroundEmptyState() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % PLAYGROUND_PROMPT_TIPS.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.wrap}>
      <BackgroundShimmer />
      <LinearGradient
        colors={[brand.orange, brand.orangeDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.icon}>
        <SparkleIcon size={28} color="#FFFFFF" />
      </LinearGradient>
      <Text style={styles.headline}>What shall Damroo design?</Text>

      <Text style={styles.tickerLabel}>Try asking for something like</Text>
      <View style={styles.tickerWrap}>
        <Animated.Text
          key={index}
          entering={FadeInDown.duration(TRANSITION_MS)}
          exiting={FadeOutUp.duration(TRANSITION_MS)}
          style={styles.tickerText}
          numberOfLines={1}>
          “{PLAYGROUND_PROMPT_TIPS[index]}”
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  twinkle: {
    position: 'absolute',
  },
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  headline: {
    fontSize: 24,
    fontWeight: '800',
    color: brand.ink,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  body: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: brand.muted,
    textAlign: 'center',
    maxWidth: 280,
  },
  tickerLabel: {
    marginTop: 26,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: brand.mutedSoft,
  },
  tickerWrap: {
    marginTop: 6,
    height: 20,
    width: '100%',
    maxWidth: 320,
    overflow: 'hidden',
  },
  tickerText: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: brand.ink,
  },
});
