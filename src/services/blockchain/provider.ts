/**
 * Blockchain provider service
 * Handles wallet connections and provides access to blockchain
 */
import { ethers } from 'ethers';
import { getNetworkConfig, isNetworkSupported } from '@/contracts/config';
import { DEFAULT_CHAIN_ID } from '@/contracts/addresses';
import { BlockchainError, BlockchainErrorType, ProviderType, WalletInfo } from './types';
import { 
  isEthereumAvailable, 
  getEthereumProvider, 
  addEthereumEventListener,
  requestFromEthereum,
  safeEthereum
} from '@/utils/ethereum';

// Get fallback RPC URL from environment variables
const FALLBACK_RPC_URL = getNetworkConfig(DEFAULT_CHAIN_ID)?.rpcUrl || 'https://rpc.sepolia.mantle.xyz';

class ProviderService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private walletInfo: WalletInfo | null = null;
  private providerType: ProviderType | null = null;
  
  // Event listeners
  private accountChangedListeners: ((address: string) => void)[] = [];
  private chainChangedListeners: ((chainId: number) => void)[] = [];
  private connectionListeners: ((isConnected: boolean) => void)[] = [];

  /**
   * Initialize the provider service
   * This should be called when the app starts
   */
  public async initialize(): Promise<void> {
    // Check if ethereum is available in window with defensive programming
    if (typeof window !== 'undefined' && isEthereumAvailable()) {
      try {
        // Create ethers provider from window.ethereum
        const ethereumProvider = getEthereumProvider();
        if (ethereumProvider) {
          this.provider = new ethers.BrowserProvider(ethereumProvider as any);
        } else {
          throw new Error('Failed to get Ethereum provider');
        }
        
        // Add event listeners for wallet events with error handling
        this.addEthereumEventListeners();
        
        // Check if already connected
        const accounts = await this.provider.listAccounts();
        if (accounts.length > 0) {
          this.signer = await this.provider.getSigner();
          await this.updateWalletInfo();
        }
        
        console.log('✅ Ethereum provider initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize provider from window.ethereum:', error);
        this.createFallbackProvider();
      }
    } else {
      // No injected provider available, create read-only provider
      console.warn('⚠️ No injected Ethereum provider found. Using read-only mode.');
      this.createFallbackProvider();
    }
  }
  
  /**
   * Safely add event listeners to window.ethereum
   * Uses the safe Ethereum utilities to handle read-only providers
   */
  private addEthereumEventListeners(): void {
    const success = [
      addEthereumEventListener('accountsChanged', this.handleAccountsChanged),
      addEthereumEventListener('chainChanged', this.handleChainChanged),
      addEthereumEventListener('disconnect', this.handleDisconnect)
    ];
    
    if (success.every(Boolean)) {
      console.log('✅ Ethereum event listeners added successfully');
    } else {
      console.warn('⚠️ Some Ethereum event listeners failed to add');
    }
  }
  
  /**
   * Create a fallback provider using the RPC URL from environment variables
   * This allows read-only blockchain interactions when no wallet is connected
   */
  private createFallbackProvider(): void {
    try {
      const rpcUrl = FALLBACK_RPC_URL;
      this.provider = new ethers.JsonRpcProvider(rpcUrl) as unknown as ethers.BrowserProvider;
      console.log('Created fallback provider with RPC URL:', rpcUrl);
    } catch (error) {
      console.error('Failed to create fallback provider:', error);
    }
  }

  /**
   * Connect to a wallet provider
   * @param providerType The type of provider to connect to
   * @returns Wallet info after connection
   */
  public async connect(providerType: ProviderType): Promise<WalletInfo> {
    try {
      this.providerType = providerType;
      
      // Get provider based on type
      switch (providerType) {
        case ProviderType.METAMASK:
          if (!isEthereumAvailable()) {
            throw this.createError(
              BlockchainErrorType.CONNECTION_ERROR,
              'MetaMask not found',
              'Please install MetaMask extension to connect your wallet'
            );
          }
          const ethereumProvider = getEthereumProvider();
          if (!ethereumProvider) {
            throw this.createError(
              BlockchainErrorType.CONNECTION_ERROR,
              'Failed to access Ethereum provider',
              'Unable to access your wallet. Please try refreshing the page.'
            );
          }
          this.provider = new ethers.BrowserProvider(ethereumProvider as any);
          break;
          
        case ProviderType.WALLET_CONNECT:
          // Implementation for WalletConnect would go here
          throw this.createError(
            BlockchainErrorType.CONNECTION_ERROR,
            'WalletConnect not implemented yet',
            'WalletConnect integration coming soon'
          );
          
        case ProviderType.COINBASE:
          // Implementation for Coinbase Wallet would go here
          throw this.createError(
            BlockchainErrorType.CONNECTION_ERROR,
            'Coinbase Wallet not implemented yet',
            'Coinbase Wallet integration coming soon'
          );
          
        default:
          throw this.createError(
            BlockchainErrorType.CONNECTION_ERROR,
            'Unsupported provider type',
            'This wallet type is not supported yet'
          );
      }

      // Request accounts from provider
      await this.provider.send('eth_requestAccounts', []);
      this.signer = await this.provider.getSigner();
      
      // Update wallet info
      await this.updateWalletInfo();
      
      // Notify listeners that connection state changed
      this.notifyConnectionListeners(true);
      
      return this.walletInfo!;
    } catch (error: unknown) {
      // Handle user rejected request
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: number }).code === 4001
      ) {
        throw this.createError(
          BlockchainErrorType.USER_REJECTED,
          'User rejected the connection request',
          'You declined the connection request. Please try again.'
        );
      }
      
      // Handle other errors
      throw this.createError(
        BlockchainErrorType.CONNECTION_ERROR,
        `Failed to connect to ${providerType}`,
        'Unable to connect to your wallet. Please try again.',
        error
      );
    }
  }

  /**
   * Disconnect from current wallet
   */
  public async disconnect(): Promise<void> {
    this.provider = null;
    this.signer = null;
    this.walletInfo = null;
    this.providerType = null;
    
    // Notify listeners that connection state changed
    this.notifyConnectionListeners(false);
  }

  /**
   * Get the current wallet information
   * @returns Current wallet info or null if not connected
   */
  public getWalletInfo(): WalletInfo | null {
    return this.walletInfo;
  }

  /**
   * Get the ethers provider instance
   * @returns Ethers provider or null if not connected
   */
  public getProvider(): ethers.BrowserProvider | null {
    return this.provider;
  }

  /**
   * Get the ethers signer instance
   * @returns Ethers signer or null if not connected
   */
  public getSigner(): ethers.JsonRpcSigner | null {
    return this.signer;
  }

  /**
   * Switch to a different blockchain network
   * @param chainId The chain ID to switch to
   */
  public async switchNetwork(chainId: number): Promise<void> {
    // Check if network is supported
    if (!isNetworkSupported(chainId)) {
      throw this.createError(
        BlockchainErrorType.NETWORK_ERROR,
        'Unsupported network',
        'This network is not supported by MegaVibe'
      );
    }

    // Check if we have an injected provider (MetaMask)
    if (typeof window !== 'undefined' && isEthereumAvailable()) {
      try {
        // Get network config
        const networkConfig = getNetworkConfig(chainId);
        
        // Try to switch to the network
        await requestFromEthereum('wallet_switchEthereumChain', [
          { chainId: `0x${chainId.toString(16)}` }
        ]);
        
        // Update provider and signer after network change
        const ethereumProvider = getEthereumProvider();
        if (ethereumProvider) {
          this.provider = new ethers.BrowserProvider(ethereumProvider as any);
          this.signer = await this.provider.getSigner();
          await this.updateWalletInfo();
        }
      } catch (error: unknown) {
        // This error code means the chain has not been added to MetaMask
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          (error as { code?: number }).code === 4902
        ) {
          const networkConfig = getNetworkConfig(chainId);
          if (!networkConfig) {
            throw this.createError(
              BlockchainErrorType.NETWORK_ERROR,
              "Network configuration not found",
              "Unable to add this network to your wallet"
            );
          }

          // Add the network to the wallet
          try {
            await requestFromEthereum('wallet_addEthereumChain', [
              {
                chainId: `0x${chainId.toString(16)}`,
                chainName: networkConfig.name,
                nativeCurrency: networkConfig.nativeCurrency,
                rpcUrls: [networkConfig.rpcUrl],
                blockExplorerUrls: [networkConfig.blockExplorerUrl],
              },
            ]);

            // Update provider and signer after network added
            const ethereumProvider = getEthereumProvider();
            if (ethereumProvider) {
              this.provider = new ethers.BrowserProvider(ethereumProvider as any);
              this.signer = await this.provider.getSigner();
              await this.updateWalletInfo();
            }
          } catch (addError) {
            throw this.createError(
              BlockchainErrorType.NETWORK_ERROR,
              "Failed to add network to wallet",
              "Unable to add the network to your wallet. Please try again.",
              addError
            );
          }
        } else {
          throw this.createError(
            BlockchainErrorType.NETWORK_ERROR,
            "Failed to switch network",
            "Unable to switch networks. Please try again.",
            error
          );
        }
      }
    } else {
      // No injected provider available
      // Create a new read-only provider for the requested network
      try {
        const networkConfig = getNetworkConfig(chainId);
        if (!networkConfig) {
          throw this.createError(
            BlockchainErrorType.NETWORK_ERROR,
            'Network configuration not found',
            'Unable to switch to this network'
          );
        }
        
        this.provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl) as unknown as ethers.BrowserProvider;
        this.signer = null;
        this.walletInfo = null;
        
        console.log(`Switched to read-only mode for network: ${networkConfig.name}`);
      } catch (error) {
        throw this.createError(
          BlockchainErrorType.NETWORK_ERROR,
          'Failed to create provider for network',
          'Unable to switch to the requested network. Please try again.',
          error
        );
      }
    }
  }

  /**
   * Add event listener for account changes
   * @param listener Function to call when accounts change
   */
  public onAccountChanged(listener: (address: string) => void): void {
    this.accountChangedListeners.push(listener);
  }

  /**
   * Add event listener for chain changes
   * @param listener Function to call when chain changes
   */
  public onChainChanged(listener: (chainId: number) => void): void {
    this.chainChangedListeners.push(listener);
  }

  /**
   * Add event listener for connection changes
   * @param listener Function to call when connection state changes
   */
  public onConnectionChanged(listener: (isConnected: boolean) => void): void {
    this.connectionListeners.push(listener);
  }

  /**
   * Remove event listener for account changes
   * @param listener Function to remove
   */
  public removeAccountChangedListener(listener: (address: string) => void): void {
    this.accountChangedListeners = this.accountChangedListeners.filter(l => l !== listener);
  }

  /**
   * Remove event listener for chain changes
   * @param listener Function to remove
   */
  public removeChainChangedListener(listener: (chainId: number) => void): void {
    this.chainChangedListeners = this.chainChangedListeners.filter(l => l !== listener);
  }

  /**
   * Remove event listener for connection changes
   * @param listener Function to remove
   */
  public removeConnectionChangedListener(listener: (isConnected: boolean) => void): void {
    this.connectionListeners = this.connectionListeners.filter(l => l !== listener);
  }

  // Private methods

  /**
   * Update wallet information based on current provider and signer
   */
  private async updateWalletInfo(): Promise<void> {
    if (!this.provider || !this.signer) {
      this.walletInfo = null;
      return;
    }

    try {
      const address = await this.signer.getAddress();
      const network = await this.provider.getNetwork();
      const chainId = Number(network.chainId);
      const balance = await this.provider.getBalance(address);
      
      this.walletInfo = {
        address,
        chainId,
        balance: {
          mnt: balance.toString(),
          formatted: ethers.formatEther(balance),
        },
        isConnected: true,
        isSupported: isNetworkSupported(chainId),
      };
    } catch (error) {
      console.error('Failed to update wallet info:', error);
      this.walletInfo = null;
    }
  }

  /**
   * Handle account changes from wallet
   * @param accounts Array of new accounts
   */
  private handleAccountsChanged = async (accounts: string[]): Promise<void> => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      this.signer = null;
      this.walletInfo = null;
      this.notifyConnectionListeners(false);
    } else {
      // User switched accounts
      if (this.provider) {
        this.signer = await this.provider.getSigner();
        await this.updateWalletInfo();
        
        // Notify account changed listeners
        if (this.walletInfo) {
          this.accountChangedListeners.forEach(listener => {
            listener(this.walletInfo!.address);
          });
        }
      }
    }
  };

  /**
   * Handle chain changes from wallet
   * @param chainIdHex Hexadecimal chain ID
   */
  private handleChainChanged = async (chainIdHex: string): Promise<void> => {
    try {
      // Reload provider on chain change
      if (typeof window !== 'undefined' && isEthereumAvailable()) {
        const ethereumProvider = getEthereumProvider();
        if (ethereumProvider) {
          this.provider = new ethers.BrowserProvider(ethereumProvider as any);
        }
        if (this.walletInfo?.isConnected) {
          this.signer = await this.provider.getSigner();
          await this.updateWalletInfo();
          
          // Notify chain changed listeners
          if (this.walletInfo) {
            const chainId = parseInt(chainIdHex, 16);
            this.chainChangedListeners.forEach(listener => {
              listener(chainId);
            });
          }
        }
      } else {
        // This shouldn't normally happen since this handler is only registered
        // when window.ethereum is available, but just in case
        console.warn('Chain changed event received but no injected provider available');
        this.createFallbackProvider();
      }
    } catch (error) {
      console.error('Error handling chain change:', error);
      // Try to recover with fallback provider
      this.createFallbackProvider();
    }
  };

  /**
   * Handle disconnect events from wallet
   */
  private handleDisconnect = (): void => {
    this.provider = null;
    this.signer = null;
    this.walletInfo = null;
    this.providerType = null;
    
    // Notify connection listeners
    this.notifyConnectionListeners(false);
  };

  /**
   * Notify all connection listeners
   * @param isConnected Connection state
   */
  private notifyConnectionListeners(isConnected: boolean): void {
    this.connectionListeners.forEach(listener => {
      listener(isConnected);
    });
  }

  /**
   * Create a structured blockchain error
   */
  private createError(
    type: BlockchainErrorType,
    message: string,
    userMessage?: string,
    details?: unknown
  ): BlockchainError {
    return {
      type,
      message,
      userMessage,
      details,
    };
  }
}

// Create singleton instance
export const providerService = new ProviderService();

export default providerService;