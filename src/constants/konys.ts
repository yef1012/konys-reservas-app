export const colors = {
  primary: '#073847', deep: '#052E3A', accent: '#F47A20', background: '#F6F8F8',
  surface: '#FFFFFF', ink: '#17323B', muted: '#5A7078', border: '#DEE7E9',
  success: '#21684D', danger: '#AB3439', soft: '#EDF3F4', warm: '#FFF2E7',
  onDark: '#C4D6DC', accentDark: '#A74709', successSoft: '#E7F4EC', dangerSoft: '#FFF0F0',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radii = { sm: 10, md: 16, lg: 24, xl: 32, pill: 999 } as const;
export const typography = {
  title: { fontSize: 30, lineHeight: 37, fontWeight: '800' as const, letterSpacing: -0.8 },
  subtitle: { fontSize: 21, lineHeight: 28, fontWeight: '700' as const, letterSpacing: -0.4 },
  body: { fontSize: 15, lineHeight: 24 },
  caption: { fontSize: 12, lineHeight: 19 },
  label: { fontSize: 14, lineHeight: 21, fontWeight: '700' as const },
};
export const shadows = { card: { boxShadow: '0 5px 22px rgba(7, 56, 71, 0.045)' } } as const;
