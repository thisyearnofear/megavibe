'use client';

import { useAccount, useBalance, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { mainnet, sepolia } from 'wagmi/chains';
import { useEffect, useState } from 'react';
import { ProviderType } from '@/services/blockchain/providerService';

export interface WalletInfo {
  isConnected: boolean;
  address: string;
  chainId: number;
  isSupported: boolean;
  balance: {
    mnt: string;
    formatted: string;
  };
}

// Default wallet info for SSR/build time
const defaultWalletInfo: WalletInfo = {
  isConnected: false,
  address: "",
  chainId: 0,
  isSupported: false,
  balance: {
    mnt: "0",
    formatted: "0",
  },
};

export function useWalletConnection() {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Always call hooks at the top level, but handle errors gracefully
  let account, chainId, balanceData, disconnect, switchChain, web3Modal;
  
  try {
    account = useAccount();
    chainId = useChainId();
    balanceData = useBalance({ address: account.address });
    disconnect = useDisconnect();
    switchChain = useSwitchChain();
    web3Modal = useWeb3Modal();
  } catch (error) {
    // During SSR/build time, Wagmi hooks might fail
    // Return safe defaults
    account = { isConnected: false, address: undefined };
    chainId = 0;
    balanceData = { data: undefined };
    disconnect = { disconnect: undefined };
    switchChain = { switchChain: undefined };
    web3Modal = { open: undefined };
  }

  // Use Wagmi data if mounted and available, otherwise use defaults
  const walletInfo: WalletInfo = (isMounted && typeof window !== 'undefined') ? {
    isConnected: account?.isConnected || false,
    address: account?.address || "",
    chainId: chainId || 0,
    isSupported: chainId ? [mainnet.id, sepolia.id].includes(chainId as any) : false,
    balance: {
      mnt: balanceData?.data?.value.toString() || "0",
      formatted: balanceData?.data?.formatted || "0",
    },
  } : defaultWalletInfo;

  const connect = async (_walletType: ProviderType) => {
    if (isMounted && web3Modal?.open) {
      web3Modal.open();
    } else {
      console.warn("Web3Modal not available - component not mounted or provider missing");
    }
    return walletInfo;
  };

  const switchNetwork = async (targetChainId: number) => {
    if (isMounted && switchChain?.switchChain) {
      try {
        await switchChain.switchChain({ chainId: targetChainId });
      } catch (error) {
        console.error("Failed to switch network:", error);
        throw error;
      }
    } else {
      console.warn("Switch network function not available - component not mounted or provider missing");
    }
  };
  
  const disconnectWallet = async () => {
    if (isMounted && disconnect?.disconnect) {
      disconnect.disconnect();
    } else {
      console.warn("Disconnect function not available - component not mounted or provider missing");
    }
  };

  return {
    walletInfo,
    connect,
    disconnect: disconnectWallet,
    switchNetwork,
  };
}