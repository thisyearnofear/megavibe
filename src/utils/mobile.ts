// Mobile Utilities - Shared functions for mobile components

import { MOBILE_CONSTANTS } from '@/constants/mobile';

/**
 * Haptic feedback utility with fallback
 */
export const hapticFeedback = (pattern: keyof typeof MOBILE_CONSTANTS.HAPTICS = 'MEDIUM') => {
  const duration = MOBILE_CONSTANTS.HAPTICS[pattern];
  if (navigator.vibrate) {
    navigator.vibrate(duration);
  }
};

/**
 * Check if device supports haptic feedback
 */
export const supportsHaptics = (): boolean => {
  return 'vibrate' in navigator;
};

/**
 * Format currency amount for display
 */
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Generate smart title for bounties based on type and amount
 */
export const generateBountyTitle = (type: string, amount: number): string => {
  const suggestions = [
    `${type} for ${formatCurrency(amount)}`,
    `Amazing ${type.toLowerCase()} needed!`,
    `Who can do this ${type.toLowerCase()}?`,
    `${formatCurrency(amount)} bounty: ${type}`
  ];
  return suggestions[Math.floor(Math.random() * suggestions.length)];
};

/**
 * Validate touch target size for accessibility
 */
export const validateTouchTarget = (size: number): boolean => {
  return size >= MOBILE_CONSTANTS.TOUCH_TARGET.MIN_SIZE;
};

/**
 * Get responsive grid columns based on screen width
 */
export const getResponsiveColumns = (itemCount: number, minItemWidth = 120): number => {
  if (typeof window === 'undefined') return 2;
  
  const screenWidth = window.innerWidth;
  const maxColumns = Math.floor(screenWidth / minItemWidth);
  return Math.min(itemCount, Math.max(1, maxColumns));
};

/**
 * Debounce function for performance optimization
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function for gesture handling
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Safe area inset helper for mobile devices
 */
export const getSafeAreaInsets = () => {
  if (typeof window === 'undefined') return { top: 0, bottom: 0, left: 0, right: 0 };
  
  const style = getComputedStyle(document.documentElement);
  return {
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
    bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
    left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0'),
    right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
  };
};

/**
 * Check if device is in landscape mode
 */
export const isLandscape = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > window.innerHeight;
};

/**
 * Get optimal modal height based on content and screen size
 */
export const getOptimalModalHeight = (contentHeight: number, maxPercentage = 0.9): string => {
  if (typeof window === 'undefined') return '80vh';
  
  const screenHeight = window.innerHeight;
  const maxHeight = screenHeight * maxPercentage;
  const optimalHeight = Math.min(contentHeight, maxHeight);
  
  return `${optimalHeight}px`;
};