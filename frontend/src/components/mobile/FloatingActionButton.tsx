"use client";

import React, { useState } from "react";
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
        <button 
          className={`${styles.actionButton} ${styles.tipButton}`}
          onClick={() => {
            onTipPress();
            setIsExpanded(false);
          }}
          aria-label="Quick Tip"
        >
          <span className={styles.icon}>💰</span>
          <span className={styles.label}>Tip</span>
        </button>
        
        <button 
          className={`${styles.actionButton} ${styles.bountyButton}`}
          onClick={() => {
            onBountyPress();
            setIsExpanded(false);
          }}
          aria-label="Create Bounty"
        >
          <span className={styles.icon}>🎯</span>
          <span className={styles.label}>Bounty</span>
        </button>
        
        <button 
          className={`${styles.actionButton} ${styles.scanButton}`}
          onClick={() => {
            onScanPress();
            setIsExpanded(false);
          }}
          aria-label="Scan QR"
        >
          <span className={styles.icon}>📱</span>
          <span className={styles.label}>Scan</span>
        </button>
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