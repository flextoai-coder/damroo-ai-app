import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import * as Sentry from '@sentry/react-native';

import { CrashFallback } from '@/components/shell/crash-fallback';
import { brand } from '@/constants/brand';
import { TAB_SLIDE_DURATION_MS } from '@/constants/tab-transition';
import { useTabShellStore } from '@/stores/tab-shell-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
/** How long to wait past the expected transition length before offering a reload. */
const RELOAD_WATCHDOG_MS = TAB_SLIDE_DURATION_MS + 600;

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
  /**
   * This screen's position in the tab bar's declared order (Home=0,
   * Templates=1, Brand Kit=2, Profile=3, Playground=4). When set, the
   * screen slides in/out based on how it compares to the currently focused
   * tab. Omit for non-tab screens (stack pushes like generation detail).
   */
  tabIndex?: number;
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
  tabIndex,
}: AppScreenProps) {
  const insets = useSafeAreaInsets();
  const activeTabIndex = useTabShellStore((s) => s.activeTabIndex);

  // Resting position relative to whichever tab is focused: 0 while focused,
  // -1/1 parked off-screen to the left/right otherwise. Re-derived from the
  // store on every change, so unlike the navigator's own transition value it
  // can't get orphaned mid-flight — the next update always retargets it
  // authoritatively from its current position.
  const slideTarget =
    tabIndex === undefined ? 0 : tabIndex === activeTabIndex ? 0 : tabIndex < activeTabIndex ? -1 : 1;
  const slideProgress = useSharedValue(slideTarget);

  // `completedTarget` is written only from the withTiming callback below
  // (an async, external-system update) or in the render-phase reset below —
  // never synchronously inside an effect body — so `settled`/`showReload`
  // can be plain derived values instead of state we'd otherwise have to
  // reset from inside an effect.
  const [completedTarget, setCompletedTarget] = useState(slideTarget);
  const [prevSlideTarget, setPrevSlideTarget] = useState(slideTarget);
  const [watchdogFired, setWatchdogFired] = useState(false);
  const [remountKey, setRemountKey] = useState(0);

  // React's documented pattern for resetting state when a dependency
  // changes — done during render, not in an effect, so it isn't flagged as
  // a synchronous setState-in-effect. See:
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  if (slideTarget !== prevSlideTarget) {
    setPrevSlideTarget(slideTarget);
    setWatchdogFired(false);
  }

  const settled = completedTarget === slideTarget;
  const showReload = watchdogFired && slideTarget === 0 && !settled;

  useEffect(() => {
    if (tabIndex === undefined) {
      // Not a tab screen (stack pushes like generation detail) — no slide.
      slideProgress.value = 0;
      return;
    }
    slideProgress.value = withTiming(
      slideTarget,
      { duration: TAB_SLIDE_DURATION_MS, easing: Easing.linear },
      (finished) => {
        if (finished) runOnJS(setCompletedTarget)(slideTarget);
      },
    );
  }, [slideTarget, slideProgress, tabIndex]);

  // Safety net: if this screen is supposed to be the visible one but its
  // slide never finished settling — whatever the cause — offer a manual way
  // out instead of leaving the user staring at a screen that never resolves.
  useEffect(() => {
    if (tabIndex === undefined || slideTarget !== 0 || settled) return;
    const timer = setTimeout(() => setWatchdogFired(true), RELOAD_WATCHDOG_MS);
    return () => clearTimeout(timer);
  }, [tabIndex, slideTarget, settled]);

  const onReload = () => {
    // Directly mutating a Reanimated shared value from an event handler is
    // the standard way to drive it — the lint rule's static analysis just
    // doesn't model `.value` writes as a special case, so it flags this as
    // "modifying a value used in an effect dependency" even though it's not
    // the antipattern that rule is meant to catch.
    // eslint-disable-next-line react-hooks/immutability
    slideProgress.value = 0;
    setCompletedTarget(slideTarget);
    setWatchdogFired(false);
    setRemountKey((k) => k + 1);
  };

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideProgress.value * SCREEN_WIDTH }],
  }));

  return (
    <Animated.View style={[styles.root, style, slideStyle]}>
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
        key={remountKey}
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
        {/* Scoped to just this screen's content — a render-time error here
            (e.g. from a background generation's state update landing while
            this tab is off-screen but still mounted, per the slide-transform
            design above) shows a local crash card instead of taking down the
            whole app via the root boundary in _layout.tsx. FloatingTabBar is
            a sibling of every AppScreen instance in the navigator's tree, not
            a descendant, so it stays interactive even if this trips. */}
        <Sentry.ErrorBoundary
          fallback={({ resetError }) => <CrashFallback onReload={resetError} />}
          beforeCapture={(scope) => {
            scope.setTag('appScreenTabIndex', tabIndex !== undefined ? String(tabIndex) : 'stack');
          }}>
          {children}
        </Sentry.ErrorBoundary>
      </View>

      {showReload ? (
        <View
          pointerEvents="box-none"
          style={[styles.reloadWrap, { paddingBottom: insets.bottom + 24 }]}>
          <Pressable
            onPress={onReload}
            style={styles.reloadPill}
            accessibilityRole="button"
            accessibilityLabel="Reload this screen">
            <Text style={styles.reloadLabel}>Tap to reload</Text>
          </Pressable>
        </View>
      ) : null}
    </Animated.View>
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
  reloadWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  reloadPill: {
    backgroundColor: brand.ink,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 22,
    shadowColor: '#0F172A',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  reloadLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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
