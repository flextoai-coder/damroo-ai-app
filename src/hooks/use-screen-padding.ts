import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { screenTopPadding, tabScreenBottomPadding } from '@/constants/shell-layout';

/** Top/bottom padding for main tab screens (Home, Templates, Profile). */
export function useTabScreenPadding() {
  const insets = useSafeAreaInsets();
  return {
    paddingTop: screenTopPadding(insets.top),
    paddingBottom: tabScreenBottomPadding(insets.bottom),
    // Let short pages fill the viewport so content isn't stranded mid-screen.
    flexGrow: 1,
  };
}

/** Top padding only — headers that sit under a transparent status bar. */
export function useScreenTopPadding(extra = 0) {
  const insets = useSafeAreaInsets();
  return screenTopPadding(insets.top) + extra;
}
