// Unified components for cohesive MegaVibe experience
export { default as UnifiedDashboard } from './UnifiedDashboard';

// Re-export the service for easy access
export { unifiedAppService } from '@/services/unified/UnifiedAppService';
export type { UserProfile, UserActivity } from '@/services/unified/UnifiedAppService';