"use client";

import React, { useState, useEffect } from "react";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { realTippingService } from "@/services/blockchain/realTippingService";
import { ProviderType } from "@/services/blockchain/types";
import { PerformerProfile } from "@/services/api/performerService";
import { MOBILE_CONSTANTS } from "@/constants/mobile";
import { hapticFeedback, formatCurrency } from "@/utils/mobile";
import styles from "./OneTapTip.module.css";

interface Performer extends PerformerProfile {
  distance?: string;
  distanceKm?: number;
}

interface OneTapTipProps {
  performer: Performer;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const { TIP_PRESETS, APPROVAL_PRESETS } = MOBILE_CONSTANTS;

export default function OneTapTip({
  performer,
  isOpen,
  onClose,
  onComplete,
}: OneTapTipProps) {
  const { isConnected, connectWallet, balance } = useWalletConnection();
  const [selectedAmount, setSelectedAmount] = useState(5);
  const [approvedAmount, setApprovedAmount] = useState(0);
  const [isApproving, setIsApproving] = useState(false);
  const [isTipping, setIsTipping] = useState(false);
  const [showApprovalSettings, setShowApprovalSettings] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  // Check current approval amount on mount
  useEffect(() => {
    if (isConnected && isOpen) {
      checkApprovalAmount();
    }
  }, [isConnected, isOpen]);

  const checkApprovalAmount = async () => {
    try {
      const approved = await realTippingService.getApprovedAmount();
      setApprovedAmount(approved);
    } catch (error) {
      console.error("Failed to check approval:", error);
    }
  };

  const handleApproval = async (amount: number) => {
    try {
      setIsApproving(true);
      await realTippingService.approveTokens(amount);
      setApprovedAmount(amount);
      hapticFeedback("MEDIUM"); // Success haptic
      setShowApprovalSettings(false);
    } catch (error) {
      console.error("Approval failed:", error);
      hapticFeedback("ERROR"); // Error haptic
    } finally {
      setIsApproving(false);
    }
  };

  const handleOneTapTip = async (amount: number) => {
    if (!isConnected) {
      await connectWallet(ProviderType.METAMASK);
      return;
    }

    // Check if we have enough approval
    if (amount > approvedAmount) {
      setShowApprovalSettings(true);
      return;
    }

    try {
      setIsTipping(true);
      hapticFeedback("LIGHT"); // Immediate feedback

      const result = await realTippingService.sendTip(
        performer.id,
        amount,
        "Quick tip! 🚀"
      );

      // Success haptic
      hapticFeedback("HEAVY");

      // Update approved amount
      setApprovedAmount((prev) => prev - amount);

      onComplete();
    } catch (error) {
      console.error("Tip failed:", error);
      hapticFeedback("ERROR"); // Error haptic
    } finally {
      setIsTipping(false);
    }
  };

  const handlePinchGesture = (e: React.TouchEvent) => {
    // Detect pinch gesture for custom amount
    if (e.touches.length === 2) {
      setShowCustom(true);
    }
  };

  const finalAmount = showCustom
    ? parseFloat(customAmount) || 0
    : selectedAmount;
  const canTip = finalAmount > 0 && finalAmount <= approvedAmount;

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.bottomSheet}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handlePinchGesture}
      >
        <div className={styles.handleBar} />

        <div className={styles.header}>
          <div className={styles.performerInfo}>
            <div className={styles.avatar}>
              {performer.avatar ? (
                <img src={performer.avatar} alt={performer.name} />
              ) : (
                <span>{performer.name[0]}</span>
              )}
            </div>
            <div>
              <h3 className={styles.performerName}>{performer.name}</h3>
              <p className={styles.performerType}>{performer.type}</p>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.content}>
          {/* Approval Status */}
          <div className={styles.approvalStatus}>
            <div className={styles.approvalInfo}>
              <span className={styles.approvalLabel}>Pre-approved:</span>
              <span className={styles.approvalAmount}>${approvedAmount}</span>
            </div>
            <button
              className={styles.settingsButton}
              onClick={() => setShowApprovalSettings(true)}
            >
              ⚙️
            </button>
          </div>

          {/* One-Tap Preset Buttons */}
          <div className={styles.presetGrid}>
            {TIP_PRESETS.map((amount) => (
              <button
                key={amount}
                className={`${styles.presetButton} ${
                  amount > approvedAmount ? styles.needsApproval : ""
                } ${isTipping ? styles.disabled : ""}`}
                onClick={() => handleOneTapTip(amount)}
                disabled={isTipping}
                aria-label={`Tip $${amount}`}
              >
                <span className={styles.currency}>$</span>
                <span className={styles.amount}>{amount}</span>
                {amount > approvedAmount && (
                  <span className={styles.lockIcon}>🔒</span>
                )}
              </button>
            ))}
          </div>

          {/* Custom Amount (Pinch to reveal) */}
          {showCustom && (
            <div className={styles.customSection}>
              <input
                type="number"
                placeholder="Custom amount"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className={styles.customInput}
                autoFocus
              />
              <button
                className={`${styles.customTipButton} ${
                  !canTip ? styles.disabled : ""
                }`}
                onClick={() => handleOneTapTip(finalAmount)}
                disabled={!canTip || isTipping}
              >
                Tip ${finalAmount}
              </button>
            </div>
          )}

          {/* Gesture Hints */}
          <div className={styles.gestureHints}>
            <p>💡 Pinch to enter custom amount</p>
            <p>⚡ One-tap for instant tips</p>
          </div>
        </div>

        {/* Approval Settings Modal */}
        {showApprovalSettings && (
          <div className={styles.approvalModal}>
            <div className={styles.modalContent}>
              <h3>Set Spending Limit</h3>
              <p>Pre-approve tokens for instant tipping</p>

              <div className={styles.approvalGrid}>
                {APPROVAL_PRESETS.map((amount) => (
                  <button
                    key={amount}
                    className={styles.approvalButton}
                    onClick={() => handleApproval(amount)}
                    disabled={isApproving}
                  >
                    ${amount}
                  </button>
                ))}
              </div>

              <button
                className={styles.cancelButton}
                onClick={() => setShowApprovalSettings(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
