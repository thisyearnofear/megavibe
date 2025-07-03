/**
 * LI.FI Service for Cross-Chain Bridging
 * 
 * This service integrates with the LI.FI SDK to enable cross-chain USDC transfers
 * for tips and bounties across multiple blockchain networks.
 */

import { ethers } from 'ethers';
import { 
  ChainId, 
  EVM, 
  Route, 
  RouteExtended, 
  StatusResponse,
  config,
  executeRoute, 
  getChains, 
  getQuote,
  getRoutes, 
  getStatus, 
  getTokenBalances,
  getTokens
} from '@lifi/sdk';
import { USDC_ADDRESSES, LIFI_CONFIG } from '../config/lifiConfig';

// Type imports
import type { Token } from '@lifi/sdk';

// Chain information
export interface ChainInfo {
  id: number;
  name: string;
  icon: string;
}

// List of supported chains for the application
export const SUPPORTED_CHAINS: ChainInfo[] = [
  { id: 1, name: 'Ethereum', icon: '⟠' },
  { id: 137, name: 'Polygon', icon: '⬡' },
  { id: 42161, name: 'Arbitrum', icon: '↟' },
  { id: 10, name: 'Optimism', icon: '⧫' },
  { id: 8453, name: 'Base', icon: '⚐' },
  { id: 59144, name: 'Linea', icon: '⧂' }
];

/**
 * Get the name of a chain by its ID
 * @param chainId The chain ID
 * @returns The chain name or "Unknown Chain" if not found
 */
export function getChainName(chainId: number): string {
  const chain = SUPPORTED_CHAINS.find(c => c.id === chainId);
  return chain?.name || "Unknown Chain";
}

/**
 * Get the icon of a chain by its ID
 * @param chainId The chain ID
 * @returns The chain icon or "🔄" if not found
 */
export function getChainIcon(chainId: number): string {
  const chain = SUPPORTED_CHAINS.find(c => c.id === chainId);
  return chain?.icon || "🔄";
}

/**
 * Cross-chain tip quote interface
 */
export interface CrossChainTipQuote {
  fromChain: number;
  toChain: number;
  fromAmount: string;
  toAmount: string;
  fees: {
    platform: string;
    gas: string;
    bridge: string;
  };
  executionDuration: number;
  route?: any;
}

/**
 * Tip execution progress interface
 */
export interface TipExecutionProgress {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  currentStep: number;
  totalSteps: number;
  txHash?: string;
  explorerLink?: string;
  message?: string;
}

/**
 * Format a USDC amount from smallest unit to human-readable format
 * @param amount Amount in smallest unit (e.g., "1000000" for 1 USDC)
 * @returns Formatted amount as string (e.g., "1.0")
 */
export function formatUSDC(amount: string): string {
  // USDC has 6 decimal places
  return ethers.formatUnits(amount, 6);
}

/**
 * Parse a USDC amount from human-readable format to smallest unit
 * @param amount Amount in human-readable format (e.g., "1.0")
 * @returns Amount in smallest unit as string (e.g., "1000000")
 */
export function parseUSDC(amount: string): string {
  // USDC has 6 decimal places
  return ethers.parseUnits(amount, 6).toString();
}

/**
 * Interface for route execution store
 */
interface RouteExecutionStoreEntry {
  route: RouteExtended;
  status: string;
}

/**
 * Service for LI.FI SDK integration to handle cross-chain bridging
 * This enables USDC transfers across multiple chains for tips and bounties
 */
export class LifiService {
  // Singleton instance
  private static instance: LifiService;
  
  // Route execution store for managing active transfers
  private routeExecutionStore: Map<string, RouteExtended> = new Map();

  // Private constructor for singleton pattern
  private constructor() {
    this.setupProviders();
  }

