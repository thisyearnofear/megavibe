// LI.FI SDK Integration for Cross-Chain USDC Tipping
import { 
  createConfig, 
  ChainId, 
  getQuote, 
  executeRoute, 
  convertQuoteToRoute,
  EVM,
  getChains,
  getTokens,
  ChainType
} from '@lifi/sdk';
import { env } from '../config/environment';

// USDC token addresses across supported chains
const USDC_ADDRESSES = {
  [ChainId.ETH]: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Ethereum
  [ChainId.ARB]: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum
  [ChainId.OPT]: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', // Optimism
  // [ChainId.LIN]: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff', // Linea - commented out if not available
  [ChainId.BAS]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base
  [ChainId.POL]: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // Polygon
};

// Supported chains for the hackathon
export const SUPPORTED_CHAINS = [
  { 
    id: ChainId.ETH, 
    name: 'Ethereum', 
    icon: '🔷',
    color: '#627EEA',
    gasToken: 'ETH'
  },
  { 
    id: ChainId.ARB, 
    name: 'Arbitrum', 
    icon: '🔵',
    color: '#28A0F0',
    gasToken: 'ETH'
  },
  { 
    id: ChainId.OPT, 
    name: 'Optimism', 
    icon: '🔴',
    color: '#FF0420',
    gasToken: 'ETH'
  },
  { 
    id: ChainId.BAS, 
    name: 'Base', 
    icon: '🔵',
    color: '#0052FF',
    gasToken: 'ETH'
  },
  // Linea commented out if ChainId.LIN not available
  // { 
  //   id: ChainId.LIN, 
  //   name: 'Linea', 
  //   icon: '🟢',
  //   color: '#61DFFF',
  //   gasToken: 'ETH'
  // },
];

export interface CrossChainTipQuote {
  fromChain: ChainId;
  toChain: ChainId;
  fromAmount: string;
  toAmount: string;
  estimatedGas: string;
  executionDuration: number;
  route: any;
  priceImpact: number;
  fees: {
    platform: string;
    gas: string;
    bridge: string;
  };
}

export interface CrossChainTipParams {
  fromChain: ChainId;
  toChain: ChainId;
  amount: string; // Amount in USDC (with decimals)
  fromAddress: string;
  toAddress: string;
  eventId?: string;
  speakerId?: string;
  message?: string;
}

export interface TipExecutionProgress {
  status: 'pending' | 'executing' | 'completed' | 'failed';
  currentStep: number;
  totalSteps: number;
  txHash?: string;
  explorerLink?: string;
  error?: string;
}

class LiFiService {
  private isInitialized = false;
  private progressCallbacks: Map<string, (progress: TipExecutionProgress) => void> = new Map();

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Create LI.FI SDK configuration
      createConfig({
        integrator: 'MegaVibe',
        apiKey: env.lifi.apiKey,
        // For now, we'll initialize without EVM provider
        // This can be added later when wagmi is properly set up
        providers: [
          // EVM provider will be added when wagmi is configured
        ],
        // Optimize for hackathon demo
        routeOptions: {
          order: 'FASTEST', // Prioritize speed for demo
          slippage: 0.005, // 0.5% slippage tolerance
          maxPriceImpact: 0.1, // 10% max price impact
        }
      });

