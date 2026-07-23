/**
 * Bottom-sheet open / snap-back spring.
 * Tuned for ~1 light overshoot (not a multi-bounce settle).
 */
export const SHEET_SPRING = {
  damping: 30,
  stiffness: 240,
  mass: 0.85,
  overshootClamping: false,
} as const;
