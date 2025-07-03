/**
 * CrossChainService.ts
 * 
 * Service for handling cross-chain operations, including
 * bridging tokens between chains, fetching balances across chains,
 * and tracking cross-chain transactions.
 * 
 * This implementation prepares for integration with LI.FI SDK
 * with robust error handling and validation.
 */

import { BaseService, ServiceResponse, ErrorCode } from './BaseService';
import { ethers } from 'ethers';
import ConfigService, { ChainConfig } from './ConfigService';
import ErrorHandlingService from './ErrorHandlingService';
import ValidationService from './ValidationService';
import StateService from './StateService';

// Chain & token information types
export interface ChainInfo {
  id: number;
  name: string;
  isTestnet: boolean;
  nativeBalance?: string;
  usdcBalance?: string;
  usdcAddress?: string;
}

export enum CrossChainStatus {
  PENDING = 'pending',
  BRIDGING = 'bridging',
  CONFIRMING = 'confirming',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface CrossChainTransactionStatus {
  status: CrossChainStatus;
  txHash?: string;
  message?: string;
  progress?: number; // 0-100
  error?: Error;
  sourceChain?: number;
  destinationChain?: number;
  startTime?: number;
  endTime?: number;
  bridgeUsed?: string;
  gasUsed?: string;
  detailedStatus?: any;
}

export interface CrossChainQuote {
  sourceChain: number;
  destinationChain: number;
  inputAmount: string;
  outputAmount: string;
  estimatedGasUSD: string;
  bridgeFeeUSD: string;
  estimatedTime: number; // In seconds
  routes: string[];
  routeId?: string;
  steps?: any[]; // Generic type to avoid SDK compatibility issues
}

export interface CrossChainTipResult {
  success: boolean;
  txHash?: string;
  error?: string;
  routeId?: string;
}

export type StatusCallback = (status: CrossChainTransactionStatus) => void;

// LI.FI SDK interfaces (to be replaced with actual SDK when integrated)
interface Chain {
  id: number;
  name: string;
  key?: string;
  chainType?: string;
}

interface Token {
  address: string;
  symbol: string;
  decimals: number;
  name: string;
  chainId: number;
  coinKey?: string;
}

interface RoutesRequest {
  fromChainId: number;
  toChainId: number;
  fromTokenAddress: string;
  toTokenAddress: string;
  fromAmount: string;
  options?: {
    order?: 'RECOMMENDED' | 'FASTEST' | 'CHEAPEST';
    slippage?: number;
    allowSwitchChain?: boolean;
  };
}

interface RoutesResponse {
  routes: Array<{
    id: string;
    steps: Array<{
      id: string;
      type: string;
      tool: string;
      action: string;
      estimate: {
        executionDuration: number;
        gasCosts: Array<{
          amount: string;
          amountUSD: string;
          token: Token;
        }>;
        feeCosts: Array<{
          amount: string;
          amountUSD: string;
          token: Token;
        }>;
      };
    }>;
    fromChainId: number;
    toChainId: number;
    fromAmount: string;
    toAmount: string;
  }>;
}

// Mock LI.FI SDK for development
class LiFiSDK {
  private apiUrl: string;
  private integrator: string;

  constructor(options: { apiUrl: string; integrator: string }) {
    this.apiUrl = options.apiUrl;
    this.integrator = options.integrator;
  }

  async getChains(): Promise<Chain[]> {
    // In production, this would make an API call to LI.FI
    // For now, return chains from ConfigService
    const configuredChains = ConfigService.get<ChainConfig[]>('chains', []);
    return configuredChains.map(chain => ({
      id: chain.id,
      name: chain.name,
      key: chain.name.toLowerCase().replace(' ', '-')
    }));
  }

