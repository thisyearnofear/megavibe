"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import styles from "./MobileBottomTabs.module.css";

const tabs = [
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
  },
  {
    id: "create",
    label: "Create",
    icon: "➕",
    href: "/create",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: "📊",
    href: "/analytics",
  },
];

export default function MobileBottomTabs() {
  const pathname = usePathname();

  return (
    <nav className={styles.bottomTabs}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`${styles.tab} ${isActive ? styles.active : ""}`}
          >
            <span className={styles.icon}>{tab.icon}</span>
            <span className={styles.label}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
