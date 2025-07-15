"use client";

import React, { useState } from "react";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { AnalyticsDashboard } from "@/components/analytics";
import { PerformerDashboard } from "@/components/performer";
import styles from "./page.module.css";

type UserRole = "audience" | "performer" | "venue";

export default function AnalyticsPage() {
  const { isConnected } = useWalletConnection();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [userRole, setUserRole] = useState<UserRole>("audience");

  if (!isConnected) {
    return (
      <div className={styles.container}>
        <div className={styles.connectPrompt}>
          <div className={styles.promptIcon}>📊</div>
          <h2>Connect to View Analytics</h2>
          <p>Connect your wallet to access your performance analytics and insights.</p>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className={styles.mobileContainer}>
        <div className={styles.roleSelector}>
          <h2>Your Analytics</h2>
          <div className={styles.roleButtons}>
            {(["audience", "performer", "venue"] as UserRole[]).map((role) => (
              <button
                key={role}
                className={`${styles.roleButton} ${userRole === role ? styles.active : ""}`}
                onClick={() => setUserRole(role)}
              >
                <span className={styles.roleIcon}>{getRoleIcon(role)}</span>
                <span className={styles.roleLabel}>{role.charAt(0).toUpperCase() + role.slice(1)}</span>
              </button>
            ))}
          </div>
        </div>

        {userRole === "performer" ? (
          <PerformerDashboard />
        ) : (
          <AnalyticsDashboard 
            userType={userRole}
            userId="current-user"
          />
        )}
      </div>
    );
  }

  // Desktop experience
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Analytics Dashboard</h1>
        <div className={styles.roleSelector}>
          {(["audience", "performer", "venue"] as UserRole[]).map((role) => (
            <button
              key={role}
              className={`${styles.roleButton} ${userRole === role ? styles.active : ""}`}
              onClick={() => setUserRole(role)}
            >
              {getRoleIcon(role)} {role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {userRole === "performer" ? (
        <PerformerDashboard />
      ) : (
        <AnalyticsDashboard 
          userType={userRole}
          userId="current-user"
        />
      )}
    </div>
  );
}

function getRoleIcon(role: UserRole): string {
  switch (role) {
    case "audience": return "👥";
    case "performer": return "🎭";
    case "venue": return "🏢";
    default: return "📊";
  }
}