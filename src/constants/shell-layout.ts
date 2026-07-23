import { Platform } from 'react-native';

/** Floating tab dock metrics — keep in sync with `FloatingTabBar`. */
export const TAB_BAR_HEIGHT = 66;
export const TAB_BAR_SIDE_INSET = 14;
/** Gap between the glass bar and the bottom of the interactive area. */
export const TAB_BAR_BOTTOM_GAP = Platform.OS === 'android' ? 4 : 14;
export const TAB_FAB_LIFT = 20;

/**
 * Breathing room under the status bar.
 *
 * Android (Expo Go / opaque system bars): the window is already laid out below
 * the status bar, but safe-area-context still reports a top inset — applying it
 * again creates the empty cream band under the status bar. Use a tight fixed pad.
 *
 * iOS: use the real safe-area inset (notch / Dynamic Island).
 */
export function screenTopPadding(safeTop: number) {
  if (Platform.OS === 'android') return 10;
  return safeTop + 8;
}

/**
 * Clearance so the last scroll items clear the floating glass bar.
 * Android: bar sits flush at the bottom — only reserve the bar height (FAB overlays).
 * iOS: also clear the home indicator + FAB lift.
 */
export function tabScreenBottomPadding(safeBottom: number) {
  if (Platform.OS === 'android') {
    return TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_GAP + 12;
  }
  return safeBottom + TAB_BAR_BOTTOM_GAP + TAB_BAR_HEIGHT + TAB_FAB_LIFT + 8;
}

/** Padding under the floating glass bar (above the system nav / home indicator). */
export function tabBarBottomPad(safeBottom: number) {
  if (Platform.OS === 'android') return TAB_BAR_BOTTOM_GAP;
  return safeBottom + TAB_BAR_BOTTOM_GAP;
}
