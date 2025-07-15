"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import styles from "./MobileTopBar.module.css";

interface ContextInfo {
  title: string;
  subtitle?: string;
  showBack?: boolean;
}

const getContextInfo = (pathname: string): ContextInfo => {
  if (pathname === "/") {
    return { title: "Discover", subtitle: "Find amazing performers" };
  }
  if (pathname.startsWith("/bounties")) {
    if (pathname.includes("/create")) {
      return { title: "Create Bounty", subtitle: "Request custom content", showBack: true };
    }
    if (pathname.includes("/")) {
      return { title: "Bounty Details", showBack: true };
    }
    return { title: "Bounties", subtitle: "Browse requests" };
  }
  if (pathname.startsWith("/create")) {
    return { title: "Creator Studio", subtitle: "Make something amazing" };
  }
  if (pathname.startsWith("/tip")) {
    return { title: "Quick Tip", subtitle: "Support a performer", showBack: true };
  }
  if (pathname.startsWith("/profile")) {
    return { title: "Profile", subtitle: "Your MegaVibe profile" };
  }
  
  return { title: "MegaVibe", subtitle: "The Stage" };
};

export default function MobileTopBar() {
  const pathname = usePathname();
  const { isConnected, formattedAddress, balance } = useWalletConnection();
  const contextInfo = getContextInfo(pathname);

  const handleBack = () => {
    window.history.back();
  };

  return (
    <header className={styles.topBar}>
      <div className={styles.leftSection}>
        {contextInfo.showBack ? (
          <button onClick={handleBack} className={styles.backButton}>
            <span className={styles.backIcon}>←</span>
          </button>
        ) : (
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🎭</span>
          </div>
        )}
        
        <div className={styles.contextInfo}>
          <h1 className={styles.contextTitle}>{contextInfo.title}</h1>
          {contextInfo.subtitle && (
            <p className={styles.contextSubtitle}>{contextInfo.subtitle}</p>
          )}
        </div>
      </div>

      <div className={styles.rightSection}>
        {isConnected ? (
          <div className={styles.walletInfo}>
            <div className={styles.walletBalance}>
              <span className={styles.balanceAmount}>{balance.formatted}</span>
              <span className={styles.balanceUnit}>MNT</span>
            </div>
            <div className={styles.walletAddress}>
              <span className={styles.connectedDot}></span>
              <span className={styles.addressText}>{formattedAddress}</span>
            </div>
          </div>
        ) : (
          <button className={styles.connectButton}>
            <span className={styles.connectIcon}>🔗</span>
            <span className={styles.connectText}>Connect</span>
          </button>
        )}
      </div>
    </header>
  );
}