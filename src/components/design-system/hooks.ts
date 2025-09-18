// Design System Hooks
// Reusable hooks for design system components and theme management

import { useState, useEffect, useMemo } from 'react';
import { theme, breakpoints } from './tokens';

// Hook for responsive breakpoints
export function useBreakpoint(breakpoint: keyof typeof breakpoints): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(`(min-width: ${breakpoints[breakpoint]})`);
    
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [breakpoint]);

  return matches;
}

// Hook for media queries (more flexible than useBreakpoint)
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [query]);

  return matches;
}

// Hook for responsive values
export function useResponsiveValue<T>(values: {
  base: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}): T {
  const is2xl = useBreakpoint('2xl');
  const isXl = useBreakpoint('xl');
  const isLg = useBreakpoint('lg');
  const isMd = useBreakpoint('md');
  const isSm = useBreakpoint('sm');

  return useMemo(() => {
    if (is2xl && values['2xl'] !== undefined) return values['2xl'];
    if (isXl && values.xl !== undefined) return values.xl;
    if (isLg && values.lg !== undefined) return values.lg;
    if (isMd && values.md !== undefined) return values.md;
    if (isSm && values.sm !== undefined) return values.sm;
    return values.base;
  }, [values, is2xl, isXl, isLg, isMd, isSm]);
}

// Hook for theme management
export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'auto'>('dark'); // Default to dark theme
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('megavibe-theme') as 'light' | 'dark' | 'auto' | null;
    if (saved) {
      setCurrentTheme(saved);
    }
  }, []);

  useEffect(() => {
    if (currentTheme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');

      const handler = (e: MediaQueryListEvent) => {
        setResolvedTheme(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      setResolvedTheme(currentTheme);
    }
  }, [currentTheme]);

  const setTheme = (newTheme: 'light' | 'dark' | 'auto') => {
    setCurrentTheme(newTheme);
    localStorage.setItem('megavibe-theme', newTheme);
  };

  return {
    theme: currentTheme,
    resolvedTheme,
    setTheme,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    tokens: theme,
  };
}

// Hook for component size calculations
export function useComponentSize(
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | undefined,
  defaultSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md'
) {
  const actualSize = size || defaultSize;
  
  const sizeMap = {
    xs: {
      padding: theme.spacing.xs,
      fontSize: theme.typography.fontSize.xs,
      height: '1.5rem',
    },
    sm: {
      padding: theme.spacing.sm,
      fontSize: theme.typography.fontSize.sm,
      height: '2rem',
    },
    md: {
      padding: theme.spacing.md,
      fontSize: theme.typography.fontSize.base,
      height: '2.5rem',
    },
    lg: {
      padding: theme.spacing.lg,
      fontSize: theme.typography.fontSize.lg,
      height: '3rem',
    },
    xl: {
      padding: theme.spacing.xl,
      fontSize: theme.typography.fontSize.xl,
      height: '3.5rem',
    },
  };

  return sizeMap[actualSize];
}

// Hook for animation preferences
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, []);

  return prefersReducedMotion;
}

// Hook for focus management
export function useFocusManagement() {
  const [isFocusVisible, setIsFocusVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        setIsFocusVisible(true);
      }
    };

    const handleMouseDown = () => {
      setIsFocusVisible(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return { isFocusVisible };
}

// Hook for haptic feedback
export function useHapticFeedback() {
  const triggerHaptic = (pattern: number | number[] = 50) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  return { triggerHaptic };
}