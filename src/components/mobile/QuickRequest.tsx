"use client";

import React, { useState, useEffect } from "react";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useEnhancedVoiceInput } from "@/hooks/useVoiceInput";
import {
  realBountyService,
  BountyResult,
} from "@/services/blockchain/realBountyService";
import {
  TransactionError,
  GasEstimate,
} from "@/services/blockchain/transactionService";
import { ProviderType } from "@/services/blockchain/types";
import { PerformerProfile } from "@/services/api/performerService";
import styles from "./QuickRequest.module.css";

interface Performer extends PerformerProfile {
  distance?: string;
  distanceKm?: number;
}

interface QuickRequestProps {
  performer: Performer;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const REQUEST_TYPES = [
  {
    id: "song",
    icon: "🎵",
    title: "Play my song",
    description: "Request a specific song",
    placeholder: "Song name or artist",
  },
  {
    id: "performance",
    icon: "🎭",
    title: "Custom performance",
    description: "Request a unique act",
    placeholder: "Describe what you'd like",
  },
  {
    id: "encore",
    icon: "🔄",
    title: "Encore/Repeat",
    description: "Do that again!",
    placeholder: "What to repeat",
  },
  {
    id: "shoutout",
    icon: "📢",
    title: "Shoutout",
    description: "Personal message/dedication",
    placeholder: "Message or name",
  },
];

const PRESET_AMOUNTS = [10, 15, 25, 50];

export default function QuickRequest({
  performer,
  isOpen,
  onClose,
  onComplete,
}: QuickRequestProps) {
  const { walletInfo, connect } = useWalletConnection();
  const isConnected = walletInfo.isConnected;
  const connectWallet = connect;
  const balance = walletInfo.balance?.formatted || '0';
  const [selectedType, setSelectedType] = useState(REQUEST_TYPES[0]);
  const [requestText, setRequestText] = useState("");
  const [selectedAmount, setSelectedAmount] = useState(15);
  const [customAmount, setCustomAmount] = useState("");
  const [showCustomAmount, setShowCustomAmount] = useState(false);
  const [sending, setSending] = useState(false);
  const [gasEstimate, setGasEstimate] = useState<GasEstimate | null>(null);
  const [transactionError, setTransactionError] =
    useState<TransactionError | null>(null);
  const [transactionResult, setTransactionResult] =
    useState<BountyResult | null>(null);
  const [estimatingGas, setEstimatingGas] = useState(false);

  // Calculate final amount early to avoid hoisting issues
  const finalAmount = showCustomAmount
    ? parseFloat(customAmount) || 0
    : selectedAmount;

  const {
    isListening,
    isSupported: isVoiceSupported,
    transcript,
    error: voiceError,
    startListeningWithNoiseFilter,
    stopListening,
    processTranscriptForVenue,
    resetTranscript,
  } = useEnhancedVoiceInput();

  if (!isOpen) return null;

  const handleVoiceInput = () => {
    if (!isVoiceSupported) {
      alert("Voice input not supported in this browser");
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListeningWithNoiseFilter({
        language: "en-US",
        continuous: false,
        interimResults: true,
      });
    }
  };

  // Update request text when voice transcript changes
  useEffect(() => {
    if (transcript && !isListening) {
      const cleanedTranscript = processTranscriptForVenue(transcript);
      if (cleanedTranscript) {
        setRequestText(cleanedTranscript);
      }
    }
  }, [transcript, isListening, processTranscriptForVenue]);

  // Estimate gas when amount or request details change
  useEffect(() => {
    if (isOpen && finalAmount > 0 && requestText.trim().length > 0) {
      estimateGas();
    }
  }, [finalAmount, requestText, selectedType, isOpen]);

  const estimateGas = async () => {
    try {
      setEstimatingGas(true);
      setTransactionError(null);

      const estimate = await realBountyService.estimateBountyGas(
        performer.id,
        selectedType.id,
        requestText,
        finalAmount
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
          await connectWallet('metamask' as any);
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

      // Validate bounty request
      const validation = await realBountyService.validateBountyRequest(
        performer.id,
        selectedType.id,
        requestText,
        finalAmount
      );

      if (!validation.valid) {
        setTransactionError({
          type: "contract_error",
          message: validation.error || "Invalid bounty request",
          retryable: false,
          suggestedAction: "Please check your request details",
        });
        setSending(false);
        return;
      }

      // Create the bounty
      const result = await realBountyService.createBounty(
        performer.id,
        selectedType.id,
        requestText,
        finalAmount
      );

      setTransactionResult(result);

      // Show immediate success feedback
      navigator.vibrate?.(200);

      // Wait for confirmation in background
      monitorTransaction(result.txHash);
    } catch (error) {
      console.error("Bounty creation failed:", error);
      setTransactionError(error as TransactionError);
      setSending(false);
    }
  };

  const monitorTransaction = async (txHash: string) => {
    try {
      // Wait for transaction confirmation
      const confirmedResult = await realBountyService.getBountyStatus(txHash);

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
    requestText.trim().length > 0 &&
    finalAmount > 0 &&
    (!isConnected || parseFloat(balance) >= finalAmount);

  return (
    <div className={styles.overlay}>
      <div className={styles.bottomSheet}>
        <div className={styles.handleBar} />

        {/* Header */}
        <div className={styles.header}>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
          <h2 className={styles.title}>Request from {performer.name}</h2>
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

        {/* Request Type Selection */}
        <div className={styles.typeSection}>
          <h3 className={styles.sectionTitle}>What would you like?</h3>
          <div className={styles.requestTypes}>
            {REQUEST_TYPES.map((type) => (
              <button
                key={type.id}
                className={`${styles.typeButton} ${
                  selectedType.id === type.id ? styles.selectedType : ""
                }`}
                onClick={() => setSelectedType(type)}
              >
                <span className={styles.typeIcon}>{type.icon}</span>
                <div className={styles.typeText}>
                  <span className={styles.typeTitle}>{type.title}</span>
                  <span className={styles.typeDescription}>
                    {type.description}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Request Details */}
        <div className={styles.detailsSection}>
          <h3 className={styles.sectionTitle}>Details</h3>
          <div className={styles.inputContainer}>
            <textarea
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              placeholder={selectedType.placeholder}
              className={styles.requestInput}
              rows={3}
              maxLength={200}
            />
            <button
              className={`${styles.voiceButton} ${
                isListening ? styles.listening : ""
              } ${!isVoiceSupported ? styles.disabled : ""}`}
              onClick={handleVoiceInput}
              disabled={!isVoiceSupported}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? "🔴" : "🎤"}
            </button>
          </div>
          <div className={styles.characterCount}>{requestText.length}/200</div>
        </div>

        {/* Amount Selection */}
        <div className={styles.amountSection}>
          <h3 className={styles.sectionTitle}>Offer Amount</h3>

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
            <div className={styles.totalCost}>
              <span>
                Total: ~
                {(finalAmount + parseFloat(gasEstimate.estimatedCost)).toFixed(
                  4
                )}{" "}
                ETH
              </span>
            </div>
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
              <h4 className={styles.successTitle}>Request Created!</h4>
              <p className={styles.successMessage}>
                Your ${finalAmount} {selectedType.title.toLowerCase()} request
                is being processed
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
            <p>
              💡 Wallet will connect automatically when you create the request
            </p>
          </div>
        )}

        {isConnected && !transactionResult && (
          <div className={styles.walletInfo}>
            <span>Balance: {balance} MNT</span>
            {finalAmount > parseFloat(balance) && (
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
              {transactionResult ? "Confirming..." : "Creating..."}
            </span>
          ) : transactionResult ? (
            "Close"
          ) : transactionError ? (
            "Retry Transaction"
          ) : (
            `${
              isConnected ? "Create" : "Connect & Create"
            } $${finalAmount} Request`
          )}
        </button>
      </div>
    </div>
  );
}
