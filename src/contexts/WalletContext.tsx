"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { ProviderType } from "@/services/blockchain/providerService";
import { useWalletConnection } from "@/hooks/useWalletConnection";

interface WalletContextType {
  isConnected: boolean;
  walletAddress: string;
  chainId: number;
  isNetworkSupported: boolean;
  balance: {
    mnt: string;
    formatted: string;
  };
  connectWallet: (walletType: ProviderType) => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  isInitialized: boolean;
}

const defaultContext: WalletContextType = {
  isConnected: false,
  walletAddress: "",
  chainId: 0,
  isNetworkSupported: false,
  balance: {
    mnt: "0",
    formatted: "0",
  },
  connectWallet: async () => {},
  disconnectWallet: () => {},
  switchNetwork: async () => {},
  isInitialized: false,
};

const WalletContext = createContext<WalletContextType>(defaultContext);

export function useWallet() {
  return useContext(WalletContext);
}

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  // Use the new wallet connection hook
  const { walletInfo, connect, disconnect, switchNetwork } = useWalletConnection();

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Mark as initialized since we're using wagmi hooks directly
    setIsInitialized(true);
  }, []);

  const connectWallet = async (walletType: ProviderType) => {
    try {
      await connect(walletType);
      // WalletInfo will be updated via event listeners
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    disconnect();
  };

  const switchNetworkWrapper = async (targetChainId: number) => {
    try {
      await switchNetwork(targetChainId);
    } catch (error) {
      console.error("Failed to switch network:", error);
      throw error;
    }
  };

  const value = {
    isConnected: walletInfo.isConnected,
    walletAddress: walletInfo.address,
    chainId: walletInfo.chainId,
    isNetworkSupported: walletInfo.isSupported,
    balance: walletInfo.balance,
    connectWallet,
    disconnectWallet,
    switchNetwork: switchNetworkWrapper,
    isInitialized,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}
