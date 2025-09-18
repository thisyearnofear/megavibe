// Design System Theme Tokens
// Centralized design tokens for consistency across the application

export const colors = {
  // Primary brand colors
  primary: {
    50: '#f3e8ff',
    100: '#e9d5ff',
    200: '#d8b4fe',
    300: '#c084fc',
    400: '#a855f7',
    500: '#8a2be2', // Main primary
    600: '#7b1fa2',
    700: '#6b46c1',
    800: '#5b21b6',
    900: '#4c1d95',
  },
  
  // Secondary colors
  secondary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#1e90ff', // Main secondary
    600: '#1976d2',
    700: '#1565c0',
    800: '#1e3a8a',
    900: '#1e40af',
  },
  
  // Accent colors
  accent: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ff1493', // Main accent
    600: '#e91e63',
    700: '#be185d',
    800: '#9d174d',
    900: '#831843',
  },
  
  // Success colors
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#00ff88', // Main success (tip color)
    600: '#00cc6a',
    700: '#059669',
    800: '#065f46',
    900: '#064e3b',
  },
  
  // Warning colors
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Danger colors
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  
  // Neutral colors (text, background, borders)
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },
  
  // Dark theme specific colors
  dark: {
    background: '#121212',
    backgroundSecondary: '#1e1e1e',
    backgroundTertiary: '#2a2a2a',
    textPrimary: '#ffffff',
    textSecondary: '#e0e0e0',
    border: 'rgba(255, 255, 255, 0.1)',
  },
} as const;

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  '4xl': '5rem',   // 80px
  '5xl': '6rem',   // 96px
} as const;

export const typography = {
  fontFamily: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
    display: "'Montserrat', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
    mono: "'Roboto Mono', 'SF Mono', Monaco, Inconsolata, 'Roboto Mono', Consolas, 'Courier New', monospace",
  },
  
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
  },
  
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
} as const;

export const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  full: '9999px',  // fully rounded
} as const;

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  
  // Colored shadows for brand elements
  primary: '0 4px 15px rgba(138, 43, 226, 0.2)',
  primaryLg: '0 8px 30px rgba(138, 43, 226, 0.3)',
  secondary: '0 4px 15px rgba(30, 144, 255, 0.2)',
  accent: '0 4px 15px rgba(255, 20, 147, 0.2)',
  success: '0 4px 15px rgba(0, 255, 136, 0.2)',
  tip: '0 6px 20px rgba(0, 255, 136, 0.3)',
  bounty: '0 6px 20px rgba(138, 43, 226, 0.3)',
} as const;

export const transitions = {
  fast: '0.15s ease',
  normal: '0.3s ease',
  slow: '0.5s ease',
  
  // Specific transition sets for common animations
  button: 'all 0.15s ease',
  card: 'transform 0.3s ease, box-shadow 0.3s ease',
  modal: 'opacity 0.3s ease, transform 0.3s ease',
  tooltip: 'opacity 0.15s ease, transform 0.15s ease',
} as const;

export const breakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

// Utility function to create consistent theme objects
export const theme = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  transitions,
  breakpoints,
  zIndex,
} as const;

// CSS Custom Properties mapping for runtime theme switching
export const cssVariables = {
  // Color mappings to CSS custom properties
  '--color-primary': colors.primary[500],
  '--color-primary-dark': colors.primary[600],
  '--color-secondary': colors.secondary[500],
  '--color-accent': colors.accent[500],
  '--color-success': colors.success[500],
  '--color-warning': colors.warning[500],
  '--color-danger': colors.danger[500],
  
  // Dark theme colors
  '--background': colors.dark.background,
  '--background-secondary': colors.dark.backgroundSecondary,
  '--background-tertiary': colors.dark.backgroundTertiary,
  '--text-primary': colors.dark.textPrimary,
  '--text-secondary': colors.dark.textSecondary,
  '--border': colors.dark.border,
  
  // Spacing
  '--space-xs': spacing.xs,
  '--space-sm': spacing.sm,
  '--space-md': spacing.md,
  '--space-lg': spacing.lg,
  '--space-xl': spacing.xl,
  '--space-2xl': spacing['2xl'],
  
  // Typography
  '--font-sans': typography.fontFamily.sans,
  '--font-display': typography.fontFamily.display,
  '--font-mono': typography.fontFamily.mono,
  
  // Border radius
  '--border-radius-sm': borderRadius.sm,
  '--border-radius-md': borderRadius.md,
  '--border-radius-lg': borderRadius.lg,
  
  // Transitions
  '--transition-fast': transitions.fast,
  '--transition-normal': transitions.normal,
  '--transition-slow': transitions.slow,
} as const;

export default theme;