  async getTokens(options: { chains: number[] }): Promise<Record<number, Token[]>> {
    // In production, this would make an API call to LI.FI
    // For now, return USDC from each chain's config
    const result: Record<number, Token[]> = {};
    
    for (const chainId of options.chains) {
      const chainConfig = ConfigService.getChainConfig(chainId);
      if (chainConfig) {
        const usdcAddress = chainConfig.contractAddresses.USDC;
        if (usdcAddress) {
          result[chainId] = [{
            address: usdcAddress,
            symbol: 'USDC',
            decimals: 6,
            name: 'USD Coin',
            chainId: chainId,
            coinKey: 'USDC'
          }];
        } else {
          result[chainId] = [];
        }
      } else {
        result[chainId] = [];
      }
    }
    
    return result;
  }

  async getRoutes(request: RoutesRequest): Promise<RoutesResponse> {
    // In production, this would make an API call to LI.FI
    // For now, return a mock route
    const amountBN = BigInt(request.fromAmount);
    const fee = amountBN * BigInt(2) / BigInt(100); // 2% fee
    const outputAmount = amountBN - fee;
    
    return {
      routes: [{
        id: `route-${Date.now()}`,
        steps: [{
          id: `step-${Date.now()}`,
          type: 'swap',
          tool: 'multichain',
          action: 'swap',
          estimate: {
            executionDuration: request.fromChainId === request.toChainId ? 30 : 600,
            gasCosts: [{
              amount: '100000000000000',
              amountUSD: '2.50',
              token: {
                address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
                symbol: 'ETH',
                decimals: 18,
                name: 'Ethereum',
                chainId: request.fromChainId
              }
            }],
            feeCosts: [{
              amount: fee.toString(),
              amountUSD: ethers.formatUnits(fee, 6),
              token: {
                address: request.fromTokenAddress,
                symbol: 'USDC',
                decimals: 6,
                name: 'USD Coin',
                chainId: request.fromChainId
              }
            }]
          }
        }],
        fromChainId: request.fromChainId,
        toChainId: request.toChainId,
        fromAmount: request.fromAmount,
        toAmount: outputAmount.toString()
      }]
    };
  }

  async executeStep(
    step: any, 
    signer: ethers.Signer, 
    settings: { infiniteApproval: boolean }
  ): Promise<{ hash: string }> {
    // In production, this would execute the transaction through LI.FI
    // For now, return a mock transaction hash
    return {
      hash: `0x${Math.random().toString(36).substring(2, 15)}`
    };
  }

  async getStatus(request: { 
    txHash: string; 
    bridge?: string; 
    fromChain: number; 
    toChain: number 
  }): Promise<{
    status: 'DONE' | 'PENDING' | 'NOT_FOUND' | 'FAILED';
    message?: string;
    steps?: Array<{ status: string }>;
  }> {
    // In production, this would check the status through LI.FI API
    // For now, randomly return a status
    const statuses = ['PENDING', 'DONE', 'FAILED'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      status: randomStatus as any,
      message: randomStatus === 'FAILED' ? 'Transaction failed' : undefined,
      steps: [{
        status: randomStatus
      }]
    };
  }
}

export class CrossChainService extends BaseService {
  private currentChainId: number | null = null;
  private providers: Record<number, ethers.Provider> = {};
  private signer: ethers.Signer | null = null;
  private transactions: Record<string, CrossChainTransactionStatus> = {};
  private lifi: LiFiSDK;
  private supportedChains: Chain[] = [];
  private supportedTokens: Record<number, Token[]> = {};
  private readonly statusCheckInterval = 15000; // 15 seconds
  private statusCheckTimers: Record<string, NodeJS.Timeout> = {};

  constructor() {
    super('CrossChainService');
    // Initialize LI.FI SDK (using our mock implementation for now)
    this.lifi = new LiFiSDK({
      integrator: 'MegaVibe',
      apiUrl: ConfigService.get('services.lifiApiUrl', 'https://li.quest/v1'),
    });
  }

