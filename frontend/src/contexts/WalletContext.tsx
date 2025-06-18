import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { walletService } from '../services/walletService';

interface NetworkInfo {
  chainId: bigint;
  name: string;
}

export interface WalletState {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  isInitialized: boolean;

  // Wallet information
  address: string | null;
  balance: string;
  chainId: number | null;
  isCorrectNetwork: boolean;

  // Error handling
  error: string | null;

  // Network information
  networkInfo: NetworkInfo | null;
}

export interface WalletActions {
  // Connection actions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchToMantleSepolia: () => Promise<boolean>;

  // Utility actions
  refreshBalance: () => Promise<void>;
  refreshWalletState: () => Promise<void>;
  clearError: () => void;

  // Helper functions
  formatBalance: (balance: string) => string;
  formatAddress: (address: string) => string;
  isWalletReady: () => boolean;
}

export interface WalletContextValue extends WalletState, WalletActions {}

const WalletContext = createContext<WalletContextValue | null>(null);

export const useWallet = (): WalletContextValue => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const { primaryWallet, setShowDynamicUserProfile, handleLogOut } = useDynamicContext();

  const [state, setState] = useState<WalletState>({
    isConnected: false,
    isConnecting: false,
    isInitialized: false,
    address: null,
    balance: '0',
    chainId: null,
    isCorrectNetwork: false,
    error: null,
    networkInfo: null,
  });

  // Initialize wallet state
  const refreshWalletState = useCallback(async () => {
    if (!primaryWallet) {
      setState(prev => ({
        ...prev,
        isConnected: false,
        isInitialized: true,
        address: null,
        balance: '0',
        chainId: null,
        isCorrectNetwork: false,
        networkInfo: null,
        error: null,
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));

      // Get wallet client and initialize wallet service
      const walletClient = await (primaryWallet as any).getWalletClient();
      const initialized = await walletService.initialize(walletClient);

      if (!initialized) {
        throw new Error('Failed to initialize wallet service');
      }

      // Get wallet information
      const address = primaryWallet.address;
      const balance = await walletService.getBalance();
      const networkInfo = await walletService.getNetwork();
      const isReady = await walletService.isReady();

      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        isInitialized: true,
        address,
        balance,
        chainId: networkInfo ? Number(networkInfo.chainId) : null,
        isCorrectNetwork: isReady,
        networkInfo,
        error: null,
      }));
    } catch (error) {
      console.error('Failed to refresh wallet state:', error);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        isInitialized: true,
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
      }));
    }
  }, [primaryWallet]);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));
      setShowDynamicUserProfile(true);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
      }));
    }
  }, [setShowDynamicUserProfile]);

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    try {
      await handleLogOut();
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        address: null,
        balance: '0',
        chainId: null,
        isCorrectNetwork: false,
        networkInfo: null,
        error: null,
      }));
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to disconnect wallet',
      }));
    }
  }, [handleLogOut]);

  // Switch to Mantle Sepolia
  const switchToMantleSepolia = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));

      const success = await walletService.switchToMantleSepolia();

      if (success) {
        // Wait for network switch to complete, then refresh state
        setTimeout(() => {
          refreshWalletState();
        }, 1000);
        return true;
      } else {
        setState(prev => ({
          ...prev,
          isConnecting: false,
          error: 'Failed to switch to Mantle Sepolia network',
        }));
        return false;
      }
    } catch (error) {
      console.error('Failed to switch network:', error);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to switch network',
      }));
      return false;
    }
  }, [refreshWalletState]);

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (!state.isConnected || !primaryWallet) return;

    try {
      const balance = await walletService.getBalance();
      setState(prev => ({ ...prev, balance }));
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  }, [state.isConnected, primaryWallet]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Helper functions
  const formatBalance = useCallback((walletBalance: string): string => {
    const num = parseFloat(walletBalance);
    return isNaN(num) ? '0.000' : num.toFixed(3);
  }, []);

  const formatAddress = useCallback((walletAddress: string): string => {
    return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
  }, []);

  const isWalletReady = useCallback((): boolean => {
    return state.isConnected && state.isCorrectNetwork && !state.isConnecting;
  }, [state.isConnected, state.isCorrectNetwork, state.isConnecting]);

  // Update wallet state when primary wallet changes
  useEffect(() => {
    refreshWalletState();
  }, [refreshWalletState]);

  // Listen for account and chain changes
  useEffect(() => {
    if (!primaryWallet) return;

    const handleAccountsChanged = () => {
      refreshWalletState();
    };

    const handleChainChanged = () => {
      refreshWalletState();
    };

    // Add event listeners if the wallet supports them
    try {
      const walletClient = (primaryWallet as any).connector;
      if (walletClient?.on) {
        walletClient.on('accountsChanged', handleAccountsChanged);
        walletClient.on('chainChanged', handleChainChanged);
      }

      return () => {
        if (walletClient?.off) {
          walletClient.off('accountsChanged', handleAccountsChanged);
          walletClient.off('chainChanged', handleChainChanged);
        }
      };
    } catch (error) {
      // Wallet doesn't support event listeners
      if (import.meta.env.VITE_DEBUG_MODE === 'true') {
        console.log('Wallet does not support event listeners:', error);
      }
    }
  }, [primaryWallet, refreshWalletState]);

  // Auto-refresh balance every 30 seconds when connected
  useEffect(() => {
    if (!state.isConnected) return;

    const interval = setInterval(refreshBalance, 30000);
    return () => clearInterval(interval);
  }, [state.isConnected, refreshBalance]);

  // Debug logging in development
  useEffect(() => {
    if (import.meta.env.VITE_DEBUG_MODE === 'true') {
      console.log('Wallet state updated:', {
        isConnected: state.isConnected,
        address: state.address,
        chainId: state.chainId,
        isCorrectNetwork: state.isCorrectNetwork,
        balance: state.balance,
      });
    }
  }, [state]);

  const contextValue: WalletContextValue = {
    // State
    ...state,

    // Actions
    connectWallet,
    disconnectWallet,
    switchToMantleSepolia,
    refreshBalance,
    refreshWalletState,
    clearError,

    // Helpers
    formatBalance,
    formatAddress,
    isWalletReady,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};
