"use client";

import React, { useState } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { PerformerProfile } from "@/services/api/performerService";
import OptimizedMobileNavigation from "../navigation/OptimizedMobileNavigation";
import MobileTopBar from "./MobileTopBar";
import FloatingActionButton from "./FloatingActionButton";
import OneTapTip from "./OneTapTip";
import PhotoFirstBounty from "./PhotoFirstBounty";
import QRScanner from "./QRScanner";
import styles from "./MobileLayout.module.css";

interface MobileLayoutProps {
  children: React.ReactNode;
}

interface Performer extends PerformerProfile {
  distance?: string;
  distanceKm?: number;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [showTipModal, setShowTipModal] = useState(false);
  const [showBountyModal, setShowBountyModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [selectedPerformer, setSelectedPerformer] = useState<Performer | null>(
    null
  );

  if (!isMobile) {
    // Return children without mobile wrapper for desktop
    return <>{children}</>;
  }

  const handleTipComplete = () => {
    setShowTipModal(false);
    // Show success feedback
    navigator.vibrate?.(200);
  };

  const handleBountyComplete = () => {
    setShowBountyModal(false);
    // Show success feedback
    navigator.vibrate?.(200);
  };

  const handleQRScan = (result: string) => {
    setShowQRScanner(false);
    console.log("QR Scanned:", result);
    // Handle QR scan result
  };

  return (
    <div className={styles.mobileContainer}>
      <MobileTopBar />
      <main className={styles.mobileContent}>{children}</main>
      <OptimizedMobileNavigation />

      {/* Floating Action Button */}
      <FloatingActionButton
        onTipPress={() => selectedPerformer && setShowTipModal(true)}
        onBountyPress={() => setShowBountyModal(true)}
        onScanPress={() => setShowQRScanner(true)}
      />

      {/* Modals */}
      {selectedPerformer && (
        <OneTapTip
          performer={selectedPerformer}
          isOpen={showTipModal}
          onClose={() => setShowTipModal(false)}
          onComplete={handleTipComplete}
        />
      )}

      <PhotoFirstBounty
        isOpen={showBountyModal}
        onClose={() => setShowBountyModal(false)}
        onComplete={handleBountyComplete}
      />

      <QRScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScan}
      />
    </div>
  );
}
