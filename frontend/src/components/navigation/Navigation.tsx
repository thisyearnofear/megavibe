"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Navigation.module.css";
import WalletConnect from "../wallet/WalletConnect";

export default function Navigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Performers", path: "/performers" },
    { name: "Content", path: "/content" },
    { name: "Bounties", path: "/bounties" },
    { name: "File Upload", path: "/upload" },
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
            <WalletConnect
              onConnect={(address) =>
                console.log(`Wallet connected: ${address}`)
              }
              onDisconnect={() => console.log("Wallet disconnected")}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
