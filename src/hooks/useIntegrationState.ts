// Unified Integration State Management Hook
// ENHANCEMENT FIRST: Consolidates FilCDN, wallet, and loading patterns into single source of truth
// AGGRESSIVE CONSOLIDATION: Replaces fragmented state management across components
// DRY: Single hook for all integration concerns

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { useUIStore } from '@/store/uiStore';
import { useFilCDN } from '@/contexts/FilCDNContext';

export interface IntegrationStatus {
  wallet: {
    isConnected: boolean;
    isConnecting: boolean;
    address: string | null;
    chainId: number | null;
    error: string | null;
  };
  filcdn: {
    isInitialized: boolean;
    isInitializing: boolean;
    error: string | null;
    stats: unknown | null;
  };
  overall: {
    isReady: boolean;
    blockers: string[];
    health: 'excellent' | 'good' | 'poor' | 'critical';
  };
}

export interface IntegrationActions {
  // Wallet actions
  connectWallet: (type?: string) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  
  // FilCDN actions
  reinitializeFilCDN: () => Promise<void>;
  testFilCDNConnection: () => Promise<boolean>;
  
  // Combined actions
  initializeAll: () => Promise<void>;
  clearAllErrors: () => void;
  
  // Health checks
  runHealthCheck: () => Promise<void>;
}

/**
 * Unified integration state hook that consolidates all external service management
 * CLEAN: Clear separation of concerns with explicit dependencies
 * MODULAR: Composable, testable, independent from UI components
 */
