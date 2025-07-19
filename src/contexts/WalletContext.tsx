"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { providerService, ProviderType } from "@/services/blockchain";

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
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [chainId, setChainId] = useState(0);
  const [isNetworkSupported, setIsNetworkSupported] = useState(false);
  const [balance, setBalance] = useState({ mnt: "0", formatted: "0" });
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize provider service when component mounts
  useEffect(() => {
    const initializeProvider = async () => {
      try {
        await providerService.initialize();

        // Check if wallet is already connected
        const walletInfo = providerService.getWalletInfo();
        if (walletInfo && walletInfo.isConnected) {
          setIsConnected(true);
          setWalletAddress(walletInfo.address);
          setChainId(walletInfo.chainId);
          setIsNetworkSupported(walletInfo.isSupported);
          setBalance({
            mnt: walletInfo.balance.mnt,
            formatted: walletInfo.balance.formatted,
          });
        }
      } catch (error) {
        console.error("Failed to initialize wallet provider:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeProvider();

    // Set up event listeners
    providerService.onAccountChanged(handleAccountChanged);
    providerService.onChainChanged(handleChainChanged);
    providerService.onConnectionChanged(handleConnectionChanged);

    // Clean up event listeners on unmount
    return () => {
      providerService.removeAccountChangedListener(handleAccountChanged);
      providerService.removeChainChangedListener(handleChainChanged);
      providerService.removeConnectionChangedListener(handleConnectionChanged);
    };
  }, []);

  const connectWallet = async (walletType: ProviderType) => {
    try {
      const walletInfo = await providerService.connect(walletType);

      setIsConnected(true);
      setWalletAddress(walletInfo.address);
      setChainId(walletInfo.chainId);
      setIsNetworkSupported(walletInfo.isSupported);
      setBalance({
        mnt: walletInfo.balance.mnt,
        formatted: walletInfo.balance.formatted,
      });
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      setIsConnected(false);
      // Re-throw the error so components can handle it
      throw error;
    }
  };

  const disconnectWallet = () => {
    providerService.disconnect();
    setIsConnected(false);
    setWalletAddress("");
    setChainId(0);
    setIsNetworkSupported(false);
    setBalance({ mnt: "0", formatted: "0" });
  };

  const switchNetwork = async (targetChainId: number) => {
    try {
      await providerService.switchNetwork(targetChainId);

      // Update wallet info after network switch
      const walletInfo = providerService.getWalletInfo();
      if (walletInfo) {
        setChainId(walletInfo.chainId);
        setIsNetworkSupported(walletInfo.isSupported);
        setBalance({
          mnt: walletInfo.balance.mnt,
          formatted: walletInfo.balance.formatted,
        });
      }
    } catch (error) {
      console.error("Failed to switch network:", error);
    }
  };

  // Handle account change events
  const handleAccountChanged = (address: string) => {
    setWalletAddress(address);

    // Update balance
    const walletInfo = providerService.getWalletInfo();
    if (walletInfo) {
      setBalance({
        mnt: walletInfo.balance.mnt,
        formatted: walletInfo.balance.formatted,
      });
    }
  };

  // Handle chain change events
  const handleChainChanged = (newChainId: number) => {
    setChainId(newChainId);

    // Update network support status and balance
    const walletInfo = providerService.getWalletInfo();
    if (walletInfo) {
      setIsNetworkSupported(walletInfo.isSupported);
      setBalance({
        mnt: walletInfo.balance.mnt,
        formatted: walletInfo.balance.formatted,
      });
    }
  };

  // Handle connection state change events
  const handleConnectionChanged = (connected: boolean) => {
    setIsConnected(connected);

    if (!connected) {
      setWalletAddress("");
      setChainId(0);
      setIsNetworkSupported(false);
      setBalance({ mnt: "0", formatted: "0" });
    }
  };

  const value = {
    isConnected,
    walletAddress,
    chainId,
    isNetworkSupported,
    balance,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    isInitialized,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}
