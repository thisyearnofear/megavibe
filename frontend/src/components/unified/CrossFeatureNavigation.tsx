'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import styles from './CrossFeatureNavigation.module.css';

interface NavigationItem {
  href: string;
  label: string;
  icon: string;
  description: string;
  badge?: string;
}

export default function CrossFeatureNavigation() {
  const pathname = usePathname();
  const { isConnected } = useWallet();

  const navigationItems: NavigationItem[] = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: '📊',
      description: 'Your unified MegaVibe overview'
    },
    {
      href: '/performers',
      label: 'Performers',
      icon: '🎤',
      description: 'Discover and tip amazing performers'
    },
    {
      href: '/bounties',
      label: 'Bounties',
      icon: '🎯',
      description: 'Create and complete creative challenges',
      badge: 'New'
    },
    {
      href: '/content',
      label: 'Content',
      icon: '🎵',
      description: 'Browse and upload performance content'
    },
    {
      href: '/analytics',
      label: 'Analytics',
      icon: '📈',
      description: 'Track your impact and earnings'
    }
  ];

  if (!isConnected) {
    return (
      <nav className={styles.nav}>
        <div className={styles.connectPrompt}>
          <span className={styles.connectIcon}>🔗</span>
          <span>Connect wallet to access all features</span>
        </div>
      </nav>
    );
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.navHeader}>
        <h2 className={styles.navTitle}>MegaVibe</h2>
        <p className={styles.navSubtitle}>Live Performance Economy</p>
      </div>
      
      <div className={styles.navItems}>
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${
              pathname === item.href ? styles.navItemActive : ''
            }`}
          >
            <div className={styles.navItemIcon}>{item.icon}</div>
            <div className={styles.navItemContent}>
              <div className={styles.navItemHeader}>
                <span className={styles.navItemLabel}>{item.label}</span>
                {item.badge && (
                  <span className={styles.navItemBadge}>{item.badge}</span>
                )}
              </div>
              <span className={styles.navItemDescription}>
                {item.description}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className={styles.navFooter}>
        <div className={styles.quickActions}>
          <h3 className={styles.quickActionsTitle}>Quick Actions</h3>
          <div className={styles.quickActionButtons}>
            <Link href="/create" className={styles.quickActionButton}>
              <span className={styles.quickActionIcon}>➕</span>
              <span>Create Event</span>
            </Link>
            <Link href="/upload" className={styles.quickActionButton}>
              <span className={styles.quickActionIcon}>📤</span>
              <span>Upload Content</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}