  /**
   * Configure SDK providers for wallet interactions
   * Note: This should be called when wallet is connected
   */
  private setupProviders() {
    try {
      // Will be configured when wallet is connected
      console.log('LI.FI providers will be configured when wallet is connected');
    } catch (error) {
      console.error('Failed to configure LI.FI providers:', error);
    }
  }

  /**
   * Update providers with connected wallet
   * Call this method when wallet is connected
   * 
   * @param getWalletClientFn Function that returns a wallet client
   * @param switchChainFn Function to handle chain switching
   */
  public updateProviders(
    getWalletClientFn: () => Promise<any>, 
    switchChainFn?: (chainId: number) => Promise<any>
  ) {
    try {
      // Cast the functions to any to bypass type checking
      // In a production environment, you should properly type these functions
      const evmProvider = EVM({
        getWalletClient: getWalletClientFn as any,
        switchChain: switchChainFn as any
      });
      
      // Update SDK configuration with provider
      config.setProviders([evmProvider]);
      console.log('LI.FI providers configured with wallet');
    } catch (error) {
      console.error('Failed to update LI.FI providers:', error);
      throw new Error(`Failed to update LI.FI providers: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): LifiService {
    if (!LifiService.instance) {
      LifiService.instance = new LifiService();
    }
    return LifiService.instance;
  }

  /**
   * Get supported chains
   * @returns Array of supported chain IDs
   */
  public async getSupportedChains(): Promise<number[]> {
    try {
      const chains = await getChains();
      return chains.map(chain => chain.id);
    } catch (error) {
      console.error('Failed to get supported chains:', error);
      throw new Error(`Failed to get supported chains: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get USDC token information for a specific chain
   * @param chainId The chain ID
   * @returns USDC token information
   */
  public async getUSDCToken(chainId: number): Promise<Token | null> {
    try {
      const tokens = await getTokens({
        chains: [chainId],
      });
      
      const usdcAddress = USDC_ADDRESSES[chainId];
      
      if (!usdcAddress) {
        console.warn(`No known USDC address for chain ${chainId}`);
        return null;
      }

      // Find USDC in the tokens list
      const chainTokens = tokens.tokens[chainId] || [];
      const usdc = chainTokens.find(token => 
        token.address.toLowerCase() === usdcAddress.toLowerCase()
      );

      if (!usdc) {
        console.warn(`USDC not found on chain ${chainId}`);
        return null;
      }

      return usdc;
    } catch (error) {
      console.error(`Failed to get USDC token for chain ${chainId}:`, error);
      throw new Error(`Failed to get USDC token for chain ${chainId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if cross-chain bridging is supported between two chains
   * @param fromChainId Source chain ID
   * @param toChainId Destination chain ID
   * @returns Boolean indicating if bridging is supported
   */
  public async isBridgingSupported(fromChainId: number, toChainId: number): Promise<boolean> {
    try {
      const fromUSDC = await this.getUSDCToken(fromChainId);
      const toUSDC = await this.getUSDCToken(toChainId);

      if (!fromUSDC || !toUSDC) {
        return false;
      }

      // Use getQuote to check if a route exists
      try {
        const quote = await getQuote({
          fromChain: fromChainId,
          toChain: toChainId,
          fromToken: fromUSDC.address,
          toToken: toUSDC.address,
          fromAmount: '1000000', // 1 USDC as test amount
          fromAddress: '0x0000000000000000000000000000000000000000' // Dummy address for checking
        });
        
        return !!quote; // If we got a quote, bridging is supported
      } catch (error) {
        console.warn(`No bridging route available from ${fromChainId} to ${toChainId}:`, error);
        return false;
      }
    } catch (error) {
      console.error(`Failed to check bridging support from ${fromChainId} to ${toChainId}:`, error);
      return false;
    }
  }

  /**
   * Get available routes for cross-chain USDC transfer
   * @param fromChainId Source chain ID
   * @param toChainId Destination chain ID
   * @param fromAddress Sender address
   * @param toAddress Recipient address
   * @param amount Amount of USDC to transfer (in smallest unit, e.g., 1000000 = 1 USDC)
   * @returns Available routes
   */
  public async getRoutes(
    fromChainId: number,
    toChainId: number,
    fromAddress: string,
    toAddress: string,
    amount: string
  ): Promise<Route[]> {
    try {
      const fromUSDC = await this.getUSDCToken(fromChainId);
      const toUSDC = await this.getUSDCToken(toChainId);

      if (!fromUSDC || !toUSDC) {
        throw new Error(`USDC not available on ${!fromUSDC ? fromChainId : toChainId}`);
      }

      const routesRequest = {
        fromChainId,
        toChainId,
        fromTokenAddress: fromUSDC.address,
        toTokenAddress: toUSDC.address,
        fromAddress,
        toAddress,
        fromAmount: amount,
        options: {
          slippage: LIFI_CONFIG.defaultSlippage,
          order: LIFI_CONFIG.routeOptions.order,
          allowSwitchChain: LIFI_CONFIG.routeOptions.allowSwitchChain,
        }
      };

      const routesResponse = await getRoutes(routesRequest);
      return routesResponse.routes;
    } catch (error) {
      console.error('Failed to get routes:', error);
      throw new Error(`Failed to get routes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Execute a cross-chain transfer using the provided route
   * @param route Route object from getRoutes
   * @returns Transaction hash
   */
  public async executeRoute(route: Route): Promise<string> {
    try {
      if (!route) {
        throw new Error('No route provided');
      }
      
      // Track the route execution
      this.routeExecutionStore.set(route.id, route as RouteExtended);

      // Execute the route with hooks
      const executedRoute = await executeRoute(route, {
        // Update route status as execution progresses
        updateRouteHook: (updatedRoute) => {
          this.routeExecutionStore.set(updatedRoute.id, updatedRoute);
          console.log(`Route ${updatedRoute.id} status updated:`, this.getRouteStatus(updatedRoute));
        },
        
        // Handle token amount/exchange rate changes during execution
        // Using 'any' type to bypass TypeScript errors
        acceptExchangeRateUpdateHook: (async (toToken: any, oldAmount: any, newAmount: any) => {
          // Convert amounts to displayable format
          const oldValue = this.formatAmount(oldAmount, toToken.decimals);
          const newValue = this.formatAmount(newAmount, toToken.decimals);
          
          // Calculate percentage change
          const oldBigInt = BigInt(oldAmount);
          const newBigInt = BigInt(newAmount);
          
          // Check if new amount is less than old amount by more than 1%
          const acceptableThreshold = oldBigInt * BigInt(99) / BigInt(100);
          const isAcceptable = newBigInt >= acceptableThreshold;
          
          console.log(`Exchange rate update: ${oldValue} → ${newValue} (${isAcceptable ? 'acceptable' : 'significant change'})`);
          
          // Automatically accept small changes
          // In a real app, you might show a UI to let the user decide
          return isAcceptable;
        }) as any
      });
      
      // Get the transaction hash from the executed route
      return this.getLatestTxHash(executedRoute);
    } catch (error) {
      console.error('Failed to execute route:', error);
      throw new Error(`Failed to execute route: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gets the latest transaction hash from an executed route
   */
  private getLatestTxHash(route: RouteExtended): string {
    for (const step of route.steps) {
      if (step.execution?.process) {
        // Process array contains status updates in chronological order
        // Look for the most recent transaction hash
        for (let i = step.execution.process.length - 1; i >= 0; i--) {
          const process = step.execution.process[i];
          if (process.txHash) {
            return process.txHash;
          }
        }
      }
    }
    throw new Error('No transaction hash found in executed route');
  }

  /**
   * Get the current status of an executed route
   */
  private getRouteStatus(route: RouteExtended): string {
    let status = 'PENDING';
    
    for (const step of route.steps) {
      if (step.execution?.status) {
        // If any step failed, the route failed
        if (step.execution.status === 'FAILED') {
          return 'FAILED';
        }
        
        // If all steps are done, the route is done
        if (step.execution.status === 'DONE') {
          status = 'DONE';
        } else {
          // If any step is not done, the route is still in progress
          return step.execution.status;
        }
      }
    }
    
    return status;
  }

  /**
   * Check the status of a cross-chain transfer
   * @param txHash Transaction hash
   * @param fromChainId Source chain ID
   * @param toChainId Destination chain ID
   * @returns Status information
   */
  public async getTransferStatus(
    txHash: string,
    fromChainId: number,
    toChainId: number
  ): Promise<StatusResponse> {
    try {
      return await getStatus({
        txHash,
        fromChain: fromChainId,
        toChain: toChainId,
      });
    } catch (error) {
      console.error('Failed to get status:', error);
      throw new Error(`Failed to get transfer status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Estimate gas costs for a route
   * @param route The selected route
   * @returns Estimated gas costs in USD
   */
  public estimateGasCosts(route: Route): number {
    try {
      let totalGasCost = 0;
      
      if (route.steps) {
        for (const step of route.steps) {
          if (step.estimate?.gasCosts) {
            for (const gasCost of step.estimate.gasCosts) {
              const amount = parseFloat(gasCost.amount);
              const token = gasCost.token;
              if (token.priceUSD) {
                totalGasCost += amount * parseFloat(token.priceUSD);
              }
            }
          }
        }
      }
      
      return totalGasCost;
    } catch (error) {
      console.error('Failed to estimate gas costs:', error);
      return 0;
    }
  }

  /**
   * Estimate execution time for a route
   * @param route The selected route
   * @returns Estimated execution time in seconds
   */
  public estimateExecutionTime(route: Route): number {
    try {
      let totalTime = 0;
      
      if (route.steps) {
        for (const step of route.steps) {
          if (step.estimate?.executionDuration) {
            totalTime += step.estimate.executionDuration;
          }
        }
      }
      
      return totalTime;
    } catch (error) {
      console.error('Failed to estimate execution time:', error);
      return 0;
    }
  }

  /**
   * Format the amount for display
   * @param amount The amount in smallest unit
   * @param decimals Token decimals
   * @returns Formatted amount string
   */
  public formatAmount(amount: string, decimals: number): string {
    try {
      // Handle ethers v6 format
      return ethers.formatUnits(amount, decimals);
    } catch (error) {
      console.error('Failed to format amount:', error);
      throw new Error(`Failed to format amount: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Parse the amount from display format to smallest unit
   * @param amount The amount in display format
   * @param decimals Token decimals
   * @returns Amount in smallest unit
   */
  public parseAmount(amount: string, decimals: number): string {
    try {
      // Handle ethers v6 format
      return ethers.parseUnits(amount, decimals).toString();
    } catch (error) {
      console.error('Failed to parse amount:', error);
      throw new Error(`Failed to parse amount: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get USDC balances across all supported chains for an address
   * @param address Wallet address
   * @returns USDC balances by chain ID
   */
  public async getUSDCBalances(address: string): Promise<Record<number, string>> {
    try {
      const result: Record<number, string> = {};
      const chainIds = Object.keys(USDC_ADDRESSES).map(id => parseInt(id));
      
      // Get balances for each chain
      for (const chainId of chainIds) {
        const usdcAddress = USDC_ADDRESSES[chainId];
        if (!usdcAddress) continue;
        
        try {
          const token = await this.getUSDCToken(chainId);
          if (!token) continue;
          
          const tokenBalances = await getTokenBalances(address, [token]);
          
          if (tokenBalances && tokenBalances.length > 0) {
            // Convert BigInt to string if needed
            const balance = tokenBalances[0].amount;
            result[chainId] = typeof balance === 'bigint' ? balance.toString() : balance;
          }
        } catch (error) {
          console.warn(`Failed to get USDC balance for chain ${chainId}:`, error);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Failed to get USDC balances:', error);
      throw new Error(`Failed to get USDC balances: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Calculate the total USDC value across all chains
   * @param balances Record of USDC balances by chain ID
   * @returns Total value in USD
   */
  public calculateTotalUSDCValue(balances: Record<number, string>): number {
    let totalUSDValue = 0;
    
    for (const chainId in balances) {
      try {
        // Parse the balance and convert to USDC value (assuming 6 decimals for USDC)
        const balance = this.formatAmount(balances[chainId], 6);
        totalUSDValue += parseFloat(balance);
      } catch (error) {
        console.warn(`Failed to parse balance for chain ${chainId}:`, error);
      }
    }
    
    return totalUSDValue;
  }

  /**
   * Get active route by ID
   * @param routeId The route ID
   * @returns The active route
   */
  public getActiveRoute(routeId: string): RouteExtended | undefined {
    return this.routeExecutionStore.get(routeId);
  }

  /**
   * Get all active routes
   * @returns Array of active routes
   */
  public getActiveRoutes(): RouteExtended[] {
    return Array.from(this.routeExecutionStore.values());
  }

  /**
   * Get a quote for a cross-chain tip
   * @param tipData Data for the cross-chain tip
   * @returns Quote information including fees and estimated execution time
   */
  public async getCrossChainTipQuote(tipData: {
    fromChain: number;
    toChain: number;
    amount: string;
    fromAddress: string;
    toAddress: string;
    eventId: string;
    speakerId: string;
    message?: string;
  }): Promise<CrossChainTipQuote> {
    try {
      // Get the best route for this cross-chain transfer
      const routes = await this.getRoutes(
        tipData.fromChain,
        tipData.toChain,
        tipData.fromAddress,
        tipData.toAddress,
        tipData.amount
      );

      if (!routes || routes.length === 0) {
        throw new Error('No routes available for this cross-chain tip');
      }

      // Get the best route (first one)
      const bestRoute = routes[0];
      
      // Calculate fees
      const platformFee = BigInt(tipData.amount) * BigInt(5) / BigInt(100); // 5% platform fee
      const gasFee = this.estimateGasCosts(bestRoute).toString();
      const bridgeFee = (BigInt(tipData.amount) - BigInt(bestRoute.toAmount)).toString();
      
      // Create quote object
      const quote: CrossChainTipQuote = {
        fromChain: tipData.fromChain,
        toChain: tipData.toChain,
        fromAmount: tipData.amount,
        toAmount: bestRoute.toAmount,
        fees: {
          platform: platformFee.toString(),
          gas: gasFee,
          bridge: bridgeFee,
        },
        executionDuration: this.estimateExecutionTime(bestRoute),
        route: bestRoute
      };
      
      return quote;
    } catch (error) {
      console.error('Failed to get cross-chain tip quote:', error);
      throw new Error(`Failed to get cross-chain tip quote: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Execute a cross-chain tip
   * @param quote The quote object from getCrossChainTipQuote
   * @param tipData Tip data including message
   * @param progressCallback Callback function for progress updates
   * @returns Tip ID
   */
  public async executeCrossChainTip(
    quote: CrossChainTipQuote,
    tipData: {
      fromChain: number;
      toChain: number;
      amount: string;
      fromAddress: string;
      toAddress: string;
      eventId: string;
      speakerId: string;
      message?: string;
    },
    progressCallback?: (progress: TipExecutionProgress) => void
  ): Promise<string> {
    try {
      if (!quote.route) {
        throw new Error('Invalid quote: missing route information');
      }
      
      // Generate a unique tip ID
      const tipId = `tip-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Update progress
      if (progressCallback) {
        progressCallback({
          status: 'processing',
          currentStep: 1,
          totalSteps: 3,
          message: 'Executing cross-chain transfer...',
        });
      }
      
      // Execute the route
      const txHash = await this.executeRoute(quote.route);
      
      // Update progress with transaction hash
      if (progressCallback) {
        const explorerUrl = this.getChainConfig(tipData.fromChain)?.blockExplorerUrl || '';
        const explorerLink = explorerUrl ? `${explorerUrl}/tx/${txHash}` : '';
        
        progressCallback({
          status: 'processing',
          currentStep: 2,
          totalSteps: 3,
          txHash,
          explorerLink,
          message: 'Transaction submitted, waiting for confirmation...',
        });
      }
      
      // In a real implementation, we would wait for the transaction to be confirmed
      // and then track the cross-chain transfer, but for this demo we'll simulate completion
      setTimeout(() => {
        if (progressCallback) {
          progressCallback({
            status: 'completed',
            currentStep: 3,
            totalSteps: 3,
            txHash,
            message: 'Cross-chain tip completed successfully!',
          });
        }
      }, 5000);
      
      // Store the tip in local storage for demo purposes
      this.storeTipInLocalStorage({
        tipId,
        fromChain: tipData.fromChain,
        toChain: tipData.toChain,
        fromAmount: tipData.amount,
        toAmount: quote.toAmount,
        fromAddress: tipData.fromAddress,
        toAddress: tipData.toAddress,
        eventId: tipData.eventId,
        speakerId: tipData.speakerId,
        message: tipData.message,
        timestamp: Date.now(),
        txHash,
      });
      
      return tipId;
    } catch (error) {
      console.error('Failed to execute cross-chain tip:', error);
      if (progressCallback) {
        progressCallback({
          status: 'failed',
          currentStep: 0,
          totalSteps: 3,
          message: `Error: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
      throw new Error(`Failed to execute cross-chain tip: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Store tip information in local storage (for demo purposes)
   */
  private storeTipInLocalStorage(tipData: any): void {
    try {
      const storedTips = localStorage.getItem('crossChainTips');
      const tips = storedTips ? JSON.parse(storedTips) : [];
      tips.push(tipData);
      localStorage.setItem('crossChainTips', JSON.stringify(tips));
      
      // Also update cross-chain reputation
      const storedReputation = localStorage.getItem('crossChainReputation');
      const activities = storedReputation ? JSON.parse(storedReputation) : [];
      activities.push({
        sourceChain: tipData.fromChain,
        destinationChain: tipData.toChain,
        amount: tipData.fromAmount,
        timestamp: tipData.timestamp,
      });
      localStorage.setItem('crossChainReputation', JSON.stringify(activities));
    } catch (error) {
      console.error('Failed to store tip in localStorage:', error);
    }
  }

  /**
   * Get chain configuration for displaying in UI
   * @param chainId Chain ID
   * @returns Chain configuration or null if not found
   */
  private getChainConfig(chainId: number): { name: string, blockExplorerUrl: string } | null {
    // This is a simplified implementation
    const chainConfigs: Record<number, { name: string, blockExplorerUrl: string }> = {
      1: { name: 'Ethereum', blockExplorerUrl: 'https://etherscan.io' },
      137: { name: 'Polygon', blockExplorerUrl: 'https://polygonscan.com' },
      42161: { name: 'Arbitrum', blockExplorerUrl: 'https://arbiscan.io' },
      10: { name: 'Optimism', blockExplorerUrl: 'https://optimistic.etherscan.io' },
      8453: { name: 'Base', blockExplorerUrl: 'https://basescan.org' },
      5003: { name: 'Mantle Sepolia', blockExplorerUrl: 'https://explorer.sepolia.mantle.xyz' },
      59141: { name: 'Linea Sepolia', blockExplorerUrl: 'https://sepolia.lineascan.build' },
    };
    
    return chainConfigs[chainId] || null;
  }
}

// Export singleton instance
export const lifiService = LifiService.getInstance();
