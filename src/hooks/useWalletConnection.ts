import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { ProviderType } from '@/services/blockchain';

export interface WalletConnectionHook {
  isConnected: boolean;
  walletAddress: string;
  formattedAddress: string;
  chainId: number;
  isNetworkSupported: boolean;
  balance: {
    mnt: string;
    formatted: string;
  };
  connectWallet: (walletType: ProviderType) => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  isWalletModalOpen: boolean;
  openWalletModal: () => void;
  closeWalletModal: () => void;
}

/**
 * Custom hook for wallet connection functionality
 * Provides a simplified interface for components to interact with wallet features
 */
export function useWalletConnection(): WalletConnectionHook {
  const { 
    isConnected, 
    walletAddress, 
    chainId,
    isNetworkSupported,
    balance, 
    connectWallet, 
    disconnectWallet,
    switchNetwork
  } = useWallet();
  
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  
  // Format wallet address for display (0x1234...5678)
  const formattedAddress = useMemo(() => {
    if (!walletAddress) return '';
    return `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`;
  }, [walletAddress]);

  // Close modal when wallet is connected
  useEffect(() => {
    if (isConnected) {
      setIsWalletModalOpen(false);
    }
  }, [isConnected]);

  const openWalletModal = useCallback(() => {
    setIsWalletModalOpen(true);
  }, []);

  const closeWalletModal = useCallback(() => {
    setIsWalletModalOpen(false);
  }, []);

  // Enhanced wallet connection that shows the modal if needed
  const handleConnectWallet = useCallback(async (walletType: ProviderType) => {
    try {
      await connectWallet(walletType);
    } catch (error) {
      console.error('Wallet connection error:', error);
      // Keep modal open on error
    }
  }, [connectWallet]);

  return {
    isConnected,
    walletAddress,
    formattedAddress,
    chainId,
    isNetworkSupported,
    balance,
    connectWallet: handleConnectWallet,
    disconnectWallet,
    switchNetwork,
    isWalletModalOpen,
    openWalletModal,
    closeWalletModal,
  };
}