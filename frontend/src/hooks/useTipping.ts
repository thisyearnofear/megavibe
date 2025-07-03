/**
 * useTipping.ts
 * 
 * Custom hook for tipping functionality, providing a clean interface
 * for components to interact with the TippingStateService.
 */

import { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import TippingStateService from '../services/state/TippingStateService';
import { RootState, Tip, PendingTip, AppDispatch } from '../services/core/StateService';
import { useAppSelector } from '../services/core/StateService';
import { CrossChainStatus } from '../services/core/CrossChainService';
import useCrossChain from './useCrossChain';

interface TippingParams {
  recipientAddress: string;
  amount: number;
  eventId: string;
  speakerId: string;
  message?: string;
  sourceChainId?: number;  // Optional source chain ID for cross-chain tips
}

interface TipResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface TipStatistics {
  totalSent: number;
  totalReceived: number;
  lastUpdated: number;
}

interface WithdrawResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export const useTipping = (autoRefresh = false) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTxId, setCurrentTxId] = useState<string | null>(null);
  
  // Use typed dispatch for thunks
  const dispatch = useDispatch<AppDispatch>();
  
  // Use the cross-chain hook for cross-chain tipping
  const crossChain = useCrossChain({
    onSuccess: (txId, txHash) => {
      // Handle successful cross-chain transaction
      console.log(`Cross-chain transaction successful: ${txHash}`);
    },
    onError: (err) => {
      setError(err.message);
    }
  });
  
  // Get state from Redux with proper typing
  const pendingTips = useSelector((state: any) => {
    if (!state.tipping) return [];
    return Object.values(state.tipping.pendingTips || {}) as PendingTip[];
  });
  
  const tipHistory = useSelector((state: any) => {
    const tipIds = state.tipping?.history || [];
    return tipIds
      .map((id: string) => state.entities?.tips?.[id])
      .filter(Boolean) as Tip[];
  });
  
  const statistics = useSelector((state: any) => 
    state.tipping?.statistics
  );

  // Auto-refresh tip history and check pending transactions if enabled
  useEffect(() => {
    if (autoRefresh) {
      const intervalId = setInterval(() => {
        loadTipHistory();
        // Also check for pending cross-chain transactions
        if (crossChain.pendingTransactions.length > 0) {
          crossChain.checkPendingTransactions();
        }
      }, 30000); // Refresh every 30 seconds
      
      // Initial load
      loadTipHistory();
      
      // Cleanup
      return () => clearInterval(intervalId);
    }
  }, [autoRefresh, crossChain]);
  
  /**
   * Send a tip to a recipient
   */
  const sendTip = useCallback(async (params: TippingParams): Promise<TipResult> => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await dispatch(TippingStateService.sendTip(
        params.recipientAddress,
        params.amount,
        params.eventId,
        params.message,
        params.speakerId
      ));
      
      if (!result.success) {
        const errorMsg = result.error ? 
          (typeof result.error === 'object' && 'message' in result.error ? 
            result.error.message as string : 'Failed to send tip') 
          : 'Failed to send tip';
          
        setError(errorMsg);
        return { 
          success: false, 
          error: errorMsg 
        };
      }
      
      return { 
        success: true, 
        data: result.data 
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setIsProcessing(false);
    }
  }, [dispatch]);
  
  /**
   * Send a cross-chain tip
   */
  const sendCrossChainTip = useCallback(async (params: TippingParams): Promise<TipResult> => {
    if (!params.sourceChainId) {
      return {
        success: false,
        error: 'Source chain ID is required for cross-chain tips'
      };
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Import the TippingService dynamically to avoid circular dependencies
      const TippingService = (await import('../services/core/TippingService')).default;
      
      const result = await TippingService.sendCrossChainTip(
        params.sourceChainId,
        params.recipientAddress,
        params.amount,
        params.message || '',
        params.eventId,
        params.speakerId,
        (status, progress) => {
          // Update progress in UI if needed
          console.log(`Cross-chain tip status: ${status}, progress: ${progress}%`);
        }
      );
      
      if (!result.success) {
        const errorMsg = typeof result.error === 'object' && result.error !== null && 'message' in result.error
          ? (result.error.message as string)
          : (typeof result.error === 'string' ? result.error : 'Failed to send cross-chain tip');
        
        setError(errorMsg);
        return {
          success: false,
          error: errorMsg
        };
      }
      
      // Store the transaction ID for future reference
      if (result.data?.txHash) {
        setCurrentTxId(result.data.txHash);
      }
      
      return {
        success: true,
        data: result.data
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  /**
   * Load tip history
   */
  const loadTipHistory = useCallback(async (): Promise<TipResult> => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await dispatch(TippingStateService.fetchTipHistory());
      
      if (!result.success) {
        const errorMsg = result.error ? 
          (typeof result.error === 'object' && 'message' in result.error ? 
            result.error.message as string : 'Failed to load tip history') 
          : 'Failed to load tip history';
          
        setError(errorMsg);
        return { 
          success: false, 
          error: errorMsg 
        };
      }
      
      return { 
        success: true, 
        data: result.data 
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setIsProcessing(false);
    }
  }, [dispatch]);
  
  /**
   * Get a specific tip by ID
   */
  const getTipById = useCallback(async (tipId: string): Promise<TipResult> => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await dispatch(TippingStateService.getTipById(tipId));
      
      if (!result.success) {
        const errorMsg = result.error ? 
          (typeof result.error === 'object' && 'message' in result.error ? 
            result.error.message as string : 'Failed to get tip') 
          : 'Failed to get tip';
          
        setError(errorMsg);
        return { 
          success: false, 
          error: errorMsg 
        };
      }
      
      return { 
        success: true, 
        data: result.data 
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setIsProcessing(false);
    }
  }, [dispatch]);

  /**
   * Get tips for a specific event
   */
  const getEventTips = useCallback(async (eventId: string, limit: number = 10): Promise<TipResult> => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // First check if we already have these tips in our state
      const existingTips = tipHistory.filter((tip) => tip.eventId === eventId);
      
      if (existingTips.length >= limit) {
        return {
          success: true,
          data: existingTips.slice(0, limit)
        };
      }
      
      // If we don't have enough tips, fetch them
      // Note: In a real implementation, we'd have an action in TippingStateService for this
      // For now, we're calling loadTipHistory as a workaround
      const result = await loadTipHistory();
      
      if (!result.success) {
        return result;
      }
      
      // Filter tips for this event
      const eventTips = tipHistory.filter((tip) => tip.eventId === eventId);
      
      return {
        success: true,
        data: eventTips.slice(0, limit)
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setIsProcessing(false);
    }
  }, [dispatch, tipHistory, loadTipHistory]);

  /**
   * Withdraw tips (for speakers)
   */
  const withdrawTips = useCallback(async (): Promise<WithdrawResult> => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // This would normally call a TippingStateService method
      // For now, let's just create a placeholder
      // In a real implementation, we'd add this to TippingStateService
      
      setError('Withdraw functionality not yet implemented');
      return {
        success: false,
        error: 'Withdraw functionality not yet implemented'
      };
      
      /* 
      // Future implementation would look like:
      const result = await dispatch(TippingStateService.withdrawTips());
      
      if (!result.success) {
        const errorMsg = result.error?.message || 'Failed to withdraw tips';
        setError(errorMsg);
        return { 
          success: false, 
          error: errorMsg 
        };
      }
      
      return { 
        success: true, 
        txHash: result.data 
      };
      */
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setIsProcessing(false);
    }
  }, [dispatch]);

  /**
   * Get speaker balance
   */
  const getSpeakerBalance = useCallback(async (speakerAddress: string): Promise<TipResult> => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // This would normally call a TippingStateService method
      // For now, let's just create a placeholder
      // In a real implementation, we'd add this to TippingStateService
      
      // Compute a mock balance based on the speaker's received tips
      const receivedTips = tipHistory.filter(tip => tip.recipientId === speakerAddress);
      const balance = receivedTips.reduce((sum, tip) => sum + tip.amount, 0);
      
      return {
        success: true,
        data: balance.toString()
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setIsProcessing(false);
    }
  }, [tipHistory]);

  /**
   * Clear tip history
   */
  const clearTipHistory = useCallback(() => {
    TippingStateService.clearHistory();
  }, []);

  return {
    // State
    isProcessing,
    error,
    pendingTips,
    tipHistory,
    statistics,
    currentTxId,
    
    // Core actions
    sendTip,
    sendCrossChainTip,
    loadTipHistory,
    getTipById,
    getEventTips,
    withdrawTips,
    getSpeakerBalance,
    clearTipHistory,
    
    // Cross-chain related
    crossChainPendingTransactions: crossChain.pendingTransactions,
    crossChainProgress: crossChain.progress,
    isCrossChainProcessing: crossChain.isProcessing,
    
    // Helpers
    hasPendingTips: pendingTips.length > 0,
    hasCrossChainPendingTips: crossChain.pendingTransactions.length > 0,
    totalSent: statistics?.totalSent || 0,
    totalReceived: statistics?.totalReceived || 0
  };
};

export default useTipping;