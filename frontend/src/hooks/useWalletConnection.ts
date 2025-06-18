import { useState, useEffect, useCallback } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { walletService } from '../services/walletService';

interface NetworkInfo {
  chainId: bigint;
  name: string;
}

export interface WalletConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  balance: string;
  chainId: number | null;
  isCorrectNetwork: boolean;
  error: string | null;
}

export const useWalletConnection = () => {
  const { primaryWallet, setShowDynamicUserProfile, handleLogOut } = useDynamicContext();
  const [state, setState] = useState<WalletConnectionState>({
    isConnected: false,
    isConnecting: false,
    address: null,
    balance: '0',
    chainId: null,
    isCorrectNetwork: false,
    error: null,
  });

  const updateWalletState = useCallback(async () => {
    if (!primaryWallet) {
      setState(prev => ({
        ...prev,
        isConnected: false,
        address: null,
        balance: '0',
        chainId: null,
        isCorrectNetwork: false,
        error: null,
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));

      // Get wallet client and initialize wallet service
      const walletClient = await primaryWallet.getWalletClient();
      await walletService.initialize(walletClient);

      // Get wallet information
      const address = primaryWallet.address;
      const balance = await walletService.getBalance();
      const network = await walletService.getNetwork();
      const isReady = await walletService.isReady();

      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        address,
        balance,
        chainId: network ? Number(network.chainId) : null,
        isCorrectNetwork: isReady,
        error: null,
      }));
    } catch (error) {
      console.error('Failed to update wallet state:', error);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
      }));
    }
  }, [primaryWallet]);

  const switchToMantleSepolia = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));

      const success = await walletService.switchToMantleSepolia();

      if (success) {
        // Wait a moment for the network switch to complete
        setTimeout(() => {
          updateWalletState();
        }, 1000);
      } else {
        setState(prev => ({
          ...prev,
          isConnecting: false,
          error: 'Failed to switch to Mantle Sepolia network',
        }));
      }
    } catch (error) {
      console.error('Failed to switch network:', error);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to switch network',
      }));
    }
  }, [updateWalletState]);

  const connectWallet = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));

      // Open Dynamic wallet connection modal
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
      // Use Dynamic's logout function to properly disconnect
      await handleLogOut();

      setState({
        isConnected: false,
        isConnecting: false,
        address: null,
        balance: '0',
        chainId: null,
        isCorrectNetwork: false,
        error: null,
      });
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to disconnect wallet',
      }));
    }
  }, [handleLogOut]);

  const refreshBalance = useCallback(async () => {
    if (!primaryWallet || !state.isConnected) return;

    try {
      const balance = await walletService.getBalance();
      setState(prev => ({ ...prev, balance }));
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  }, [primaryWallet, state.isConnected]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Update wallet state when primary wallet changes
  useEffect(() => {
    updateWalletState();
  }, [updateWalletState]);

  // Listen for account changes
  useEffect(() => {
    if (!primaryWallet) return;

    const handleAccountsChanged = () => {
      updateWalletState();
    };

    const handleChainChanged = () => {
      updateWalletState();
    };

    // Add event listeners if the wallet supports them
    try {
      const walletClient = primaryWallet.connector;
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
    } catch (err) {
      console.log('Wallet does not support event listeners');
    }
  }, [primaryWallet, updateWalletState]);

  // Auto-refresh balance every 30 seconds
  useEffect(() => {
    if (!state.isConnected) return;

    const interval = setInterval(refreshBalance, 30000);
    return () => clearInterval(interval);
  }, [state.isConnected, refreshBalance]);

  return {
    ...state,
    connectWallet,
    disconnectWallet,
    switchToMantleSepolia,
    refreshBalance,
    clearError,
    formatBalance: (balance: string) => {
      const num = parseFloat(balance);
      return isNaN(num) ? '0.000' : num.toFixed(3);
    },
    formatAddress: (address: string) => {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    },
  };
};
