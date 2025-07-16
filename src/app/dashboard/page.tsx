import UnifiedDashboard from "@/components/unified/UnifiedDashboard";
import styles from "./page.module.css";

export default function DashboardPage() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <UnifiedDashboard />
      </main>
    </div>
  );
}
