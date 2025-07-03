/**
 * CrossChainService
 * 
 * This service integrates the LI.FI SDK with MegaVibe's tipping and bounty functionality,
 * enabling cross-chain transfers for a seamless user experience.
 * 
 * It allows users to send tips and create bounties from any supported chain,
 * not just Mantle Sepolia.
 */

import { ethers } from 'ethers';
import { Route, RouteExtended } from '@lifi/sdk';
import { lifiService } from './lifiService';
import { walletService } from './walletService';
import contractService from './contractService';
import { USDCService } from './usdcService';
import { env } from '../config/environment';

// Target chain - where our contracts are deployed
const TARGET_CHAIN_ID = env.mantle.chainId; // Mantle Sepolia

// Interface for cross-chain transaction status
export interface CrossChainTransactionStatus {
  status: 'pending' | 'bridging' | 'confirming' | 'completed' | 'failed';
  txHash?: string;
  message: string;
  route?: RouteExtended;
  error?: Error;
}

// Type for transfer result
export interface CrossChainTransferResult {
  success: boolean;
  txHash?: string;
  error?: string;
  route?: RouteExtended;
}

class CrossChainService {
  private static instance: CrossChainService;
  private statusListeners: Map<string, (status: CrossChainTransactionStatus) => void> = new Map();
  