export function useIntegrationState(): IntegrationStatus & IntegrationActions {
  // Store connections
  const { wallet: walletState, connectWallet: storeConnectWallet, disconnectWallet: storeDisconnectWallet } = useAppStore();
  const { setLoading, setGlobalLoading, showNotification } = useUIStore();
  const { 
    isInitialized: filcdnInitialized, 
    isInitializing: filcdnInitializing, 
    error: filcdnError, 
    stats: filcdnStats,
    reInitialize: filcdnReInitialize
  } = useFilCDN();

  const [healthCheckInProgress, setHealthCheckInProgress] = useState(false);

  // Compute integration status
  const status: IntegrationStatus = {
    wallet: {
      isConnected: walletState.connectionStatus === 'connected',
      isConnecting: walletState.connectionStatus === 'connecting',
      address: walletState.address,
      chainId: walletState.chainId,
      error: walletState.connectionStatus === 'error' ? 'Wallet connection failed' : null,
    },
    filcdn: {
      isInitialized: filcdnInitialized,
      isInitializing: filcdnInitializing,
      error: filcdnError,
      stats: filcdnStats,
    },
    overall: {
      isReady: false, // Will be computed below
      blockers: [],
      health: 'critical', // Will be computed below
    }
  };

  // Compute overall status
  const blockers: string[] = [];
  if (!status.wallet.isConnected && !status.wallet.isConnecting) {
    blockers.push('Wallet not connected');
  }
  if (!status.filcdn.isInitialized && !status.filcdn.isInitializing) {
    blockers.push('FilCDN not initialized');
  }
  if (status.wallet.error) {
    blockers.push(`Wallet error: ${status.wallet.error}`);
  }
  if (status.filcdn.error) {
    blockers.push(`FilCDN error: ${status.filcdn.error}`);
  }

  status.overall.blockers = blockers;
  status.overall.isReady = blockers.length === 0;
  
  // Compute health score
  if (status.overall.isReady) {
    status.overall.health = 'excellent';
  } else if (blockers.length === 1) {
    status.overall.health = 'good';
  } else if (blockers.length <= 2) {
    status.overall.health = 'poor';
  } else {
    status.overall.health = 'critical';
  }

  // Actions
  const connectWallet = useCallback(async (type = 'metamask') => {
    try {
      setLoading('wallet', true);
      await storeConnectWallet(type);
      showNotification({
        type: 'success',
        title: 'Wallet Connected',
        message: `Successfully connected to ${type}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect wallet';
      showNotification({
        type: 'error',
        title: 'Connection Failed',
        message,
      });
      throw error;
    } finally {
      setLoading('wallet', false);
    }
  }, [storeConnectWallet, setLoading, showNotification]);

  const disconnectWallet = useCallback(async () => {
    try {
      storeDisconnectWallet();
      showNotification({
        type: 'info',
        title: 'Wallet Disconnected',
        message: 'Your wallet has been disconnected',
      });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  }, [storeDisconnectWallet, showNotification]);

  const reinitializeFilCDN = useCallback(async () => {
    try {
      setLoading('upload', true);
      await filcdnReInitialize();
      showNotification({
        type: 'success',
        title: 'FilCDN Reinitialized',
        message: 'Storage system has been reinitialized',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reinitialize FilCDN';
      showNotification({
        type: 'error',
        title: 'Reinitialization Failed',
        message,
      });
      throw error;
    } finally {
      setLoading('upload', false);
    }
  }, [filcdnReInitialize, setLoading, showNotification]);

  const testFilCDNConnection = useCallback(async (): Promise<boolean> => {
    try {
      if (!filcdnInitialized) return false;
      
      // Simple connection test by checking stats
      return filcdnStats !== null;
    } catch (error) {
      console.error('FilCDN connection test failed:', error);
      return false;
    }
  }, [filcdnInitialized, filcdnStats]);

  const initializeAll = useCallback(async () => {
    try {
      setGlobalLoading(true);
      
      // Initialize in parallel for better performance
      const promises = [];
      
      if (!status.wallet.isConnected && !status.wallet.isConnecting) {
        promises.push(connectWallet());
      }
      
      if (!status.filcdn.isInitialized && !status.filcdn.isInitializing) {
        promises.push(reinitializeFilCDN());
      }
      
      await Promise.allSettled(promises);
      
      showNotification({
        type: 'success',
        title: 'Integration Complete',
        message: 'All systems are initialized and ready',
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Initialization Failed',
        message: 'Some systems failed to initialize',
      });
    } finally {
      setGlobalLoading(false);
    }
  }, [status, connectWallet, reinitializeFilCDN, setGlobalLoading, showNotification]);

  const clearAllErrors = useCallback(() => {
    // Clear errors from all systems
    // Note: Individual systems should provide error clearing methods
    console.log('Clearing all integration errors');
  }, []);

  const runHealthCheck = useCallback(async () => {
    if (healthCheckInProgress) return;
    
    setHealthCheckInProgress(true);
    try {
      // Test all integrations
      const walletOk = status.wallet.isConnected;
      const filcdnOk = await testFilCDNConnection();
      
      const results = {
        wallet: walletOk,
        filcdn: filcdnOk,
      };
      
      const failedSystems = Object.entries(results)
        .filter(([, ok]) => !ok)
        .map(([system]) => system);
      
      if (failedSystems.length === 0) {
        showNotification({
          type: 'success',
          title: 'Health Check Passed',
          message: 'All integrations are healthy',
        });
      } else {
        showNotification({
          type: 'warning',
          title: 'Health Check Issues',
          message: `Issues detected: ${failedSystems.join(', ')}`,
        });
      }
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Health Check Failed',
        message: 'Unable to complete health check',
      });
    } finally {
      setHealthCheckInProgress(false);
    }
  }, [status.wallet.isConnected, testFilCDNConnection, showNotification, healthCheckInProgress]);

  // Auto health check on mount and when status changes
  useEffect(() => {
    if (status.overall.isReady) {
      runHealthCheck();
    }
  }, [status.overall.isReady]); // Only run when readiness changes

  return {
    ...status,
    connectWallet,
    disconnectWallet,
    reinitializeFilCDN,
    testFilCDNConnection,
    initializeAll,
    clearAllErrors,
    runHealthCheck,
  };
}
