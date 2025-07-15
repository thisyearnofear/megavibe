// Mobile Constants - Centralized configuration for DRY principle

export const MOBILE_CONSTANTS = {
  // Tipping presets
  TIP_PRESETS: [1, 5, 10, 20] as const,
  APPROVAL_PRESETS: [50, 100, 200] as const,
  
  // Bounty presets
  BOUNTY_PRESETS: [10, 25, 50, 100] as const,
  
  // Touch targets (following Material Design guidelines)
  TOUCH_TARGET: {
    MIN_SIZE: 48, // Minimum 48x48dp for accessibility
    COMFORTABLE_SIZE: 56, // Comfortable touch target
    LARGE_SIZE: 64, // Large touch target for primary actions
  },
  
  // Animation durations
  ANIMATIONS: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  
  // Gesture thresholds
  GESTURES: {
    SWIPE_THRESHOLD: 100,
    PULL_THRESHOLD: 80,
    PINCH_THRESHOLD: 1.2,
  },
  
  // Haptic feedback patterns
  HAPTICS: {
    LIGHT: 50,
    MEDIUM: 100,
    HEAVY: 200,
    ERROR: 300,
  },
  
  // Breakpoints
  BREAKPOINTS: {
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1280,
  },
} as const;

export const BOUNTY_TYPES = [
  { id: "song", emoji: "🎵", label: "Song Request" },
  { id: "dance", emoji: "💃", label: "Dance Move" },
  { id: "trick", emoji: "🎪", label: "Special Trick" },
  { id: "custom", emoji: "✨", label: "Custom" }
] as const;

export const QUICK_MESSAGES = [
  "Great performance! 🎭",
  "Amazing! 🔥",
  "Keep it up! 💪",
  "Loved it! ❤️"
] as const;

export type BountyType = typeof BOUNTY_TYPES[number]['id'];
export type TipPreset = typeof MOBILE_CONSTANTS.TIP_PRESETS[number];
export type ApprovalPreset = typeof MOBILE_CONSTANTS.APPROVAL_PRESETS[number];