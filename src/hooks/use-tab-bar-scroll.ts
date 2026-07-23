import { useRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import { useTabShellStore } from '@/stores/tab-shell-store';

const THRESHOLD = 10;

/**
 * Attach to ScrollView/FlatList `onScroll` so the floating tab bar
 * slides away on scroll-down and returns on scroll-up.
 */
export function useTabBarScroll() {
  const lastY = useRef(0);
  const setTabBarVisible = useTabShellStore((s) => s.setTabBarVisible);
  const setFabOpen = useTabShellStore((s) => s.setFabOpen);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const delta = y - lastY.current;

    if (y <= 8) {
      setTabBarVisible(true);
    } else if (delta > THRESHOLD) {
      setTabBarVisible(false);
      setFabOpen(false);
    } else if (delta < -THRESHOLD) {
      setTabBarVisible(true);
    }

    lastY.current = y;
  };

  return {
    onScroll,
    scrollEventThrottle: 16 as const,
  };
}
