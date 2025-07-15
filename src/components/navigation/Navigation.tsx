"use client";

import React, { useState } from "react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import styles from './Navigation.module.css';
import WalletConnect from "../wallet/WalletConnect";

export default function Navigation() {
  const pathname = usePathname();
  const { isConnected } = useWallet();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Performers", path: "/performers" },
    { name: "Content", path: "/content" },
    { name: "Bounties", path: "/bounties" },
    { name: "Creator Studio", path: "/create" },
    { name: "Gallery", path: "/gallery" },
    { name: "File Upload", path: "/upload" },
    ...(isConnected ? [
      { name: "Dashboard", path: "/dashboard" },
      { name: "Mobile Dashboard", path: "/mobile-dashboard" }
    ] : [])
  ];

  return (
    <nav className={styles.navigation}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          MegaVibe
        </Link>

        <button
          className={styles.mobileMenuButton}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span className={styles.hamburger}></span>
        </button>

        <div className={`${styles.navItems} ${isMenuOpen ? styles.open : ""}`}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`${styles.navItem} ${
                pathname === item.path ? styles.active : ""
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}

          <div className={styles.walletContainer}>
            <WalletConnect />
          </div>
        </div>
      </div>
    </nav>
  );
}
