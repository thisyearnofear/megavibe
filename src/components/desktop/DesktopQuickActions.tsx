"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import QuickTip from '@/components/mobile/QuickTip'; // Reusing existing modal
import QuickRequest from '@/components/mobile/QuickRequest'; // Reusing existing modal
import { PerformerProfile } from '@/services/api/performerService'; // For mock performer
import styles from './DesktopQuickActions.module.css';

const DesktopQuickActions = () => {
  const [showTipModal, setShowTipModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Mock performer for demonstration purposes
  const mockPerformer: PerformerProfile = {
    id: "mock_performer_desktop",
    name: "Desktop Demo Performer",
    type: "Musician",
    description: "A performer for desktop testing",
    genres: ["Pop"],
    location: { lat: 0, lng: 0, address: "" },
    status: "live",
    preferences: {
      acceptsTips: true,
      acceptsRequests: true,
      requestTypes: [],
      minimumTip: 1,
      minimumRequest: 1
    },
    socialLinks: {},
    stats: {
      totalEarnings: 0,
      totalTips: 0,
      totalRequests: 0,
      averageRating: 0,
      performanceCount: 0
    },
    createdAt: Date.now(),
    lastActiveAt: Date.now()
  };

  return (
    <div className={styles.quickActionsContainer}>
      <h2 className={styles.title}>Quick Actions</h2>
      <div className={styles.actionsGrid}>
        <button className={styles.actionButton} onClick={() => setShowTipModal(true)}>
          💰 Quick Tip
        </button>
        <button className={styles.actionButton} onClick={() => setShowRequestModal(true)}>
          🎯 Quick Request
        </button>
        <Link href="/create" className={styles.actionButton}>
          ✨ Create Content
        </Link>
      </div>

      {/* Modals for Tip and Request */}
      <QuickTip
        performer={mockPerformer}
        isOpen={showTipModal}
        onClose={() => setShowTipModal(false)}
        onComplete={() => setShowTipModal(false)}
      />
      <QuickRequest
        performer={mockPerformer}
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onComplete={() => setShowRequestModal(false)}
      />
    </div>
  );
};

export default DesktopQuickActions;
