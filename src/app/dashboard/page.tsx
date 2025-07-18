import UnifiedDashboard from "@/components/unified/UnifiedDashboard";
import Container from "@/components/layout/Container";
import styles from "./page.module.css";

export default function DashboardPage() {
  return (
    <Container variant="wide">
      <main className={styles.main}>
        <UnifiedDashboard />
      </main>
    </Container>
  );
}
