"use client";

import React, { useState, useEffect } from "react";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import {
  realTippingService,
  TipResult,
} from "@/services/blockchain/realTippingService";
import {
  TransactionError,
  GasEstimate,
} from "@/services/blockchain/transactionService";
import { ProviderType } from "@/services/blockchain/types"; // Import ProviderType
import styles from "./QuickTip.module.css";

import { PerformerProfile } from "@/services/api/performerService";

interface Performer extends PerformerProfile {
  distance?: string;
  distanceKm?: number;
}

interface QuickTipProps {
  performer: Performer;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const PRESET_AMOUNTS = [1, 5, 10, 20];
const QUICK_MESSAGES = [
  "Great performance! 🎭",
  "Amazing! 🔥",
  "Keep it up! 💪",
  "Loved it! ❤️",
];

export default function QuickTip({
  performer,
  isOpen,
  onClose,
  onComplete,
}: QuickTipProps) {
  const { isConnected, connectWallet, balance } = useWalletConnection();
  const [selectedAmount, setSelectedAmount] = useState(5);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showCustomAmount, setShowCustomAmount] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [gasEstimate, setGasEstimate] = useState<GasEstimate | null>(null);
  const [transactionError, setTransactionError] =
    useState<TransactionError | null>(null);
  const [transactionResult, setTransactionResult] = useState<TipResult | null>(
    null
  );
  const [estimatingGas, setEstimatingGas] = useState(false);

  const finalAmount = showCustomAmount // Move declaration here
    ? parseFloat(customAmount) || 0
    : selectedAmount;

  if (!isOpen) return null;

  // Estimate gas when amount changes
  useEffect(() => {
    if (isOpen && finalAmount > 0) {
      estimateGas();
    }
  }, [finalAmount, isOpen]);

  const estimateGas = async () => {
    try {
      setEstimatingGas(true);
      setTransactionError(null);

      const estimate = await realTippingService.estimateTipGas(
        performer.id,
        finalAmount,
        message
      );

      setGasEstimate(estimate);
    } catch (error) {
      console.error("Gas estimation failed:", error);
      setTransactionError(error as TransactionError);
    } finally {
      setEstimatingGas(false);
    }
  };

  const handleSend = async () => {
    try {
      setTransactionError(null);
      setSending(true);

      // Connect wallet if not connected
      if (!isConnected) {
        try {
          await connectWallet(ProviderType.METAMASK); // Use ProviderType enum
        } catch (error) {
          setTransactionError({
            type: "user_rejected",
            message: "Wallet connection was rejected",
            retryable: true,
            suggestedAction: "Please connect your wallet to continue",
          });
          setSending(false);
          return;
        }
      }

      // Validate performer
      const isValidPerformer = await realTippingService.validatePerformer(
        performer.id
      );
      if (!isValidPerformer) {
        setTransactionError({
          type: "contract_error",
          message: "Invalid performer",
          retryable: false,
          suggestedAction: "Please select a valid performer",
        });
        setSending(false);
        return;
      }

      // Send the tip
      const result = await realTippingService.sendTip(
        performer.id,
        finalAmount,
        message
      );

      setTransactionResult(result);

      // Show immediate success feedback
      navigator.vibrate?.(200);

      // Wait for confirmation in background
      monitorTransaction(result.txHash);
    } catch (error) {
      console.error("Tip failed:", error);
      setTransactionError(error as TransactionError);
      setSending(false);
    }
  };

  const monitorTransaction = async (txHash: string) => {
    try {
      // Wait for transaction confirmation
      const confirmedResult = await realTippingService.getTipStatus(txHash);

      if (confirmedResult?.status === "confirmed") {
        // Transaction confirmed successfully
        setSending(false);
        onComplete();
      } else if (confirmedResult?.status === "failed") {
        // Transaction failed
        setTransactionError({
          type: "contract_error",
          message: "Transaction failed on blockchain",
          retryable: true,
          suggestedAction: "Please try again",
        });
        setSending(false);
      }
      // If still pending, we'll show the pending state
    } catch (error) {
      console.error("Transaction monitoring failed:", error);
      setSending(false);
    }
  };

  const handleRetry = () => {
    setTransactionError(null);
    setTransactionResult(null);
    handleSend();
  };

  const canSend =
    finalAmount > 0 &&
    (!isConnected || parseFloat(balance.formatted) >= finalAmount);