  /**
   * Initialize the service with provider and signer
   */
  public async initialize(
    provider: ethers.Provider,
    signer: ethers.Signer
  ): Promise<ServiceResponse<boolean>> {
    return this.executeOperation(async () => {
      try {
        this.signer = signer;

        // Get current chain ID
        const network = await provider.getNetwork();
        this.currentChainId = Number(network.chainId);

        // Initialize provider for current chain
        this.providers[this.currentChainId] = provider;

        // Load supported chains from LI.FI
        await this.loadSupportedChains();
        
        // Get USDC token for current chain
        if (this.currentChainId) {
          await this.loadSupportedTokens(this.currentChainId);
        }

        this.logInfo(`CrossChainService initialized on chain ${this.getChainName(this.currentChainId)}`);
        return true;
      } catch (error) {
        ErrorHandlingService.handleError({
          service: 'CrossChainService',
          operation: 'initialize',
          error: error as Error,
          level: 'critical',
          context: { chainId: this.currentChainId }
        });
        throw error;
      }
    }, 'Failed to initialize CrossChainService');
  }

  /**
   * Load supported chains from LI.FI
   */
  private async loadSupportedChains(): Promise<void> {
    try {
      this.logInfo('Loading supported chains from LI.FI');
      
      // Get chains from LI.FI
      const chains = await this.lifi.getChains();
      
      // Filter to only include chains configured in our app
      const configuredChains = ConfigService.get<ChainConfig[]>('chains', []);
      const configuredChainIds = configuredChains.map(chain => chain.id);
      
      this.supportedChains = chains.filter(chain => configuredChainIds.includes(chain.id));
      
      this.logInfo(`Loaded ${this.supportedChains.length} supported chains`);
    } catch (error) {
      this.logError('Failed to load supported chains', error);
      ErrorHandlingService.handleError({
        service: 'CrossChainService',
        operation: 'loadSupportedChains',
        error: error as Error,
        level: 'warning'
      });
    }
  }

  /**
   * Load supported tokens for a chain
   */
  private async loadSupportedTokens(chainId: number): Promise<void> {
    try {
      this.logInfo(`Loading supported tokens for chain ${chainId}`);
      
      // Get tokens from LI.FI
      const tokens = await this.lifi.getTokens({ chains: [chainId] });
      
      // Store tokens
      this.supportedTokens[chainId] = tokens[chainId] || [];
      
      this.logInfo(`Loaded ${this.supportedTokens[chainId].length} tokens for chain ${chainId}`);
    } catch (error) {
      this.logError(`Failed to load supported tokens for chain ${chainId}`, error);
      ErrorHandlingService.handleError({
        service: 'CrossChainService',
        operation: 'loadSupportedTokens',
        error: error as Error,
        level: 'warning',
        context: { chainId }
      });
    }
  }

  /**
   * Get information about all supported chains
   */
  public async getSupportedChains(): Promise<ServiceResponse<ChainInfo[]>> {
    return this.executeOperation(async () => {
      this.logInfo('Getting supported chains');
      
      if (this.supportedChains.length === 0) {
        await this.loadSupportedChains();
      }
      
      const chains: ChainInfo[] = this.supportedChains.map(chain => {
        const configChain = ConfigService.getChainConfig(chain.id);
        
        return {
          id: chain.id,
          name: chain.name,
          isTestnet: Boolean(configChain?.isTestnet),
          usdcAddress: configChain?.contractAddresses.USDC
        };
      });
      
      return chains;
    }, 'Failed to get supported chains');
  }

  /**
   * Get supported source chains for bridging
   */
  public async getSupportedSourceChains(): Promise<ServiceResponse<number[]>> {
    return this.executeOperation(async () => {
      this.logInfo('Getting supported source chains');
      
      if (this.supportedChains.length === 0) {
        await this.loadSupportedChains();
      }
      
      // Return all supported chains except the current one
      const chainIds = this.supportedChains
        .map(chain => chain.id)
        .filter(id => id !== this.currentChainId);
      
      return chainIds;
    }, 'Failed to get supported source chains');
  }

