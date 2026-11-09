/**
 * WARM_EARTHY preset (design-system/presets-index.md) with the brief's
 * cartographic accent overrides: surveyor brown + river teal on khaki paper.
 * The `name` field stays exactly as in preset.ts (rule #11b).
 */
export const THEME = {
  name: 'warm-earthy',
  colors: {
    bg: {
      paper: '#F5EFE0',
      paperWarm: '#EFE6D2',
      paperDeep: '#E7DAC0',
      ink: '#2C2416',
      inkSoft: '#3A3020',
    },
    surface: {
      card: '#FFFDF7',
      sheet: '#E1D3B5',
      deep: '#D8C9A8',
      tintBrown: 'rgba(138,90,43,0.07)',
      tintTeal: 'rgba(30,127,140,0.12)',
      scrim: 'rgba(44,36,22,0.28)',
    },
    accent: {
      brown: '#8A5A2B',
      brownDark: '#6E4521',
      teal: '#1E7F8C',
      tealDeep: '#15616B',
      terracotta: '#D97B4D',
      mustard: '#D9B36C',
    },
    text: {
      primary: '#2C2416',
      secondary: '#6B5B43',
      brown: '#8A5A2B',
      onDark: '#F5EFE0',
      muted: '#A89B82',
    },
    line: {
      hairline: 'rgba(138,90,43,0.20)',
      hairlineStrong: 'rgba(138,90,43,0.33)',
      hairlineTeal: 'rgba(30,127,140,0.33)',
      border: '#D8C9A8',
    },
  },
  gradients: {
    loader: ['#2C2416', '#3E3220', '#5A3F21'] as string[],
    paper: ['#F5EFE0', '#EFE6D2', '#E7DAC0'] as string[],
    debrief: ['#EFE6D2', '#F5EFE0', '#E7DAC0'] as string[],
    game: ['#F5EFE0', '#EDE3CD'] as string[],
    button: ['#8A5A2B', '#6E4521'] as string[],
    progress: ['#8A5A2B', '#1E7F8C'] as string[],
  },
  typography: {
    hero: { fontSize: 38, fontWeight: '800' as const, letterSpacing: 2, lineHeight: 40 },
    loaderTitle: { fontSize: 32, fontWeight: '800' as const, letterSpacing: 3.5, lineHeight: 38 },
    title: { fontSize: 24, fontWeight: '700' as const, letterSpacing: 1.6 },
    cardTitle: { fontSize: 17, fontWeight: '700' as const, letterSpacing: 0.4 },
    body: { fontSize: 15, fontWeight: '500' as const, lineHeight: 21 },
    button: { fontSize: 16, fontWeight: '800' as const, letterSpacing: 2, lineHeight: 24 },
    caption: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 2.2 },
    eyebrow: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 2 },
    reading: { fontSize: 20, fontWeight: '800' as const, letterSpacing: 0.5 },
  },
  radius: { xs: 4, sm: 6, md: 10, lg: 12, xl: 14, full: 999 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 26 },
  shadows: {
    bar: {
      shadowColor: '#2C2416',
      shadowOpacity: 0.14,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    cta: {
      shadowColor: '#8A5A2B',
      shadowOpacity: 0.35,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 7,
    },
  },
  anim: {
    entry: { tension: 42, friction: 8 },
    press: { tension: 300, friction: 12 },
    pop: { tension: 50, friction: 7 },
  },
};

export type Theme = typeof THEME;
export default THEME;
