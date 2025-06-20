// Admin Components Barrel Export
// Centralizes all admin component exports for clean imports

// Core Admin Components
export { AdminLayout } from './AdminLayout';
export { AdminDashboard } from './AdminDashboard';
export { AdminProtectedRoute } from './AdminProtectedRoute';

// Speaker Management
export { SpeakerManagement } from './Speaker/SpeakerManagement';
export { SpeakerForm } from './Speaker/SpeakerForm';
export { SpeakerList } from './Speaker/SpeakerList';
export { SpeakerCard } from './Speaker/SpeakerCard';
export { SpeakerBulkImport } from './Speaker/SpeakerBulkImport';

// Event Management
export { EventManagement } from './Event/EventManagement';
export { EventForm } from './Event/EventForm';

// Analytics & Monitoring
export { AdminAnalytics } from './Analytics/AdminAnalytics';
export { SystemStatus } from './Analytics/SystemStatus';

// Shared Admin Components
export { AdminHeader } from './Shared/AdminHeader';
export { AdminSidebar } from './Shared/AdminSidebar';
export { AdminStats } from './Shared/AdminStats';
export { ConfirmModal } from './Shared/ConfirmModal';
