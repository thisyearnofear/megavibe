/**
 * useCrossChain.ts
 * 
 * Custom hook for managing cross-chain transactions in React components.
 * Provides an interface to interact with CrossChainService and CrossChainStateService.
 */

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import CrossChainService, { CrossChainStatus, StatusCallback } from '../services/core/CrossChainService';
import CrossChainStateService, { CrossChainTransaction } from '../services/state/CrossChainStateService';
import StateService, { useAppSelector } from '../services/core/StateService';
import ValidationService from '../services/core/ValidationService';
import ErrorHandlingService from '../services/core/ErrorHandlingService';

export interface UseCrossChainProps {
  onSuccess?: (txId: string, txHash: string) => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: string, progress: number) => void;
}

export interface CrossChainSendParams {
  sourceChainId: number;
  recipientAddress: string;
  amountUSD: number;
  message?: string;
  eventId?: string;
  speakerId?: string;
}

export function useCrossChain(props?: UseCrossChainProps) {
  const { onSuccess, onError, onStatusChange } = props || {};

  // Local state for the current transaction
  const [currentTxId, setCurrentTxId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Get transactions from state
  const transactions = useAppSelector((state: any) =>
    state.crosschain?.transactions || []);
  
  const pendingTransactions = useAppSelector((state: any) => {
    const selector = CrossChainStateService.getSelectors().getPendingTransactions;
    return selector(state);
  });

  /**
   * Send a cross-chain transaction
   */
  const sendTransaction = useCallback(async (params: CrossChainSendParams) => {
    try {
      // Reset state
      setError(null);
      setProgress(0);
      setIsProcessing(true);

      // Validate input
      if (!ValidationService.isValidAddress(params.recipientAddress)) {
        throw new Error('Invalid recipient address');
      }

      if (!ValidationService.isPositiveNumber(params.amountUSD)) {
        throw new Error('Amount must be a positive number');
      }

      // Generate transaction ID
      const txId = uuidv4();
      setCurrentTxId(txId);

      // Create a status callback function
      const statusCallback: StatusCallback = (status) => {
        // Update progress from the status object
        if (status.progress !== undefined) {
          setProgress(status.progress);
          if (onStatusChange) {
            onStatusChange(status.status, status.progress);
          }
        }
      };

      // Add transaction to state
      CrossChainStateService.addTransaction({
        id: txId,
        sourceChain: params.sourceChainId,
        destinationChain: 0, // Will be set later when known
        amount: params.amountUSD,
        recipientAddress: params.recipientAddress,
        status: CrossChainStatus.PENDING,
        message: params.message,
        eventId: params.eventId,
        speakerId: params.speakerId,
        timestamp: Date.now()
      });

      // Send the transaction
      const result = await CrossChainService.sendCrossChainTip(
        params.sourceChainId,
        params.recipientAddress,
        params.amountUSD,
        params.message || '',
        params.eventId || '',
        params.speakerId || '',
        statusCallback
      );

      // Update transaction in state
      if (result.txHash) {
        CrossChainStateService.updateTransaction(txId, {
          txHash: result.txHash,
          // We don't have destinationChainId in the result, so we'll use the current chain
          status: result.success ? CrossChainStatus.COMPLETED : CrossChainStatus.FAILED
        });
      }

      // Handle success callback
      if (result.success && result.txHash && onSuccess) {
        onSuccess(txId, result.txHash);
      }

      return { txId, ...result };
    } catch (err) {
      // Handle error
      const error = err as Error;
      setError(error.message);
      
      // Log the error
      ErrorHandlingService.handleError({
        service: 'CrossChainHook',
        operation: 'sendTransaction',
        error,
        level: 'error'
      });

      // Update transaction status if a transaction was created
      if (currentTxId) {
        CrossChainStateService.updateTransaction(currentTxId, {
          status: CrossChainStatus.FAILED,
          error: error.message
        });
      }

      // Call error callback
      if (onError) {
        onError(error);
      }

      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [onSuccess, onError, onStatusChange, currentTxId]);

  /**
   * Check status of all pending transactions
   */
  const checkPendingTransactions = useCallback(async () => {
    try {
      await CrossChainStateService.checkPendingTransactions();
    } catch (error) {
      console.error('Failed to check pending transactions', error);
    }
  }, []);

  /**
   * Get transaction details by ID
   */
  const getTransaction = useCallback((id: string): CrossChainTransaction | undefined => {
    return CrossChainStateService.getTransactionById(id);
  }, []);

  /**
   * Retry a failed transaction
   */
  const retryTransaction = useCallback(async (txId: string) => {
    try {
      const tx = CrossChainStateService.getTransactionById(txId);
      if (!tx) {
        throw new Error('Transaction not found');
      }

      if (tx.status !== CrossChainStatus.FAILED) {
        throw new Error('Only failed transactions can be retried');
      }

      // Update transaction status
      CrossChainStateService.updateTransaction(txId, {
        status: CrossChainStatus.PENDING,
        error: undefined
      });

      // Retry the transaction
      return await sendTransaction({
        sourceChainId: tx.sourceChain,
        recipientAddress: tx.recipientAddress,
        amountUSD: tx.amount,
        message: tx.message,
        eventId: tx.eventId,
        speakerId: tx.speakerId
      });
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      
      // Call error callback
      if (onError) {
        onError(error);
      }
      
      throw error;
    }
  }, [sendTransaction, onError]);

  // Check pending transactions periodically
  useEffect(() => {
    // Initialize CrossChainStateService
    CrossChainStateService.initialize().catch(console.error);

    // Set up periodic checking of pending transactions
    const interval = setInterval(() => {
      if (pendingTransactions.length > 0) {
        checkPendingTransactions();
      }
    }, 15000); // Check every 15 seconds
    
    return () => {
      clearInterval(interval);
    };
  }, [pendingTransactions.length, checkPendingTransactions]);

  // Return the hook's interface
  return {
    sendTransaction,
    transactions,
    pendingTransactions,
    currentTxId,
    isProcessing,
    error,
    progress,
    getTransaction,
    retryTransaction,
    checkPendingTransactions
  };
}

export default useCrossChain;