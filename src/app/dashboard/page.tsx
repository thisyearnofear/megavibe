import UnifiedDashboard from "@/components/unified/UnifiedDashboard";
import Container from "@/components/layout/Container";
import styles from "./page.module.css";

// Force dynamic rendering to prevent SSR issues with Wagmi hooks
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <Container variant="wide">
      <main className={styles.main}>
        <UnifiedDashboard />
      </main>
    </Container>
  );
}
