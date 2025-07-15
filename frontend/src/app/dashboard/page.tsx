import UnifiedDashboard from '@/components/unified/UnifiedDashboard';
import CrossFeatureNavigation from '@/components/unified/CrossFeatureNavigation';
import styles from './page.module.css';

export default function DashboardPage() {
  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <CrossFeatureNavigation />
      </aside>
      <main className={styles.main}>
        <UnifiedDashboard />
      </main>
    </div>
  );
}