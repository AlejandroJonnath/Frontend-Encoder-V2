/**
 * Tokens de diseño completos inspirados en shadcn/ui (Dark Zinc Theme)
 * Centraliza colores, tipografía, espaciados, bordes y superficies para EncoderGoti.
 */
export const theme = {
  colors: {
    // Fondos y Superficies
    background: '#09090B',
    foreground: '#FAFAFA',
    card: '#121215',
    cardForeground: '#FAFAFA',
    cardHover: '#18181B',
    popover: '#121215',
    popoverForeground: '#FAFAFA',

    // Acciones y Primarios
    primary: '#FAFAFA',
    primaryForeground: '#09090B',
    secondary: '#1C1C21',
    secondaryForeground: '#F4F4F5',
    muted: '#1E1E24',
    mutedForeground: '#A1A1AA',

    // Acentos de Marca (Cielo / Azul Tecnológico)
    accent: '#0284C7',
    accentForeground: '#F0F9FF',
    accentMuted: 'rgba(2, 132, 199, 0.12)',
    ring: '#38BDF8',

    // Estados
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    destructiveMuted: 'rgba(239, 68, 68, 0.12)',
    success: '#10B981',
    successForeground: '#FFFFFF',
    successMuted: 'rgba(16, 185, 129, 0.12)',
    warning: '#F59E0B',
    warningForeground: '#FFFFFF',
    warningMuted: 'rgba(245, 158, 11, 0.12)',

    // Bordes e Inputs
    border: 'rgba(255, 255, 255, 0.08)',
    borderStrong: 'rgba(255, 255, 255, 0.16)',
    input: 'rgba(255, 255, 255, 0.08)',
    inputBackground: '#0D0D11',
  },

  // Escala uniforme de espaciados (padding / margin)
  spacing: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 48,
  },

  // Curvatura de bordes
  radius: {
    none: 0,
    xs: 4,
    sm: 6,
    md: 10,
    lg: 14,
    xl: 18,
    full: 9999,
  },

  // Jerarquía Tipográfica con espaciado y alturas de línea seguras para Android / iOS
  typography: {
    h1: {
      fontSize: 24,
      fontWeight: '700',
      letterSpacing: -0.5,
      lineHeight: 32,
      color: '#FAFAFA',
    },
    h2: {
      fontSize: 18,
      fontWeight: '600',
      letterSpacing: -0.3,
      lineHeight: 24,
      color: '#FAFAFA',
    },
    h3: {
      fontSize: 15,
      fontWeight: '600',
      letterSpacing: -0.2,
      lineHeight: 20,
      color: '#FAFAFA',
    },
    body: {
      fontSize: 14,
      fontWeight: '400',
      color: '#A1A1AA',
      lineHeight: 20,
    },
    bodyStrong: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FAFAFA',
      lineHeight: 20,
    },
    small: {
      fontSize: 12,
      fontWeight: '400',
      color: '#A1A1AA',
      lineHeight: 16,
    },
    label: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: '#71717A',
    },
    code: {
      fontSize: 12,
      color: '#38BDF8',
      fontFamily: 'monospace',
    },
  },
};
