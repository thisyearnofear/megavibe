"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/contexts/WalletContext";
import styles from "./OptimizedNavigation.module.css";
import EnhancedWalletDisplay from "../wallet/EnhancedWalletDisplay";

interface NavItem {
  name: string;
  path: string;
  icon: string;
  subItems?: { name: string; path: string; description: string }[];
}

export default function OptimizedNavigation() {
  const pathname = usePathname();
  const { isConnected } = useWallet();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      name: "Home",
      path: "/",
      icon: "🏠",
    },
    {
      name: "Discover",
      path: "/performers",
      icon: "🔍",
      subItems: [
        {
          name: "Performers",
          path: "/performers",
          description: "Find amazing live performers",
        },
        {
          name: "Content",
          path: "/content",
          description: "Browse performance content",
        },
        { name: "Gallery", path: "/gallery", description: "Curated showcase" },
      ],
    },
    {
      name: "Earn",
      path: "/bounties",
      icon: "💰",
      subItems: [
        {
          name: "Bounties",
          path: "/bounties",
          description: "Complete creative challenges",
        },
        {
          name: "Analytics",
          path: "/analytics",
          description: "Track your earnings",
        },
      ],
    },
    {
      name: "Create",
      path: "/create",
      icon: "🎨",
      subItems: [
        {
          name: "Creator Studio",
          path: "/create",
          description: "Main creation hub",
        },
        {
          name: "Upload Content",
          path: "/upload",
          description: "Share your performances",
        },
      ],
    },
  ];

  // Add Profile/Dashboard only when connected
  if (isConnected) {
    navItems.push({
      name: "Profile",
      path: "/dashboard",
      icon: "👤",
      subItems: [
        {
          name: "Dashboard",
          path: "/dashboard",
          description: "Your unified overview",
        },
        {
          name: "Settings",
          path: "/settings",
          description: "Manage your account",
        },
      ],
    });
  }

  const handleDropdownToggle = (itemName: string) => {
    setActiveDropdown(activeDropdown === itemName ? null : itemName);
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isPathActive = (path: string, subItems?: NavItem["subItems"]) => {
    if (pathname === path) return true;
    if (subItems) {
      return subItems.some((item) => pathname === item.path);
    }
    return false;
  };

  return (
    <nav className={styles.navigation}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>🎵</span>
          <span className={styles.logoText}>MegaVibe</span>
        </Link>

        {/* Mobile Menu Button */}
        <button
          className={styles.mobileMenuButton}
          onClick={handleMobileMenuToggle}
          aria-label="Toggle menu"
        >
          <span
            className={`${styles.hamburger} ${
              isMobileMenuOpen ? styles.open : ""
            }`}
          ></span>
        </button>

        {/* Desktop Navigation */}
        <div
          className={`${styles.navItems} ${
            isMobileMenuOpen ? styles.mobileOpen : ""
          }`}
        >
          {navItems.map((item) => (
            <div
              key={item.name}
              className={`${styles.navItem} ${
                isPathActive(item.path, item.subItems) ? styles.active : ""
              }`}
              onMouseEnter={() => item.subItems && setActiveDropdown(item.name)}
              onMouseLeave={() => item.subItems && setActiveDropdown(null)}
            >
              <Link
                href={item.path}
                className={styles.navLink}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navText}>{item.name}</span>
                {item.subItems && (
                  <span className={styles.dropdownArrow}>▼</span>
                )}
              </Link>

              {/* Dropdown Menu */}
              {item.subItems && activeDropdown === item.name && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownContent}>
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.path}
                        href={subItem.path}
                        className={`${styles.dropdownItem} ${
                          pathname === subItem.path
                            ? styles.dropdownItemActive
                            : ""
                        }`}
                        onClick={() => {
                          setActiveDropdown(null);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <div className={styles.dropdownItemContent}>
                          <span className={styles.dropdownItemName}>
                            {subItem.name}
                          </span>
                          <span className={styles.dropdownItemDescription}>
                            {subItem.description}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile Submenu */}
              {item.subItems && isMobileMenuOpen && (
                <div className={styles.mobileSubmenu}>
                  {item.subItems.map((subItem) => (
                    <Link
                      key={subItem.path}
                      href={subItem.path}
                      className={`${styles.mobileSubmenuItem} ${
                        pathname === subItem.path ? styles.active : ""
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {subItem.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Wallet Connection */}
          <div className={styles.walletContainer}>
            <EnhancedWalletDisplay compact={true} />
          </div>
        </div>
      </div>
    </nav>
  );
}