      this.isInitialized = true;
      console.log('✅ LI.FI SDK initialized successfully (without EVM provider)');
      console.log('⚠️  EVM provider will be added when wagmi is configured');
    } catch (error) {
      console.error('❌ Failed to initialize LI.FI SDK:', error);
      throw new Error('LI.FI SDK initialization failed');
    }
  }

  /**
   * Get a quote for cross-chain USDC tipping
   */
  async getCrossChainTipQuote(params: CrossChainTipParams): Promise<CrossChainTipQuote> {
    await this.initialize();

    try {
      const quote = await getQuote({
        fromChain: params.fromChain,
        toChain: params.toChain,
        fromToken: this.getUSDCAddress(params.fromChain),
        toToken: this.getUSDCAddress(params.toChain),
        fromAmount: params.amount,
        fromAddress: params.fromAddress,
        toAddress: params.toAddress,
        // Optimize for user experience
        slippage: 0.005,
        order: 'FASTEST',
      });

      // Calculate fees breakdown
      const platformFee = (parseFloat(quote.estimate.fromAmount) * 0.05).toString(); // 5% platform fee
      const bridgeFee = quote.estimate.feeCosts?.reduce((sum, fee) => sum + parseFloat(fee.amount), 0) || 0;
      const gasFee = quote.estimate.gasCosts?.reduce((sum, gas) => sum + parseFloat(gas.amount), 0) || 0;

      return {
        fromChain: params.fromChain,
        toChain: params.toChain,
        fromAmount: quote.estimate.fromAmount,
        toAmount: quote.estimate.toAmount,
        estimatedGas: gasFee.toString(),
        executionDuration: quote.estimate.executionDuration,
        route: quote,
        priceImpact: parseFloat(quote.estimate.priceImpact || '0') || 0,
        fees: {
          platform: platformFee,
          gas: gasFee.toString(),
          bridge: bridgeFee.toString(),
        }
      };
    } catch (error) {
      console.error('❌ Failed to get cross-chain tip quote:', error);
      throw new Error(`Failed to get quote: ${error.message}`);
    }
  }

  /**
   * Execute cross-chain tip with progress tracking
   */
  async executeCrossChainTip(
    quote: CrossChainTipQuote,
    params: CrossChainTipParams,
    onProgress?: (progress: TipExecutionProgress) => void
  ): Promise<string> {
    await this.initialize();

    // For now, return a mock execution since we don't have EVM provider configured
    // This will be replaced with actual execution once wagmi is properly set up
    console.warn('⚠️  Cross-chain execution is mocked - EVM provider not configured');
    
    const executionId = `tip_${Date.now()}`;
    if (onProgress) {
      this.progressCallbacks.set(executionId, onProgress);
    }

    try {
      // Mock execution progress
      this.updateProgress(executionId, {
        status: 'executing',
        currentStep: 1,
        totalSteps: 3,
      });

      // Simulate execution time
      await new Promise(resolve => setTimeout(resolve, 2000));

      this.updateProgress(executionId, {
        status: 'executing',
        currentStep: 2,
        totalSteps: 3,
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Record cross-chain reputation
      await this.recordCrossChainReputation(params, { id: executionId });

      this.updateProgress(executionId, {
        status: 'completed',
        currentStep: 3,
        totalSteps: 3,
      });

      return executionId;
    } catch (error) {
      console.error('❌ Failed to execute cross-chain tip:', error);
      
      this.updateProgress(executionId, {
        status: 'failed',
        currentStep: 0,
        totalSteps: 0,
        error: error.message,
      });

      throw error;
    } finally {
      this.progressCallbacks.delete(executionId);
    }
  }

  /**
   * Get supported chains with current status
   */
  async getSupportedChains() {
    await this.initialize();
    
    try {
      const chains = await getChains({
        chainTypes: [ChainType.EVM]
      });
      
      return SUPPORTED_CHAINS.map(supportedChain => {
        const chainData = chains.find(c => c.id === supportedChain.id);
        return {
          ...supportedChain,
          isActive: !!chainData,
          rpcUrl: chainData?.metamask?.rpcUrls?.[0],
          blockExplorer: chainData?.metamask?.blockExplorerUrls?.[0],
        };
      });
    } catch (error) {
      console.error('❌ Failed to get supported chains:', error);
      return SUPPORTED_CHAINS;
    }
  }

  /**
   * Get USDC token info for a specific chain
   */
  async getUSDCTokenInfo(chainId: ChainId) {
    await this.initialize();
    
    try {
      const tokens = await getTokens({
        chains: [chainId]
      });
      
      const usdcAddress = this.getUSDCAddress(chainId);
      const usdcToken = tokens.tokens[chainId]?.find(
        token => token.address.toLowerCase() === usdcAddress.toLowerCase()
      );
      
      return usdcToken || {
        address: usdcAddress,
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        chainId,
      };
    } catch (error) {
      console.error('❌ Failed to get USDC token info:', error);
      return {
        address: this.getUSDCAddress(chainId),
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        chainId,
      };
    }
  }

  /**
   * Estimate cross-chain tip costs
   */
  async estimateTipCosts(params: CrossChainTipParams) {
    try {
      const quote = await this.getCrossChainTipQuote(params);
      
      const totalFees = parseFloat(quote.fees.platform) + 
                       parseFloat(quote.fees.gas) + 
                       parseFloat(quote.fees.bridge);
      
      const netAmount = parseFloat(quote.toAmount) / 1e6; // Convert from USDC decimals
      const grossAmount = parseFloat(quote.fromAmount) / 1e6;
      
      return {
        grossAmount,
        netAmount,
        totalFees: totalFees / 1e6,
        breakdown: {
          platformFee: parseFloat(quote.fees.platform) / 1e6,
          gasFee: parseFloat(quote.fees.gas) / 1e6,
          bridgeFee: parseFloat(quote.fees.bridge) / 1e6,
        },
        executionTime: quote.executionDuration,
        priceImpact: quote.priceImpact,
      };
    } catch (error) {
      console.error('❌ Failed to estimate tip costs:', error);
      throw error;
    }
  }

  // Private helper methods
  private getUSDCAddress(chainId: ChainId): string {
    const address = USDC_ADDRESSES[chainId];
    if (!address) {
      throw new Error(`USDC not supported on chain ${chainId}`);
    }
    return address;
  }

  private updateProgress(executionId: string, progress: TipExecutionProgress) {
    const callback = this.progressCallbacks.get(executionId);
    if (callback) {
      callback(progress);
    }
  }

  private handleRouteUpdate(executionId: string, route: any) {
    // Extract progress information from route
    const completedSteps = route.steps.filter((step: any) => 
      step.execution?.status === 'DONE'
    ).length;
    
    const currentStep = route.steps.find((step: any) => 
      step.execution?.status === 'PENDING' || step.execution?.status === 'STARTED'
    );
    
    let txHash: string | undefined;
    let explorerLink: string | undefined;
    
    if (currentStep?.execution?.process) {
      const latestProcess = currentStep.execution.process[currentStep.execution.process.length - 1];
      txHash = latestProcess?.txHash;
      if (txHash && currentStep.action?.fromChainId) {
        const chain = SUPPORTED_CHAINS.find(c => c.id === currentStep.action.fromChainId);
        if (chain) {
          explorerLink = `${this.getExplorerUrl(currentStep.action.fromChainId)}/tx/${txHash}`;
        }
      }
    }

    this.updateProgress(executionId, {
      status: 'executing',
      currentStep: completedSteps + 1,
      totalSteps: route.steps.length,
      txHash,
      explorerLink,
    });
  }

  private getExplorerUrl(chainId: ChainId): string {
    const explorers = {
      [ChainId.ETH]: 'https://etherscan.io',
      [ChainId.ARB]: 'https://arbiscan.io',
      [ChainId.OPT]: 'https://optimistic.etherscan.io',
      // [ChainId.LIN]: 'https://lineascan.build', // Commented out if not available
      [ChainId.BAS]: 'https://basescan.org',
    };
    return explorers[chainId] || 'https://etherscan.io';
  }

  private async recordCrossChainReputation(params: CrossChainTipParams, executedRoute: any) {
    try {
      // This would integrate with our reputation smart contract
      const reputationData = {
        user: params.fromAddress,
        sourceChain: params.fromChain,
        destinationChain: params.toChain,
        amount: params.amount,
        activityType: 'cross_chain_tip',
        eventId: params.eventId,
        speakerId: params.speakerId,
        routeId: executedRoute.id,
        timestamp: Date.now(),
      };
      
      // In production, this would call our reputation contract
      console.log('📊 Recording cross-chain reputation:', reputationData);
      
      // For hackathon demo, we'll store this in localStorage
      const existingReputation = JSON.parse(localStorage.getItem('crossChainReputation') || '[]');
      existingReputation.push(reputationData);
      localStorage.setItem('crossChainReputation', JSON.stringify(existingReputation));
      
    } catch (error) {
      console.error('❌ Failed to record cross-chain reputation:', error);
      // Don't throw - reputation recording shouldn't fail the tip
    }
  }
}

// Export singleton instance
export const lifiService = new LiFiService();

// Export utility functions
export const formatUSDC = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return (num / 1e6).toFixed(2);
};

export const parseUSDC = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return (num * 1e6).toString();
};

export const getChainName = (chainId: ChainId): string => {
  return SUPPORTED_CHAINS.find(chain => chain.id === chainId)?.name || 'Unknown';
};

export const getChainIcon = (chainId: ChainId): string => {
  return SUPPORTED_CHAINS.find(chain => chain.id === chainId)?.icon || '❓';
};
