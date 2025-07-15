import React, { useState, useEffect, useCallback } from "react";
import { Transaction, TransactionStatus } from "@/services/blockchain/types";
import { getNetworkConfig } from "@/contracts/config";
import styles from "./TransactionMonitor.module.css";

interface TransactionNotification extends Transaction {
  id: string;
  title: string;
  message: string;
  exiting?: boolean;
  chainId?: number;
}

interface TransactionMonitorProps {
  transactions: TransactionNotification[];
  onDismiss: (id: string) => void;
  onViewExplorer: (hash: string, chainId: number) => void;
}

// Simple status icons using HTML/CSS instead of an icon library
const StatusIcon: React.FC<{ status: TransactionStatus }> = ({ status }) => {
  switch (status) {
    case TransactionStatus.PENDING:
      return <div className={`${styles.statusIcon} ${styles.pending}`}>⏳</div>;
    case TransactionStatus.CONFIRMED:
      return (
        <div className={`${styles.statusIcon} ${styles.confirmed}`}>✓</div>
      );
    case TransactionStatus.FAILED:
      return <div className={`${styles.statusIcon} ${styles.failed}`}>✗</div>;
    default:
      return <div className={`${styles.statusIcon} ${styles.pending}`}>⏳</div>;
  }
};

export const TransactionMonitor: React.FC<TransactionMonitorProps> = ({
  transactions,
  onDismiss,
  onViewExplorer,
}) => {
  if (transactions.length === 0) {
    return <div className={styles.emptyMessage}></div>;
  }

  return (
    <div className={styles.transactionContainer}>
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className={`${styles.transactionItem} ${
            tx.exiting ? styles.exiting : ""
          }`}
        >
          <StatusIcon status={tx.status} />

          <div className={styles.content}>
            <h3 className={styles.title}>{tx.title}</h3>
            <p className={styles.message}>{tx.message}</p>

            {tx.hash && (
              <button
                className={styles.link}
                onClick={() => onViewExplorer(tx.hash, tx.chainId || 5003)} // Default to Mantle Sepolia if chainId not provided
              >
                View on Explorer <span className={styles.linkIcon}>↗</span>
              </button>
            )}
          </div>

          <button
            className={styles.closeButton}
            onClick={() => onDismiss(tx.id)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

// Hook to manage transaction notifications
export function useTransactionMonitor() {
  const [transactions, setTransactions] = useState<TransactionNotification[]>(
    []
  );

  // Add a new transaction notification
  const addTransaction = useCallback(
    (transaction: Transaction, title: string, message: string) => {
      const id = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      setTransactions((prev) => [
        ...prev,
        {
          ...transaction,
          id,
          title,
          message,
        },
      ]);

      return id;
    },
    []
  );

  // Update a transaction's status
  const updateTransaction = useCallback(
    (id: string, updates: Partial<TransactionNotification>) => {
      setTransactions((prev) =>
        prev.map((tx) => (tx.id === id ? { ...tx, ...updates } : tx))
      );
    },
    []
  );

  // Mark a transaction as exiting before removal
  const dismissTransaction = useCallback((id: string) => {
    // First mark as exiting for animation
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, exiting: true } : tx))
    );

    // Then remove after animation completes
    setTimeout(() => {
      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    }, 300); // Match animation duration
  }, []);

  // Open transaction in block explorer
  const viewOnExplorer = useCallback((hash: string, chainId: number) => {
    const network = getNetworkConfig(chainId);
    if (network && network.blockExplorerUrl) {
      window.open(`${network.blockExplorerUrl}/tx/${hash}`, "_blank");
    }
  }, []);

  return {
    transactions,
    addTransaction,
    updateTransaction,
    dismissTransaction,
    viewOnExplorer,
  };
}

export default TransactionMonitor;
