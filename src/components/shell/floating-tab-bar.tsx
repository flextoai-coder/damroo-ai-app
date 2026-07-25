import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CaptionPickerSheet } from '@/components/captions/caption-picker-sheet';
import {
  BrandKitTabIcon,
  CaptionChipIcon,
  HomeTabIcon,
  ImageChipIcon,
  PlusIcon,
  ProfileTabIcon,
  TemplatesTabIcon,
} from '@/components/shell/tab-icons';
import { brand } from '@/constants/brand';
import {
  TAB_BAR_HEIGHT,
  TAB_BAR_SIDE_INSET,
  TAB_FAB_LIFT,
  tabBarBottomPad,
} from '@/constants/shell-layout';
import { useTabShellStore } from '@/stores/tab-shell-store';

const BAR_HEIGHT = TAB_BAR_HEIGHT;
const BAR_RADIUS = 26;
const SIDE_INSET = TAB_BAR_SIDE_INSET;
const FAB_SIZE = 58;
const FAB_LIFT = TAB_FAB_LIFT;
const CENTER_GAP = 64;
const HIDE_OFFSET = 120;

type TabKey = 'index' | 'templates' | 'brand-kit' | 'profile';

type TabRoute = {
  key: string;
  name: string;
};

/** Props from Expo Router's custom `tabBar` render prop (structurally typed). */
type FloatingTabBarProps = {
  state: {
    index: number;
    routes: TabRoute[];
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
};

const TABS: {
  key: TabKey;
  label: string;
  Icon: typeof HomeTabIcon;
}[] = [
  { key: 'index', label: 'Home', Icon: HomeTabIcon },
  { key: 'templates', label: 'Templates', Icon: TemplatesTabIcon },
  { key: 'brand-kit', label: 'Brand Kit', Icon: BrandKitTabIcon },
  { key: 'profile', label: 'Profile', Icon: ProfileTabIcon },
];

function routeName(route: { name: string }): string {
  return route.name;
}

export function FloatingTabBar({ state, navigation }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const router = useRouter();
  const fabOpen = useTabShellStore((s) => s.fabOpen);
  const tabBarVisible = useTabShellStore((s) => s.tabBarVisible);
  const setFabOpen = useTabShellStore((s) => s.setFabOpen);
  const toggleFab = useTabShellStore((s) => s.toggleFab);
  const [captionsPickerOpen, setCaptionsPickerOpen] = useState(false);

  const hideProgress = useSharedValue(0);
  const fabProgress = useSharedValue(0);

  useEffect(() => {
    hideProgress.value = withTiming(tabBarVisible ? 0 : 1, {
      duration: 340,
      easing: Easing.out(Easing.cubic),
    });
  }, [tabBarVisible, hideProgress]);

  useEffect(() => {
    // One soft overshoot on open (Easing.back), quick ease on close — no multi-bounce spring.
    fabProgress.value = withTiming(fabOpen ? 1 : 0, {
      duration: fabOpen ? 380 : 200,
      easing: fabOpen ? Easing.out(Easing.back(1.35)) : Easing.in(Easing.cubic),
    });
  }, [fabOpen, fabProgress]);

  // Close FAB when switching tabs
  useEffect(() => {
    setFabOpen(false);
  }, [state.index, setFabOpen]);

  const shellStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(hideProgress.value, [0, 1], [0, HIDE_OFFSET]) }],
  }));

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(fabProgress.value, [0, 1], [0, 1]),
  }));

  const plusStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(fabProgress.value, [0, 1], [0, 45])}deg` }],
  }));

  const actionLeftStyle = useAnimatedStyle(() => ({
    opacity: fabProgress.value,
    transform: [
      { translateY: interpolate(fabProgress.value, [0, 1], [42, 0]) },
      { translateX: interpolate(fabProgress.value, [0, 1], [22, 0]) },
      { scale: interpolate(fabProgress.value, [0, 1], [0.72, 1]) },
    ],
  }));

  const actionRightStyle = useAnimatedStyle(() => ({
    opacity: fabProgress.value,
    transform: [
      { translateY: interpolate(fabProgress.value, [0, 1], [48, 0]) },
      { translateX: interpolate(fabProgress.value, [0, 1], [-22, 0]) },
      { scale: interpolate(fabProgress.value, [0, 1], [0.68, 1]) },
    ],
  }));

  const activeName = routeName(state.routes[state.index] ?? { name: 'index' });

  // Playground owns the full viewport — composer sits flush; hide dock + FAB.
  if (activeName === 'assistant') {
    return null;
  }

  // iOS: sit above the home indicator. Android: window is already above the
  // system nav — only keep a small visual gap (avoids the large cream band).
  const bottomPad = tabBarBottomPad(insets.bottom);

  const onTabPress = (key: TabKey) => {
    setFabOpen(false);
    const route = state.routes.find((r: TabRoute) => r.name === key);
    if (!route) return;
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) {
      navigation.navigate(key);
    }
  };

  const onGenerateImage = () => {
    setFabOpen(false);
    router.push('/(tabs)/assistant' as Href);
  };

  const onGenerateCaptions = () => {
    setFabOpen(false);
    setCaptionsPickerOpen(true);
  };

  return (
    // Bottom-anchored overlay only — never flex-fill the tab slot (that pushed
    // the Android shell halfway up the screen).
    <View pointerEvents="box-none" style={styles.root}>
      {/* Only mount the dark scrim while the FAB menu is open — BlurView(tint=dark)
          can leave black corner artifacts on iOS even at opacity 0. */}
      {fabOpen ? (
        <Animated.View
          style={[styles.scrimWrap, { height: windowHeight }, scrimStyle]}
          pointerEvents="auto">
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setFabOpen(false)}>
            <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.scrimDim} />
          </Pressable>
        </Animated.View>
      ) : null}

      <Animated.View
        pointerEvents="box-none"
        style={[styles.dock, { paddingBottom: bottomPad }, shellStyle]}>
        {/* Absolute — must not consume vertical space or the glass bar floats mid-screen. */}
        <View
          pointerEvents={fabOpen ? 'box-none' : 'none'}
          style={[styles.actionsRow, { bottom: BAR_HEIGHT + bottomPad + 14 }]}>
          <Animated.View style={[styles.actionPillWrap, actionLeftStyle]}>
            <Pressable
              onPress={onGenerateImage}
              style={styles.actionPill}
              accessibilityRole="button"
              accessibilityLabel="Generate Image">
              <View style={styles.actionChip}>
                <ImageChipIcon />
              </View>
              <View>
                <Text style={styles.actionLine}>Generate</Text>
                <Text style={styles.actionLine}>Image</Text>
              </View>
            </Pressable>
          </Animated.View>

          <Animated.View style={[styles.actionPillWrap, actionRightStyle]}>
            <Pressable
              onPress={onGenerateCaptions}
              style={styles.actionPill}
              accessibilityRole="button"
              accessibilityLabel="Generate Captions">
              <View style={styles.actionChip}>
                <CaptionChipIcon />
              </View>
              <View>
                <Text style={styles.actionLine}>Generate</Text>
                <Text style={styles.actionLine}>Captions</Text>
              </View>
            </Pressable>
          </Animated.View>
        </View>

        <View style={styles.barWrap}>
          <BlurView intensity={55} tint="light" style={styles.barBlur}>
            <View style={styles.barFill}>
              <View style={styles.tabsRow}>
                {TABS.slice(0, 2).map((tab) => {
                  const active = activeName === tab.key;
                  return (
                    <TabButton
                      key={tab.key}
                      label={tab.label}
                      Icon={tab.Icon}
                      active={active}
                      onPress={() => onTabPress(tab.key)}
                    />
                  );
                })}

                <View style={{ width: CENTER_GAP }} />

                {TABS.slice(2).map((tab) => {
                  const active = activeName === tab.key;
                  return (
                    <TabButton
                      key={tab.key}
                      label={tab.label}
                      Icon={tab.Icon}
                      active={active}
                      onPress={() => onTabPress(tab.key)}
                    />
                  );
                })}
              </View>
            </View>
          </BlurView>

          <Pressable
            onPress={toggleFab}
            accessibilityRole="button"
            accessibilityLabel={fabOpen ? 'Close create menu' : 'Open create menu'}
            style={styles.fabHit}>
            <LinearGradient
              colors={[brand.orange, brand.orangeDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fab}>
              <Animated.View style={plusStyle}>
                <PlusIcon />
              </Animated.View>
            </LinearGradient>
          </Pressable>
        </View>
      </Animated.View>

      <CaptionPickerSheet
        visible={captionsPickerOpen}
        onClose={() => setCaptionsPickerOpen(false)}
      />
    </View>
  );
}

function TabButton({
  label,
  Icon,
  active,
  onPress,
}: {
  label: string;
  Icon: typeof HomeTabIcon;
  active: boolean;
  onPress: () => void;
}) {
  const color = active ? brand.orange : '#A8A29E';
  return (
    <Pressable
      onPress={onPress}
      style={styles.tabButton}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}>
      <Icon size={23} color={color} strokeWidth={active ? 2.15 : 1.65} />
      <Text style={[styles.tabLabel, { color }, active && styles.tabLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  scrimWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
  },
  scrimDim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
  },
  dock: {
    zIndex: 50,
    paddingHorizontal: SIDE_INSET,
    alignItems: 'center',
  },
  actionsRow: {
    position: 'absolute',
    left: SIDE_INSET,
    right: SIDE_INSET,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    zIndex: 60,
  },
  actionPillWrap: {
    // animated
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 148,
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  actionChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: brand.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLine: {
    fontSize: 13,
    fontWeight: '700',
    color: brand.ink,
    lineHeight: 16,
  },
  barWrap: {
    width: '100%',
    height: BAR_HEIGHT,
    justifyContent: 'center',
  },
  barBlur: {
    height: BAR_HEIGHT,
    borderRadius: BAR_RADIUS,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  barFill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.78)',
    justifyContent: 'center',
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  tabLabelActive: {
    fontWeight: '700',
  },
  fabHit: {
    position: 'absolute',
    alignSelf: 'center',
    top: -FAB_LIFT,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: 20,
    zIndex: 2,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: brand.canvasBottom,
    shadowColor: brand.orangeDeep,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
