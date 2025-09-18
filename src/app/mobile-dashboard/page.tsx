import { GestureEnhancedDashboard } from '@/components/mobile';

// Force dynamic rendering to prevent SSR issues with Wagmi hooks
export const dynamic = 'force-dynamic';
import styles from './page.module.css';

export default function MobileDashboardPage() {
  return (
    <div className={styles.container}>
      <GestureEnhancedDashboard />
    </div>
  );
}