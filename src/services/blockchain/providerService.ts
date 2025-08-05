import { createWeb3Modal, useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount, useBalance, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { useEffect, useRef } from 'react';

export enum ProviderType {
  MetaMask = "MetaMask", // Not directly used for connection, but for UI representation
  WalletConnect = "WalletConnect",
  CoinbaseWallet = "CoinbaseWallet",
}

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

// This class will now primarily act as a wrapper around wagmi hooks
// and Web3Modal's functionality, providing a consistent interface
// for the rest of the application.
class ProviderService {
  private _web3ModalInitialized = false;
  private _web3ModalInstance: ReturnType<typeof useWeb3Modal> | null = null;

  // Callbacks for listeners
  private accountChangedCallbacks = new Set<(address: string) => void>();
  private chainChangedCallbacks = new Set<(chainId: number) => void>();
  private connectionChangedCallbacks = new Set<(connected: boolean) => void>();

  // This method will be called from a React component (e.g., WalletProvider)
  // to ensure hooks are called in a React context.
  public useWagmiHooks() {
    const { address, isConnected, isDisconnected } = useAccount();
    const chainId = useChainId();
    const { data: balanceData } = useBalance({ address });
    const { disconnect } = useDisconnect();
    const { switchChain } = useSwitchChain();
    const { open, close } = useWeb3Modal();

    // Store web3Modal instance for later use
    useEffect(() => {
      if (!this._web3ModalInitialized) {
        this._web3ModalInstance = { open, close };
        this._web3ModalInitialized = true;
      }
    }, [open, close]);

    // Effect to manage internal walletInfo state and trigger callbacks
    useEffect(() => {
      const newWalletInfo: WalletInfo = {
        isConnected: isConnected,
        address: address || "",
        chainId: chainId || 0,
        isSupported: chainId ? [mainnet.id, sepolia.id].includes(chainId as any) : false,
        balance: {
          mnt: balanceData?.value.toString() || "0",
          formatted: balanceData?.formatted || "0",
        },
      };

      // Check for connection status changes
      if (newWalletInfo.isConnected !== this.walletInfo.isConnected) {
        this.connectionChangedCallbacks.forEach(cb => cb(newWalletInfo.isConnected));
      }

      // Check for account address changes
      if (newWalletInfo.address !== this.walletInfo.address) {
        this.accountChangedCallbacks.forEach(cb => cb(newWalletInfo.address));
      }

      // Check for chain ID changes
      if (newWalletInfo.chainId !== this.walletInfo.chainId) {
        this.chainChangedCallbacks.forEach(cb => cb(newWalletInfo.chainId));
      }

      this.walletInfo = newWalletInfo;

    }, [address, isConnected, isDisconnected, chainId, balanceData]);

    // Expose methods that can be called from outside React components
    const connect = useRef((_walletType: ProviderType) => {
      // Web3Modal handles wallet selection, so walletType is mostly for logging/tracking
      if (this._web3ModalInstance) {
        this._web3ModalInstance.open();
      } else {
        console.warn("Web3Modal not initialized. Cannot open wallet connection modal.");
      }
      return Promise.resolve(this.walletInfo); // Return current info, actual connection is async
    });

    const disconnectWallet = useRef(() => {
      disconnect();
    });

    const switchNetworkRef = useRef(async (targetChainId: number) => {
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
    });

    return {
      connect: connect.current,
      disconnect: disconnectWallet.current,
      switchNetwork: switchNetworkRef.current,
    };
  }

  // Internal state to mirror wagmi's state
  private walletInfo: WalletInfo = {
    isConnected: false,
    address: "",
    chainId: 0,
    isSupported: false,
    balance: { mnt: "0", formatted: "0" },
  };

  // Public methods to get current wallet info
  getWalletInfo(): WalletInfo {
    return { ...this.walletInfo };
  }

  // Public methods for event listeners
  onAccountChanged(listener: (address: string) => void): void {
    this.accountChangedCallbacks.add(listener);
  }

  removeAccountChangedListener(listener: (address: string) => void): void {
    this.accountChangedCallbacks.delete(listener);
  }

  onChainChanged(listener: (chainId: number) => void): void {
    this.chainChangedCallbacks.add(listener);
  }

  removeChainChangedListener(listener: (chainId: number) => void): void {
    this.chainChangedCallbacks.delete(listener);
  }

  onConnectionChanged(listener: (connected: boolean) => void): void {
    this.connectionChangedCallbacks.add(listener);
  }

  removeConnectionChangedListener(listener: (connected: boolean) => void): void {
    this.connectionChangedCallbacks.delete(listener);
  }
}

export const providerService = new ProviderService();