  /**
   * Get USDC balances across chains for an address
   */
  public async getUSDCBalances(
    address: string
  ): Promise<ServiceResponse<Record<number, string>>> {
    return this.executeOperation(async () => {
      // Validate the address
      if (!ValidationService.isValidAddress(address)) {
        throw new Error(`Invalid address: ${address}`);
      }
      
      this.logInfo(`Getting USDC balances for ${address}`);
      
      if (this.supportedChains.length === 0) {
        await this.loadSupportedChains();
      }
      
      const balances: Record<number, string> = {};
      const chainIds = this.supportedChains.map(chain => chain.id);
      
      // Get balances in parallel
      const promises = chainIds.map(async (chainId) => {
        try {
          const balance = await this.getUSDCBalanceForChain(address, chainId);
          balances[chainId] = balance;
        } catch (error) {
          this.logError(`Failed to get USDC balance for chain ${chainId}`, error);
          balances[chainId] = '0';
          
          ErrorHandlingService.handleError({
            service: 'CrossChainService',
            operation: 'getUSDCBalance',
            error: error as Error,
            level: 'warning',
            context: { chainId, address }
          });
        }
      });
      
      await Promise.all(promises);
      return balances;
    }, `Failed to get USDC balances for ${address}`);
  }

  /**
   * Get a quote for bridging USDC between chains using LI.FI
   */
  public async getQuote(
    sourceChainId: number,
    destinationChainId: number,
    amount: string
  ): Promise<ServiceResponse<CrossChainQuote>> {
    return this.executeOperation(async () => {
      // Validate inputs
      if (!ValidationService.isPositiveNumber(sourceChainId)) {
        throw new Error(`Invalid source chain ID: ${sourceChainId}`);
      }
      
      if (!ValidationService.isPositiveNumber(destinationChainId)) {
        throw new Error(`Invalid destination chain ID: ${destinationChainId}`);
      }
      
      if (!ValidationService.isPositiveDecimalString(amount)) {
        throw new Error(`Invalid amount: ${amount}`);
      }
      
      this.logInfo(`Getting quote from chain ${sourceChainId} to ${destinationChainId} for ${amount} USDC`);
      
      // Get USDC addresses for chains
      const sourceChainConfig = ConfigService.getChainConfig(sourceChainId);
      const destChainConfig = ConfigService.getChainConfig(destinationChainId);
      
      if (!sourceChainConfig || !destChainConfig) {
        throw new Error(`Chain configuration missing for chain ${!sourceChainConfig ? sourceChainId : destinationChainId}`);
      }
      
      const sourceUsdcAddress = sourceChainConfig.contractAddresses.USDC;
      const destUsdcAddress = destChainConfig.contractAddresses.USDC;
      
      if (!sourceUsdcAddress || !destUsdcAddress) {
        throw new Error(`USDC address missing for chain ${!sourceUsdcAddress ? sourceChainId : destinationChainId}`);
      }
      
      // Convert amount to BigInt with 6 decimals (USDC standard)
      const amountParsed = ethers.parseUnits(amount, 6);
      
      // Create routes request with the correct options format
      const routesRequest: RoutesRequest = {
        fromChainId: sourceChainId,
        toChainId: destinationChainId,
        fromTokenAddress: sourceUsdcAddress,
        toTokenAddress: destUsdcAddress,
        fromAmount: amountParsed.toString(),
        options: {
          // Order by recommended route first
          order: 'RECOMMENDED'
        }
      };
      
      // Get routes from LI.FI
      const routesResponse = await this.lifi.getRoutes(routesRequest);
      
      if (!routesResponse.routes || routesResponse.routes.length === 0) {
        throw new Error(`No routes found from chain ${sourceChainId} to ${destinationChainId}`);
      }
      
      // Get the recommended route (first one)
      const route = routesResponse.routes[0];
      
      // Format the quote
      const bridgeNames = route.steps.map(step => step.tool);
      const estimatedGas = route.steps.reduce((total, step) => total + Number(step.estimate.gasCosts?.[0]?.amount || 0), 0);
      const estimatedGasUSD = route.steps.reduce((total, step) => total + Number(step.estimate.gasCosts?.[0]?.amountUSD || 0), 0);
      const bridgeFee = route.steps.reduce((total, step) => total + Number(step.estimate.feeCosts?.[0]?.amountUSD || 0), 0);
      
      const quote: CrossChainQuote = {
        sourceChain: sourceChainId,
        destinationChain: destinationChainId,
        inputAmount: amount,
        outputAmount: ethers.formatUnits(route.toAmount, 6),
        estimatedGasUSD: estimatedGasUSD.toFixed(2),
        bridgeFeeUSD: bridgeFee.toFixed(2),
        estimatedTime: route.steps.reduce((total, step) => total + step.estimate.executionDuration, 0),
        routes: bridgeNames,
        routeId: route.id,
        steps: route.steps // Using the LiFi step type directly
      };
      
      return quote;
    }, `Failed to get quote from chain ${sourceChainId} to ${destinationChainId}`);
  }

