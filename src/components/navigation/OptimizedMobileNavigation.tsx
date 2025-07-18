"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@/contexts/WalletContext";
import styles from "./OptimizedMobileNavigation.module.css";

interface TabItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: string;
  requiresConnection?: boolean;
}

export default function OptimizedMobileNavigation() {
  const pathname = usePathname();
  const { isConnected } = useWallet();

  const tabs: TabItem[] = [
    {
      id: "home",
      label: "Home",
      icon: "🏠",
      href: "/",
    },
    {
      id: "discover",
      label: "Discover",
      icon: "🔍",
      href: "/performers",
    },
    {
      id: "bounties",
      label: "Bounties",
      icon: "💰",
      href: "/bounties",
      badge: "New",
    },
    {
      id: "create",
      label: "Create",
      icon: "🎨",
      href: "/create",
    },
    {
      id: "profile",
      label: "Profile",
      icon: "👤",
      href: isConnected ? "/dashboard" : "/",
      requiresConnection: true,
    },
  ];

  const getTabHref = (tab: TabItem) => {
    if (tab.requiresConnection && !isConnected) {
      return "/"; // Redirect to home if not connected
    }
    return tab.href;
  };

  const isTabActive = (tab: TabItem) => {
    if (tab.href === "/" && pathname === "/") return true;
    if (tab.href !== "/" && pathname.startsWith(tab.href)) return true;

    // Special cases for grouped navigation
    if (tab.id === "discover") {
      return ["/performers", "/content", "/gallery"].some((path) =>
        pathname.startsWith(path)
      );
    }
    if (tab.id === "bounties") {
      return ["/bounties", "/analytics"].some((path) =>
        pathname.startsWith(path)
      );
    }
    if (tab.id === "create") {
      return ["/create", "/upload"].some((path) => pathname.startsWith(path));
    }
    if (tab.id === "profile") {
      return ["/dashboard", "/settings", "/mobile-dashboard"].some((path) =>
        pathname.startsWith(path)
      );
    }

    return false;
  };

  const handleTabClick = (tab: TabItem) => {
    // Add haptic feedback for mobile devices
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    // Analytics tracking could be added here
    // trackNavigation(tab.id, tab.href);
  };

  return (
    <nav className={styles.bottomTabs} role="tablist">
      {tabs.map((tab) => {
        const isActive = isTabActive(tab);
        const href = getTabHref(tab);
        const isDisabled = tab.requiresConnection && !isConnected;

        return (
          <Link
            key={tab.id}
            href={href}
            className={`${styles.tab} ${isActive ? styles.active : ""} ${
              isDisabled ? styles.disabled : ""
            }`}
            onClick={() => handleTabClick(tab)}
            role="tab"
            aria-selected={isActive}
            aria-label={`${tab.label}${tab.badge ? ` (${tab.badge})` : ""}`}
          >
            <div className={styles.tabContent}>
              <div className={styles.iconContainer}>
                <div className={styles.iconWrapper}>
                  <span className={`${styles.icon} ${isActive ? styles.activeIcon : ''}`}>
                    {tab.icon}
                  </span>
                  {isActive && 
                    <div className={styles.activeGlow} />
                  }
                  {tab.badge && (
                    <span 
                      className={`${styles.badge} ${isActive ? styles.activeBadge : ''}`}
                      data-count={tab.badge}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>
                {isDisabled && (
                  <div className={styles.lockIndicator}>
                    <span className={styles.lockIcon}>🔒</span>
                  </div>
                )}
              </div>
              <span 
                className={`${styles.label} ${isActive ? styles.activeLabel : ''}`}
                data-active={isActive}
              >
                {tab.label}
              </span>
              {isActive && (
                <div className={styles.activeIndicator}>
                  <div className={styles.activePulse} />
                  <div className={styles.activeUnderline} />
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
