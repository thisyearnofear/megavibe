'use client';

import { useAccount, useBalance, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { mainnet, sepolia } from 'wagmi/chains';
import { useEffect } from 'react';
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

export function useWalletConnection() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: balanceData } = useBalance({ address });
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { open } = useWeb3Modal();

  const walletInfo: WalletInfo = {
    isConnected: isConnected,
    address: address || "",
    chainId: chainId || 0,
    isSupported: chainId ? [mainnet.id, sepolia.id].includes(chainId as any) : false,
    balance: {
      mnt: balanceData?.value.toString() || "0",
      formatted: balanceData?.formatted || "0",
    },
  };

  const connect = async (_walletType: ProviderType) => {
    open();
    return walletInfo;
  };

  const switchNetwork = async (targetChainId: number) => {
    if (switchChain) {
      try {
        await switchChain({ chainId: targetChainId });
      } catch (error) {
        console.error("Failed to switch network:", error);
        throw error;
      }
    } else {
      console.warn("Switch network function not available.");
    }
  };

  return {
    walletInfo,
    connect,
    disconnect,
    switchNetwork,
  };
}