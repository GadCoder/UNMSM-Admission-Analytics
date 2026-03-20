export const designTokens = {
  color: {
    primary: '#8f5658',
    primaryDark: '#6f4043',
    primaryLight: '#b97b7d',
    background: '#faf8f7',
    surface: '#ffffff',
    textPrimary: '#2d2223',
    textSecondary: '#6e5e5f',
    success: '#2e8b57',
    warning: '#c58a2b',
    danger: '#c54b4b',
  },
  radius: {
    card: '12px',
  },
  shadow: {
    soft: '0 4px 20px rgba(0, 0, 0, 0.05)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  typography: {
    family: 'Lexend, ui-sans-serif, system-ui, sans-serif',
  },
} as const

export type DesignTokens = typeof designTokens
