import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { walletService } from '../services/walletService';
import contractService from '../services/contractService';

interface NetworkInfo {
  chainId: bigint;
  name: string;
}

export interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  isInitialized: boolean;
  address: string | null;
  balance: string;
  chainId: number | null;
  isCorrectNetwork: boolean;
  error: string | null;
  networkInfo: NetworkInfo | null;
}

export interface WalletActions {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchToMantleSepolia: () => Promise<boolean>;
  refreshBalance: () => Promise<void>;
  refreshWalletState: () => Promise<void>;
  clearError: () => void;
  formatBalance: (balance: string) => string;
  formatAddress: (address: string) => string;
  isWalletReady: () => boolean;
}

// Use a more generic type for primaryWallet
export interface WalletContextValue extends WalletState, WalletActions {
  primaryWallet: any; 
}

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

      const walletClient = await (primaryWallet as any).getWalletClient();
      const initialized = await walletService.initialize(walletClient);

      if (!initialized) {
        throw new Error('Failed to initialize wallet service');
      }

      await contractService.initialize(walletClient);

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

  const switchToMantleSepolia = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));
      const success = await walletService.switchToMantleSepolia();
      if (success) {
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

  const refreshBalance = useCallback(async () => {
    if (!state.isConnected || !primaryWallet) return;
    try {
      const balance = await walletService.getBalance();
      setState(prev => ({ ...prev, balance }));
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  }, [state.isConnected, primaryWallet]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

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

  useEffect(() => {
    refreshWalletState();
  }, [refreshWalletState]);

  useEffect(() => {
    if (!primaryWallet) return;
    const handleAccountsChanged = () => refreshWalletState();
    const handleChainChanged = () => refreshWalletState();
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
      if (import.meta.env.VITE_DEBUG_MODE === 'true') {
        console.log('Wallet does not support event listeners:', error);
      }
    }
  }, [primaryWallet, refreshWalletState]);

  useEffect(() => {
    if (!state.isConnected) return;
    const interval = setInterval(refreshBalance, 30000);
    return () => clearInterval(interval);
  }, [state.isConnected, refreshBalance]);

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
    ...state,
    primaryWallet, // Expose primaryWallet
    connectWallet,
    disconnectWallet,
    switchToMantleSepolia,
    refreshBalance,
    refreshWalletState,
    clearError,
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
