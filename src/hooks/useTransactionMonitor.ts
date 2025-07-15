import { useState, useEffect, useCallback } from 'react';
import { transactionService, TransactionResult } from '@/services/blockchain/transactionService';

interface UseTransactionMonitorProps {
  txHash?: string;
  onConfirmed?: (result: TransactionResult) => void;
  onFailed?: (result: TransactionResult) => void;
  confirmations?: number;
}

interface UseTransactionMonitorReturn {
  status: 'idle' | 'pending' | 'confirmed' | 'failed';
  result: TransactionResult | null;
  error: string | null;
  confirmationCount: number;
  estimatedTime: string | null;
}

export function useTransactionMonitor({
  txHash,
  onConfirmed,
  onFailed,
  confirmations = 1
}: UseTransactionMonitorProps): UseTransactionMonitorReturn {
  const [status, setStatus] = useState<'idle' | 'pending' | 'confirmed' | 'failed'>('idle');
  const [result, setResult] = useState<TransactionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmationCount, setConfirmationCount] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);

  const monitorTransaction = useCallback(async (hash: string) => {
    try {
      setStatus('pending');
      setError(null);
      setEstimatedTime('~30 seconds'); // Rough estimate

      // Poll for transaction status
      const pollInterval = setInterval(async () => {
        try {
          const txResult = await transactionService.getTransactionStatus(hash);
          setResult(txResult);

          if (txResult.status === 'confirmed') {
            setStatus('confirmed');
            setConfirmationCount(confirmations);
            setEstimatedTime(null);
            clearInterval(pollInterval);
            onConfirmed?.(txResult);
          } else if (txResult.status === 'failed') {
            setStatus('failed');
            setEstimatedTime(null);
            clearInterval(pollInterval);
            onFailed?.(txResult);
          }
          // Continue polling if still pending
        } catch (pollError) {
          console.error('Transaction polling error:', pollError);
          setError('Failed to check transaction status');
          clearInterval(pollInterval);
        }
      }, 3000); // Poll every 3 seconds

      // Cleanup after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (status === 'pending') {
          setError('Transaction monitoring timed out');
        }
      }, 300000);

      return () => clearInterval(pollInterval);
    } catch (monitorError) {
      console.error('Transaction monitoring failed:', monitorError);
      setError('Failed to monitor transaction');
      setStatus('failed');
    }
  }, [confirmations, onConfirmed, onFailed, status]);

  useEffect(() => {
    if (txHash && txHash.length > 0) {
      monitorTransaction(txHash);
    }
  }, [txHash, monitorTransaction]);

  return {
    status,
    result,
    error,
    confirmationCount,
    estimatedTime
  };
}

// Utility hook for batch transaction monitoring
export function useBatchTransactionMonitor() {
  const [transactions, setTransactions] = useState<Map<string, TransactionResult>>(new Map());
  const [pendingCount, setPendingCount] = useState(0);

  const addTransaction = useCallback((txHash: string, initialResult: TransactionResult) => {
    setTransactions(prev => new Map(prev.set(txHash, initialResult)));
    if (initialResult.status === 'pending') {
      setPendingCount(prev => prev + 1);
    }
  }, []);

  const updateTransaction = useCallback((txHash: string, result: TransactionResult) => {
    setTransactions(prev => {
      const updated = new Map(prev);
      const oldResult = updated.get(txHash);
      
      if (oldResult?.status === 'pending' && result.status !== 'pending') {
        setPendingCount(count => Math.max(0, count - 1));
      }
      
      updated.set(txHash, result);
      return updated;
    });
  }, []);

  const getTransaction = useCallback((txHash: string) => {
    return transactions.get(txHash);
  }, [transactions]);

  const getAllTransactions = useCallback(() => {
    return Array.from(transactions.values());
  }, [transactions]);

  const getPendingTransactions = useCallback(() => {
    return Array.from(transactions.values()).filter(tx => tx.status === 'pending');
  }, [transactions]);

  return {
    addTransaction,
    updateTransaction,
    getTransaction,
    getAllTransactions,
    getPendingTransactions,
    pendingCount,
    totalCount: transactions.size
  };
}