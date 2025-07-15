// Unified components for cohesive MegaVibe experience
export { default as UnifiedDashboard } from './UnifiedDashboard';
export { default as CrossFeatureNavigation } from './CrossFeatureNavigation';

// Re-export the service for easy access
export { unifiedAppService } from '@/services/unified/UnifiedAppService';
export type { UserProfile, UserActivity } from '@/services/unified/UnifiedAppService';