  /**
   * Send a cross-chain tip to a speaker using LI.FI
   */
  public async sendCrossChainTip(
    sourceChainId: number,
    recipientAddress: string,
    amountUSD: number,
    message: string,
    eventId: string,
    speakerId: string,
    statusCallback: StatusCallback
  ): Promise<CrossChainTipResult> {
    try {
      // Validate inputs
      if (!ValidationService.isPositiveNumber(sourceChainId)) {
        throw new Error(`Invalid source chain ID: ${sourceChainId}`);
      }
      
      if (!ValidationService.isValidAddress(recipientAddress)) {
        throw new Error(`Invalid recipient address: ${recipientAddress}`);
      }
      
      if (!ValidationService.isPositiveNumber(amountUSD)) {
        throw new Error(`Invalid amount: ${amountUSD}`);
      }
      
      this.logInfo(`Sending cross-chain tip from chain ${sourceChainId} to ${recipientAddress}`);
      
      if (!this.signer) {
        throw new Error('Signer not initialized');
      }
      
      // Create a unique transaction ID
      const txId = `tip-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Initialize transaction status
      const status: CrossChainTransactionStatus = {
        status: CrossChainStatus.PENDING,
        message: 'Preparing transaction...',
        progress: 0,
        sourceChain: sourceChainId,
        destinationChain: this.currentChainId,
        startTime: Date.now()
      };
      
      this.transactions[txId] = status;
      statusCallback(status);
      
      // Check if this is a cross-chain transaction
      const isCrossChain = sourceChainId !== this.currentChainId;
      
      if (isCrossChain) {
        // Get USDC amount with 6 decimals precision
        const amountStr = amountUSD.toFixed(6);
        
        // Get quote
        const quoteResponse = await this.getQuote(sourceChainId, this.currentChainId!, amountStr);
        
        if (!quoteResponse.success || !quoteResponse.data) {
          throw new Error(`Failed to get quote: ${quoteResponse.error?.message}`);
        }
        
        const quote = quoteResponse.data;
        
        // Update status
        status.status = CrossChainStatus.BRIDGING;
        status.message = 'Preparing bridge transaction...';
        status.progress = 10;
        statusCallback({ ...status });
        
        // Get the route
        if (!quote.routeId || !quote.steps) {
          throw new Error('Invalid quote: missing route information');
        }
        
        // Execute the route
        const signerAddress = await this.signer.getAddress();
        
        // Update status
        status.message = 'Waiting for transaction approval...';
        status.progress = 20;
        statusCallback({ ...status });
        
        // Execute the first step of the route
        const step = quote.steps[0];
        
        // Use the executeStep method with the proper parameters
        const executionResult = await this.lifi.executeStep(
          step,
          this.signer,
          {
            infiniteApproval: false // For security, don't use infinite approvals
          }
        );
        
        // Update status with transaction hash
        status.txHash = executionResult.hash;
        status.message = 'Bridging assets across chains...';
        status.progress = 30;
        status.bridgeUsed = step.tool;
        statusCallback({ ...status });
        
        // Start monitoring the transaction status
        this.monitorTransaction(txId, quote.routeId, statusCallback);
        
        // Store in the state for later reference
        StateService.dispatch({
          type: 'crosschain/addTransaction',
          payload: {
            id: txId,
            sourceChain: sourceChainId,
            destinationChain: this.currentChainId,
            amount: amountUSD,
            recipientAddress,
            status: status.status,
            txHash: status.txHash,
            message,
            eventId,
            speakerId,
            timestamp: Date.now()
          }
        });
        
        return {
          success: true,
          txHash: status.txHash,
          routeId: quote.routeId
        };
      } else {
        // Same chain transaction - use TippingService directly
        // Emit an event that can be picked up by TippingService
        StateService.dispatch({
          type: 'tipping/requestTip',
          payload: {
            recipientAddress,
            amountUSD,
            message,
            eventId,
            speakerId,
            transactionId: txId
          }
        });
        
        // Update status to completed (the actual transaction will be handled by TippingService)
        status.status = CrossChainStatus.PENDING;
        status.message = 'Processing same-chain transaction...';
        status.progress = 50;
        statusCallback({ ...status });
        
        return {
          success: true
        };
      }
    } catch (error) {
      this.logError('Failed to send cross-chain tip', error);
      
      ErrorHandlingService.handleError({
        service: 'CrossChainService',
        operation: 'sendCrossChainTip',
        error: error as Error,
        level: 'error',
        context: { 
          sourceChainId, 
          recipientAddress, 
          amountUSD, 
          eventId,
          speakerId 
        }
      });
      
      // Update status to failed
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      statusCallback({
        status: CrossChainStatus.FAILED,
        message: 'Transaction failed',
        error: error instanceof Error ? error : new Error(errorMessage)
      });
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Monitor transaction status using LI.FI status API
   */
  private monitorTransaction(
    txId: string,
    routeId: string,
    statusCallback: StatusCallback
  ): void {
    // Set up a status check timer
    const intervalId = setInterval(async () => {
      try {
        const status = this.transactions[txId];
        if (!status) {
          clearInterval(intervalId);
          return;
        }
        
        // If already completed or failed, stop checking
        if (status.status === CrossChainStatus.COMPLETED || status.status === CrossChainStatus.FAILED) {
          clearInterval(intervalId);
          return;
        }
        
        // Get status from LI.FI using GetStatusRequest
        const statusResponse = await this.lifi.getStatus({
          txHash: status.txHash!,
          bridge: status.bridgeUsed,
          fromChain: status.sourceChain!,
          toChain: status.destinationChain!
        });
        
        // Update transaction status
        status.detailedStatus = statusResponse;
        
        switch (statusResponse.status) {
          case 'DONE':
            status.status = CrossChainStatus.COMPLETED;
            status.message = 'Transaction completed successfully!';
            status.progress = 100;
            status.endTime = Date.now();
            
            // Update state
            StateService.dispatch({
              type: 'crosschain/updateTransaction',
              payload: {
                id: txId,
                status: 'completed',
                endTime: status.endTime
              }
            });
            
            // Clear the interval
            clearInterval(intervalId);
            break;
            
          case 'PENDING':
            status.status = CrossChainStatus.BRIDGING;
            status.message = 'Bridging in progress...';
            status.progress = 50;
            break;
            
          case 'NOT_FOUND':
            // Transaction not yet indexed, keep checking
            status.message = 'Waiting for transaction to be indexed...';
            status.progress = 40;
            break;
            
          case 'FAILED':
            status.status = CrossChainStatus.FAILED;
            status.message = statusResponse.message || 'Transaction failed';
            status.error = new Error(status.message);
            status.endTime = Date.now();
            
            // Update state
            StateService.dispatch({
              type: 'crosschain/updateTransaction',
              payload: {
                id: txId,
                status: 'failed',
                error: status.message,
                endTime: status.endTime
              }
            });
            
            // Clear the interval
            clearInterval(intervalId);
            break;
            
          default:
            // Update progress based on step progress
            if (statusResponse.steps && statusResponse.steps.length > 0) {
              const completedSteps = statusResponse.steps.filter(s => s.status === 'DONE').length;
              const totalSteps = statusResponse.steps.length;
              const stepProgress = (completedSteps / totalSteps) * 100;
              
              status.progress = 30 + Math.floor(stepProgress * 0.7); // 30% to 100%
              status.message = `Processing step ${completedSteps} of ${totalSteps}...`;
              
              if (completedSteps > 0 && completedSteps < totalSteps) {
                status.status = CrossChainStatus.CONFIRMING;
              }
            }
        }
        
        // Notify callback with updated status
        statusCallback({ ...status });
        
      } catch (error) {
        this.logError(`Failed to check transaction status for ${txId}`, error);
        
        // Don't fail the transaction just because we couldn't check status
        ErrorHandlingService.handleError({
          service: 'CrossChainService',
          operation: 'monitorTransaction',
          error: error as Error,
          level: 'warning',
          context: { txId, routeId }
        });
      }
    }, this.statusCheckInterval);
    
    // Store the interval ID for cleanup
    this.statusCheckTimers[txId] = intervalId;
  }

  /**
   * Get transaction status by ID
   */
  public getTransactionStatus(txId: string): CrossChainTransactionStatus | null {
    return this.transactions[txId] || null;
  }

  /**
   * Get chain name by ID
   */
  public getChainName(chainId: number): string {
    // Try to get from supported chains
    const chain = this.supportedChains.find(c => c.id === chainId);
    if (chain) {
      return chain.name;
    }
    
    // Fall back to config
    const configChain = ConfigService.getChainConfig(chainId);
    return configChain?.name || `Chain ${chainId}`;
  }

  /**
   * Get current chain ID
   */
  public getCurrentChainId(): number {
    if (!this.currentChainId) {
      // Default to the default chain from config
      return ConfigService.get<number>('settings.defaultChainId', 1);
    }
    return this.currentChainId;
  }

  /**
   * Helper method to get USDC balance on a specific chain
   */
  private async getUSDCBalanceForChain(address: string, chainId: number): Promise<string> {
    // Get or create provider for the chain
    const provider = await this.getProviderForChain(chainId);
    
    // Get USDC address for the chain from config
    const chainConfig = ConfigService.getChainConfig(chainId);
    if (!chainConfig) {
      throw new Error(`Chain configuration not found for chain ${chainId}`);
    }
    
    const usdcAddress = chainConfig.contractAddresses.USDC;
    if (!usdcAddress) {
      throw new Error(`USDC address not found for chain ${chainId}`);
    }
    
    // Minimal ABI for balanceOf and decimals
    const tokenABI = [
      'function balanceOf(address owner) view returns (uint256)',
      'function decimals() view returns (uint8)'
    ];
    
    // Create USDC contract instance
    const usdcContract = new ethers.Contract(usdcAddress, tokenABI, provider);
    
    try {
      // Get balance
      const balance = await usdcContract.balanceOf(address);
      
      // Get decimals
      const decimals = await usdcContract.decimals();
      
      // Format balance
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      this.logError(`Failed to get USDC balance for address ${address} on chain ${chainId}`, error);
      throw error;
    }
  }

  /**
   * Get or create provider for a specific chain
   */
  private async getProviderForChain(chainId: number): Promise<ethers.Provider> {
    // Return existing provider if available
    if (this.providers[chainId]) {
      return this.providers[chainId];
    }
    
    // Get chain config from ConfigService
    const chainConfig = ConfigService.getChainConfig(chainId);
    if (!chainConfig) {
      throw new Error(`Chain configuration not found for chain ${chainId}`);
    }
    
    // Get RPC URL for the chain
    const rpcUrl = chainConfig.rpcUrl;
    if (!rpcUrl) {
      throw new Error(`RPC URL not found for chain ${chainId}`);
    }
    
    // Create new provider
    let provider: ethers.Provider;
    try {
      // Handle environment variables in the RPC URL
      const processedRpcUrl = rpcUrl.replace(
        '${INFURA_KEY}', 
        import.meta.env.VITE_INFURA_KEY || 'YOUR_INFURA_KEY'
      );
      
      provider = new ethers.JsonRpcProvider(processedRpcUrl);
      
      // Test the provider
      await provider.getNetwork();
      
      // Cache provider
      this.providers[chainId] = provider;
      
      return provider;
    } catch (error) {
      this.logError(`Failed to create provider for chain ${chainId}`, error);
      throw new Error(`Failed to connect to chain ${chainId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    // Clear all status check timers
    Object.entries(this.statusCheckTimers).forEach(([_, timer]) => {
      clearInterval(timer);
    });
    
    this.statusCheckTimers = {};
  }
}

export default new CrossChainService();