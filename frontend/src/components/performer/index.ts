// Performer component exports - Clean, organized barrel exports
export { default as PerformerOnboarding } from './PerformerOnboarding';
export { default as PerformerDashboard } from './PerformerDashboard';
export { default as QRCodeGenerator } from './QRCodeGenerator';

// Re-export types for external use
export type {
  PerformerProfile
} from '@/services/api/performerService';

// Utility functions for performer-related operations
export const performerUtils = {
  generatePerformerId: () => `performer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  
  validateProfile: (profile: any) => {
    return !!(profile.name && profile.type);
  },
  
  formatPerformerType: (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  },
  
  getPerformerIcon: (type: string) => {
    const icons: Record<string, string> = {
      'Musician': '🎸',
      'Comedian': '🎭',
      'Street Performer': '🎪',
      'DJ': '🎧',
      'Dancer': '💃',
      'Magician': '🎩',
      'Poet': '📝',
      'Artist': '🎨'
    };
    return icons[type] || '🎭';
  }
};