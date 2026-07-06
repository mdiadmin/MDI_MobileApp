export const colors = {
  background: '#F4F8F5',
  foreground: '#0F2C1E',
  primary: '#1B5E38',
  primaryLight: '#4A7A5E',
  muted: '#9AB5A4',
  secondary: '#E8F2EC',
  accent: '#C9933A',
  accentBg: '#FBF3E6',
  card: '#ffffff',
  border: 'rgba(27, 94, 56, 0.12)',
} as const;

export const shadows = {
  card: {
    shadowColor: '#1B5E38',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  widget: {
    shadowColor: '#1B5E38',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  action: {
    shadowColor: '#1B5E38',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  donate: {
    shadowColor: '#C9933A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 6,
  },
} as const;
