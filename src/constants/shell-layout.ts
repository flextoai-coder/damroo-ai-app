/** Floating tab dock metrics — keep in sync with `FloatingTabBar`. */
export const TAB_BAR_HEIGHT = 66;
export const TAB_BAR_SIDE_INSET = 14;
/** Gap between the glass bar and the bottom of the interactive area. */
export const TAB_BAR_BOTTOM_GAP = 14;
export const TAB_FAB_LIFT = 20;

/**
 * Breathing room under the status bar.
 *
 * The app renders edge-to-edge on both platforms (`edgeToEdgeEnabled: true`),
 * so `useSafeAreaInsets().top` is the real status bar / notch height on
 * Android too — trust it the same way on both platforms instead of guessing
 * a fixed pad.
 */
export function screenTopPadding(safeTop: number) {
  return safeTop + 8;
}

/**
 * Clearance so the last scroll items clear the floating glass bar, including
 * the real bottom safe-area inset (gesture bar / 3-button nav on Android,
 * home indicator on iOS) plus the FAB lift.
 */
export function tabScreenBottomPadding(safeBottom: number) {
  return safeBottom + TAB_BAR_BOTTOM_GAP + TAB_BAR_HEIGHT + TAB_FAB_LIFT + 8;
}

/** Padding under the floating glass bar (above the system nav / home indicator). */
export function tabBarBottomPad(safeBottom: number) {
  return safeBottom + TAB_BAR_BOTTOM_GAP;
}