  return (
    <div className={styles.overlay}>
      <div className={styles.bottomSheet}>
        {/* Handle bar for gesture indication */}
        <div className={styles.handleBar} />

        {/* Header */}
        <div className={styles.header}>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
          <h2 className={styles.title}>Tip {performer.name}</h2>
          <div className={styles.headerSpacer} />
        </div>

        {/* Performer Info */}
        <div className={styles.performerInfo}>
          <div className={styles.performerAvatar}>
            {performer.avatar ? (
              <img src={performer.avatar} alt={performer.name} />
            ) : (
              <span className={styles.avatarPlaceholder}>🎭</span>
            )}
          </div>
          <div className={styles.performerDetails}>
            <h3 className={styles.performerName}>{performer.name}</h3>
            <p className={styles.performerType}>{performer.type}</p>
            <p className={styles.performerLocation}>
              📍 {performer.location.address}
            </p>
          </div>
        </div>

        {/* Amount Selection */}
        <div className={styles.amountSection}>
          <h3 className={styles.sectionTitle}>Amount</h3>

          {!showCustomAmount ? (
            <div className={styles.presetAmounts}>
              {PRESET_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  className={`${styles.amountButton} ${
                    selectedAmount === amount ? styles.selectedAmount : ""
                  }`}
                  onClick={() => setSelectedAmount(amount)}
                >
                  ${amount}
                </button>
              ))}
              <button
                className={styles.customAmountButton}
                onClick={() => setShowCustomAmount(true)}
              >
                Custom
              </button>
            </div>
          ) : (
            <div className={styles.customAmountInput}>
              <div className={styles.inputWrapper}>
                <span className={styles.dollarSign}>$</span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="0"
                  className={styles.amountInput}
                  autoFocus
                />
              </div>
              <button
                className={styles.backToPresets}
                onClick={() => {
                  setShowCustomAmount(false);
                  setCustomAmount("");
                }}
              >
                Back to presets
              </button>
            </div>
          )}
        </div>

        {/* Message Section */}
        <div className={styles.messageSection}>
          <h3 className={styles.sectionTitle}>Message (optional)</h3>

          <div className={styles.quickMessages}>
            {QUICK_MESSAGES.map((quickMessage) => (
              <button
                key={quickMessage}
                className={`${styles.quickMessageButton} ${
                  message === quickMessage ? styles.selectedMessage : ""
                }`}
                onClick={() =>
                  setMessage(message === quickMessage ? "" : quickMessage)
                }
              >
                {quickMessage}
              </button>
            ))}
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a personal message..."
            className={styles.messageInput}
            rows={2}
            maxLength={100}
          />
          <div className={styles.characterCount}>{message.length}/100</div>
        </div>

        {/* Gas Estimate */}
        {gasEstimate && !transactionError && (
          <div className={styles.gasEstimate}>
            <div className={styles.gasInfo}>
              <span>Network fee: ~{gasEstimate.estimatedCost} ETH</span>
              {gasEstimate.estimatedCostUSD && (
                <span className={styles.gasUSD}>
                  (${gasEstimate.estimatedCostUSD})
                </span>
              )}
            </div>
            {gasEstimate && (
              <div className={styles.totalCost}>
                <span>
                  Total: ~
                  {(
                    finalAmount + parseFloat(gasEstimate.estimatedCost)
                  ).toFixed(4)}{" "}
                  ETH
                </span>
              </div>
            )}
          </div>
        )}

        {/* Transaction Error */}
        {transactionError && (
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>⚠️</div>
            <div className={styles.errorContent}>
              <h4 className={styles.errorTitle}>Transaction Error</h4>
              <p className={styles.errorMessage}>{transactionError.message}</p>
              {transactionError.suggestedAction && (
                <p className={styles.errorAction}>
                  {transactionError.suggestedAction}
                </p>
              )}
              {transactionError.retryable && (
                <button className={styles.retryButton} onClick={handleRetry}>
                  Try Again
                </button>
              )}
            </div>
          </div>
        )}

        {/* Transaction Success */}
        {transactionResult && !transactionError && (
          <div className={styles.successContainer}>
            <div className={styles.successIcon}>✅</div>
            <div className={styles.successContent}>
              <h4 className={styles.successTitle}>Tip Sent!</h4>
              <p className={styles.successMessage}>
                Your ${finalAmount} tip is being processed
              </p>
              <a
                href={`https://etherscan.io/tx/${transactionResult.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.txLink}
              >
                View on Etherscan
              </a>
            </div>
          </div>
        )}

        {/* Wallet Status */}
        {!isConnected && !transactionError && (
          <div className={styles.walletPrompt}>
            <p>💡 Wallet will connect automatically when you send the tip</p>
          </div>
        )}

        {isConnected && !transactionResult && (
          <div className={styles.walletInfo}>
            <span>Balance: {balance.formatted} MNT</span>
            {finalAmount > parseFloat(balance.formatted) && (
              <span className={styles.insufficientFunds}>
                Insufficient funds
              </span>
            )}
          </div>
        )}

        {/* Send Button */}
        <button
          className={`${styles.sendButton} ${
            !canSend ? styles.disabledButton : ""
          } ${transactionResult ? styles.successButton : ""}`}
          onClick={transactionResult ? onClose : handleSend}
          disabled={!canSend || sending || estimatingGas}
        >
          {estimatingGas ? (
            <span className={styles.sendingState}>
              <span className={styles.spinner} />
              Estimating fees...
            </span>
          ) : sending ? (
            <span className={styles.sendingState}>
              <span className={styles.spinner} />
              {transactionResult ? "Confirming..." : "Sending..."}
            </span>
          ) : transactionResult ? (
            "Close"
          ) : transactionError ? (
            "Retry Transaction"
          ) : (
            `${isConnected ? "Send" : "Connect & Send"} $${finalAmount} Tip`
          )}
        </button>
      </div>
    </div>
  );
}
