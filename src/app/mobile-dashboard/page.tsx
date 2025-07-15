import { GestureEnhancedDashboard } from '@/components/mobile';
import styles from './page.module.css';

export default function MobileDashboardPage() {
  return (
    <div className={styles.container}>
      <GestureEnhancedDashboard />
    </div>
  );
}