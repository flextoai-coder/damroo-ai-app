import { Dimensions, Easing } from 'react-native';
// The main 'expo-router' entry only re-exports the `Tabs` component itself;
// the underlying bottom-tabs types (this one included) live under this path.
import type { BottomTabNavigationOptions } from 'expo-router/js-tabs';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const TAB_SLIDE_DURATION_MS = 260;

/**
 * Full-width horizontal slide, direction driven by tab order (Home · Templates
 * · Brand Kit · Profile). Moving to a tab further right in that order slides
 * the new screen in from the right while the old one exits left, and vice
 * versa going back — a paged/swipe feel instead of an instant tab cut.
 */
export const tabSlideInterpolator: NonNullable<BottomTabNavigationOptions['sceneStyleInterpolator']> =
  ({ current }) => ({
    sceneStyle: {
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
          }),
        },
      ],
    },
  });

export const tabSlideTransitionSpec: NonNullable<BottomTabNavigationOptions['transitionSpec']> = {
  animation: 'timing',
  config: {
    duration: TAB_SLIDE_DURATION_MS,
    // Linear, not eased — chained multi-tab hops retarget the same Animated.Value
    // mid-flight, and an ease-out curve decelerates to a near-stop right before
    // each retarget (reads as "stop, then flick forward"). Constant velocity
    // keeps that handoff seamless.
    easing: Easing.linear,
  },
};
