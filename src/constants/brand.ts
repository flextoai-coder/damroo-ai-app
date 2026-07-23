/** Damroo AI brand tokens — auth / marketing surfaces */
export const brand = {
  orange: '#F97316',
  orangeDeep: '#EA580C',
  orangeSoft: '#FFEDD5',
  /** Auth canvas gradient */
  canvasTop: '#FDEEDD',
  canvasBottom: '#FBEEE0',
  /** Auth fade band */
  creamBand: '#FDF3E7',
  cream: '#FFF8F1',
  creamDeep: '#F5E6D3',
  /**
   * Fully transparent cream stops — never use CSS `transparent` in LinearGradient
   * on iOS (it interpolates through black and shows as corner shadows).
   */
  canvasTopClear: 'rgba(253, 238, 221, 0)',
  canvasBottomClear: 'rgba(251, 238, 224, 0)',
  creamBandClear: 'rgba(253, 243, 231, 0)',
  ink: '#0F172A',
  muted: '#64748B',
  mutedSoft: '#94A3B8',
  card: '#FFFFFF',
  border: '#E2E8F0',
} as const;