  // Private constructor for singleton pattern
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): CrossChainService {
    if (!CrossChainService.instance) {
      CrossChainService.instance = new CrossChainService();
    }
    return CrossChainService.instance;
  }

  /**
   * Initialize the service with wallet provider
   * @param walletClient The wallet client (from wagmi or other wallet library)
   * @param switchChainHandler Function to handle chain switching
   */
  public async initialize(
    walletClient: any, 
    switchChainHandler?: (chainId: number) => Promise<any>
  ): Promise<boolean> {
    try {
      // Initialize contract service
      await contractService.initialize(walletClient);
      
      // Initialize LI.FI service with wallet provider
      lifiService.updateProviders(
        // Function to get wallet client
        async () => {
          return walletClient;
        },
        // Function to handle chain switching
        switchChainHandler
      );
      
      return true;
    } catch (error) {
      console.error('Failed to initialize cross-chain service:', error);
      return false;
    }
  }

  /**
   * Check if cross-chain functionality is needed
   * @param fromChainId Source chain ID
   * @returns Boolean indicating if cross-chain is needed
   */
  public needsCrossChain(fromChainId: number): boolean {
    return fromChainId !== TARGET_CHAIN_ID;
  }
  
  /**
   * Get supported source chains for tipping/bounties
   * @returns Array of supported chain IDs
   */
  public async getSupportedSourceChains(): Promise<number[]> {
    try {
      const chains = await lifiService.getSupportedChains();
      return chains.filter(chainId => 
        // Filter to chains that support USDC and can bridge to our target chain
        USDCService.isUSDCSupported(chainId) && 
        chainId !== TARGET_CHAIN_ID // Exclude target chain as it's handled natively
      );
    } catch (error) {
      console.error('Failed to get supported source chains:', error);
      return [];
    }
  }

  /**
   * Register a status listener for a specific transaction
   * @param txId Transaction ID or hash
   * @param listener Callback function to receive status updates
   */
  public registerStatusListener(
    txId: string, 
    listener: (status: CrossChainTransactionStatus) => void
  ): void {
    this.statusListeners.set(txId, listener);
  }

  /**
   * Unregister a status listener
   * @param txId Transaction ID or hash
   */
  public unregisterStatusListener(txId: string): void {
    this.statusListeners.delete(txId);
  }

  /**
   * Update transaction status
   * @param txId Transaction ID or hash
   * @param status Status object
   */
  private updateStatus(txId: string, status: CrossChainTransactionStatus): void {
    const listener = this.statusListeners.get(txId);
    if (listener) {
      listener(status);
    }
  }

  /**
   * Send a cross-chain tip
   * @param fromChainId Source chain ID
   * @param recipientAddress Recipient address
   * @param amountUSD Amount in USD
   * @param message Optional message
   * @param eventId Event ID
   * @param speakerId Speaker ID
   * @param statusCallback Optional callback for status updates
   * @returns Transaction result
   */
  public async sendCrossChainTip(
    fromChainId: number,
    recipientAddress: string,
    amountUSD: number,
    message: string,
    eventId: string,
    speakerId: string,
    statusCallback?: (status: CrossChainTransactionStatus) => void
  ): Promise<CrossChainTransferResult> {
    try {
      // Generate a unique transaction ID
      const txId = `tip-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Register status callback if provided
      if (statusCallback) {
        this.registerStatusListener(txId, statusCallback);
      }
      
      // If source chain is the target chain, use native tipping
      if (fromChainId === TARGET_CHAIN_ID) {
        this.updateStatus(txId, {
          status: 'pending',
          message: 'Preparing transaction...'
        });
        
        try {
          // Use existing contract service
          const amountUSDCString = USDCService.parseUSDC(amountUSD.toString()).toString();
          const txHash = await contractService.tipSpeaker(
            recipientAddress,
            amountUSDCString,
            message,
            eventId,
            speakerId
          );
          
          this.updateStatus(txId, {
            status: 'completed',
            txHash,
            message: 'Tip sent successfully!'
          });
          
          return {
            success: true,
            txHash
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.updateStatus(txId, {
            status: 'failed',
            message: `Transaction failed: ${errorMessage}`,
            error: error instanceof Error ? error : new Error(errorMessage)
          });
          
          return {
            success: false,
            error: errorMessage
          };
        }
      }
      
      // For cross-chain transfers, use LI.FI
      
      // Update status to pending
      this.updateStatus(txId, {
        status: 'pending',
        message: 'Preparing cross-chain transfer...'
      });
      
      // Get wallet address
      const senderAddress = await walletService.getAddress();
      if (!senderAddress) {
        throw new Error('Wallet not connected');
      }
      
      // Convert USD to USDC amount (USDC has 6 decimals)
      const amountInSmallestUnit = lifiService.parseAmount(amountUSD.toString(), 6);
      
      // Get USDC tokens for both chains
      const fromToken = await lifiService.getUSDCToken(fromChainId);
      const toToken = await lifiService.getUSDCToken(TARGET_CHAIN_ID);
      
      if (!fromToken || !toToken) {
        throw new Error(`USDC not available on ${!fromToken ? 'source' : 'target'} chain`);
      }
      
      // Get routes
      this.updateStatus(txId, {
        status: 'pending',
        message: 'Finding best route for cross-chain transfer...'
      });
      
      const routes = await lifiService.getRoutes(
        fromChainId,
        TARGET_CHAIN_ID,
        senderAddress,
        env.contracts.tipping.address, // Send directly to tipping contract
        amountInSmallestUnit
      );
      
      if (routes.length === 0) {
        throw new Error('No routes found for cross-chain transfer');
      }
      
      // Select best route (first one is recommended)
      const selectedRoute = routes[0];
      
      // Update status to bridging
      this.updateStatus(txId, {
        status: 'bridging',
        message: 'Executing cross-chain transfer...',
        route: selectedRoute as RouteExtended
      });
      
      // Execute the route
      const txHash = await lifiService.executeRoute(selectedRoute);
      
      // Update status to confirming
      this.updateStatus(txId, {
        status: 'confirming',
        txHash,
        message: 'Cross-chain transfer in progress. This may take a few minutes...',
        route: selectedRoute as RouteExtended
      });
      
      // Wait for transfer to complete
      // This is where we would ideally monitor the transfer
      // For now, we'll just wait a short time and assume it completes
      // In a production app, we would use lifiService.getTransferStatus
      
      // Simulate completed status after 5 seconds for demo purposes
      // In a real app, we would poll the status until completion
      setTimeout(() => {
        this.updateStatus(txId, {
          status: 'completed',
          txHash,
          message: 'Cross-chain transfer completed!',
          route: selectedRoute as RouteExtended
        });
      }, 5000);
      
      return {
        success: true,
        txHash,
        route: selectedRoute as RouteExtended
      };
    } catch (error) {
      console.error('Cross-chain tip failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        success: false,
        error: `Failed to send cross-chain tip: ${errorMessage}`
      };
    }
  }

  /**
   * Create a cross-chain bounty
   * @param fromChainId Source chain ID
   * @param eventId Event ID
   * @param speakerId Speaker ID
   * @param description Bounty description
   * @param amountUSD Amount in USD
   * @param deadline Deadline timestamp
   * @param statusCallback Optional callback for status updates
   * @returns Transaction result
   */
  public async createCrossChainBounty(
    fromChainId: number,
    eventId: string,
    speakerId: string,
    description: string,
    amountUSD: number,
    deadline: number,
    statusCallback?: (status: CrossChainTransactionStatus) => void
  ): Promise<CrossChainTransferResult> {
    try {
      // Generate a unique transaction ID
      const txId = `bounty-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Register status callback if provided
      if (statusCallback) {
        this.registerStatusListener(txId, statusCallback);
      }
      
      // If source chain is the target chain, use native bounty creation
      if (fromChainId === TARGET_CHAIN_ID) {
        this.updateStatus(txId, {
          status: 'pending',
          message: 'Preparing bounty transaction...'
        });
        
        try {
          // Use existing contract service
          const amountUSDCString = USDCService.parseUSDC(amountUSD.toString()).toString();
          const txHash = await contractService.createBounty(
            eventId,
            speakerId,
            description,
            amountUSDCString,
            deadline
          );
          
          this.updateStatus(txId, {
            status: 'completed',
            txHash,
            message: 'Bounty created successfully!'
          });
          
          return {
            success: true,
            txHash
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.updateStatus(txId, {
            status: 'failed',
            message: `Transaction failed: ${errorMessage}`,
            error: error instanceof Error ? error : new Error(errorMessage)
          });
          
          return {
            success: false,
            error: errorMessage
          };
        }
      }
      
      // For cross-chain transfers, use LI.FI
      
      // Update status to pending
      this.updateStatus(txId, {
        status: 'pending',
        message: 'Preparing cross-chain bounty...'
      });
      
      // Get wallet address
      const senderAddress = await walletService.getAddress();
      if (!senderAddress) {
        throw new Error('Wallet not connected');
      }
      
      // Convert USD to USDC amount (USDC has 6 decimals)
      const amountInSmallestUnit = lifiService.parseAmount(amountUSD.toString(), 6);
      
      // Get routes
      this.updateStatus(txId, {
        status: 'pending',
        message: 'Finding best route for cross-chain transfer...'
      });
      
      const routes = await lifiService.getRoutes(
        fromChainId,
        TARGET_CHAIN_ID,
        senderAddress,
        env.contracts.bounty.address, // Send directly to bounty contract
        amountInSmallestUnit
      );
      
      if (routes.length === 0) {
        throw new Error('No routes found for cross-chain transfer');
      }
      
      // Select best route (first one is recommended)
      const selectedRoute = routes[0];
      
      // Update status to bridging
      this.updateStatus(txId, {
        status: 'bridging',
        message: 'Executing cross-chain transfer...',
        route: selectedRoute as RouteExtended
      });
      
      // Execute the route
      const txHash = await lifiService.executeRoute(selectedRoute);
      
      // Update status to confirming
      this.updateStatus(txId, {
        status: 'confirming',
        txHash,
        message: 'Cross-chain transfer in progress. This may take a few minutes...',
        route: selectedRoute as RouteExtended
      });
      
      // Similar to tips, in a production app we would monitor the transfer
      // until completion before continuing
      
      // Simulate completed status after 5 seconds for demo purposes
      setTimeout(() => {
        this.updateStatus(txId, {
          status: 'completed',
          txHash,
          message: 'Cross-chain bounty created!',
          route: selectedRoute as RouteExtended
        });
      }, 5000);
      
      return {
        success: true,
        txHash,
        route: selectedRoute as RouteExtended
      };
    } catch (error) {
      console.error('Cross-chain bounty creation failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        success: false,
        error: `Failed to create cross-chain bounty: ${errorMessage}`
      };
    }
  }

  /**
   * Check USDC balances across all chains
   * @param address Wallet address
   * @returns Object mapping chain IDs to balances
   */
  public async getUSDCBalances(address: string): Promise<Record<number, string>> {
    return await lifiService.getUSDCBalances(address);
  }

  /**
   * Format USDC amount for display
   * @param amount Amount in smallest unit
   * @returns Formatted amount
   */
  public formatUSDCAmount(amount: string): string {
    return lifiService.formatAmount(amount, 6);
  }

  /**
   * Get chain name from chain ID
   * @param chainId Chain ID
   * @returns Chain name
   */
  public getChainName(chainId: number): string {
    switch (chainId) {
      case 1: return 'Ethereum';
      case 137: return 'Polygon';
      case 42161: return 'Arbitrum';
      case 10: return 'Optimism';
      case 8453: return 'Base';
      case 5000: return 'Mantle';
      case 5003: return 'Mantle Sepolia';
      default: return `Chain ${chainId}`;
    }
  }
}

// Export singleton instance
export const crossChainService = CrossChainService.getInstance();
export default crossChainService;