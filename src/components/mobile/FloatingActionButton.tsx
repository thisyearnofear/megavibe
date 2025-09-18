"use client";

import React, { useState } from "react";
import Button from "@/components/shared/Button";
import styles from "./FloatingActionButton.module.css";

interface FABProps {
  onTipPress: () => void;
  onBountyPress: () => void;
  onScanPress: () => void;
}

export default function FloatingActionButton({ onTipPress, onBountyPress, onScanPress }: FABProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  return (
    <div className={styles.fabContainer}>
      {/* Backdrop */}
      {isExpanded && (
        <div 
          className={styles.backdrop} 
          onClick={() => setIsExpanded(false)}
        />
      )}
      
      {/* Action buttons */}
      <div className={`${styles.actionButtons} ${isExpanded ? styles.expanded : ''}`}>
        <Button 
          variant="tip"
          size="sm"
          className={`${styles.actionButton} ${styles.tipButton}`}
          onClick={() => {
            onTipPress();
            setIsExpanded(false);
          }}
          aria-label="Quick Tip"
          leftIcon="💰"
        >
          Tip
        </Button>
        
        <Button 
          variant="bounty"
          size="sm"
          className={`${styles.actionButton} ${styles.bountyButton}`}
          onClick={() => {
            onBountyPress();
            setIsExpanded(false);
          }}
          aria-label="Create Bounty"
          leftIcon="🎯"
        >
          Bounty
        </Button>
        
        <Button 
          variant="secondary"
          size="sm"
          className={`${styles.actionButton} ${styles.scanButton}`}
          onClick={() => {
            onScanPress();
            setIsExpanded(false);
          }}
          aria-label="Scan QR"
          leftIcon="📱"
        >
          Scan
        </Button>
      </div>
      
      {/* Main FAB */}
      <button 
        className={`${styles.fab} ${isExpanded ? styles.fabExpanded : ''}`}
        onClick={toggleExpanded}
        aria-label="Actions"
      >
        <span className={`${styles.fabIcon} ${isExpanded ? styles.rotated : ''}`}>
          {isExpanded ? '✕' : '+'}
        </span>
      </button>
    </div>
  );
}