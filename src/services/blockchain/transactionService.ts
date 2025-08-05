import { ethers } from 'ethers';
import { tippingService } from './tippingService';
import { bountyService } from './bountyService';

export interface TransactionResult {
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: string;
  effectiveGasPrice?: string;
  timestamp?: number;
}

export interface GasEstimate {
  gasLimit: string;
  gasPrice: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  estimatedCost: string;
  estimatedCostUSD?: string;
}

export interface TransactionError {
  type: 'insufficient_funds' | 'gas_too_high' | 'network_error' | 'user_rejected' | 'contract_error';
  message: string;
  retryable: boolean;
  suggestedAction?: string;
  originalError?: unknown;
}

export type TransactionStatus = 'idle' | 'estimating' | 'confirming' | 'pending' | 'confirmed' | 'failed';

class TransactionService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;

  async initialize() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
    }
  }

  async estimateGas(
    contractAddress: string,
    methodName: string,
    params: unknown[],
    value?: string
  ): Promise<GasEstimate> {
    try {
      if (!this.provider || !this.signer) {
        throw new Error('Provider not initialized');
      }

      // Get contract instance based on type
      const contract = await this.getContract(contractAddress);
      
      if (!contract) {
        throw new Error('Contract not available');
      }
      
      // Estimate gas for the transaction
      const gasLimit = await contract[methodName].estimateGas(...params, {
        value: value || '0'
      });

      // Get current gas price
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');

      // Calculate estimated cost
      const estimatedCost = (gasLimit * gasPrice).toString();
      const estimatedCostEth = ethers.formatEther(estimatedCost);

      // Get ETH price for USD conversion (simplified - would use real price API)
      const ethPriceUSD = 2000; // Placeholder - integrate with price API
      const estimatedCostUSD = (parseFloat(estimatedCostEth) * ethPriceUSD).toFixed(2);

      return {
        gasLimit: gasLimit.toString(),
        gasPrice: gasPrice.toString(),
        maxFeePerGas: feeData.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
        estimatedCost: estimatedCostEth,
        estimatedCostUSD
      };
    } catch (error) {
      throw this.handleTransactionError(error);
    }
  }

  async sendTransaction(
    contractAddress: string,
    methodName: string,
    params: unknown[],
    value?: string,
    gasLimit?: string
  ): Promise<TransactionResult> {
    try {
      if (!this.provider || !this.signer) {
        throw new Error('Provider not initialized');
      }

      const contract = await this.getContract(contractAddress);
      
      if (!contract) {
        throw new Error('Contract not available');
      }
      
      // Prepare transaction options
      const txOptions: Record<string, unknown> = {};
      if (value) txOptions.value = value;
      if (gasLimit) txOptions.gasLimit = gasLimit;

      // Send transaction
      const tx = await contract[methodName](...params, txOptions);
      
      return {
        txHash: tx.hash,
        status: 'pending'
      };
    } catch (error) {
      throw this.handleTransactionError(error);
    }
  }

  async waitForConfirmation(txHash: string, confirmations: number = 1): Promise<TransactionResult> {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      const receipt = await this.provider.waitForTransaction(txHash, confirmations);
      
      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }

      return {
        txHash,
        status: receipt.status === 1 ? 'confirmed' : 'failed',
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.gasPrice?.toString(),
        timestamp: Date.now()
      };
    } catch (error) {
      throw this.handleTransactionError(error);
    }
  }

  async getTransactionStatus(txHash: string): Promise<TransactionResult> {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      const tx = await this.provider.getTransaction(txHash);
      if (!tx) {
        throw new Error('Transaction not found');
      }

      if (tx.blockNumber) {
        const receipt = await this.provider.getTransactionReceipt(txHash);
        return {
          txHash,
          status: receipt?.status === 1 ? 'confirmed' : 'failed',
          blockNumber: tx.blockNumber,
          gasUsed: receipt?.gasUsed.toString(),
          effectiveGasPrice: receipt?.gasPrice?.toString(),
          timestamp: Date.now()
        };
      }

      return {
        txHash,
        status: 'pending'
      };
    } catch (error) {
      throw this.handleTransactionError(error);
    }
  }

  private async getContract(contractAddress: string): Promise<ethers.Contract> {
    if (!this.signer) {
      throw new Error('Signer not available');
    }

    // Get contract instance from the appropriate service
    // We need to check which service handles this contract address
    let contract: ethers.Contract | null = null;
    
    // Try tipping service first
    const tippingContract = tippingService['getContract']();
    if (tippingContract && tippingContract.target === contractAddress) {
      contract = tippingContract;
    }
    
    // Try bounty service if not found
    if (!contract) {
      const bountyContract = bountyService['getContract']();
      if (bountyContract && bountyContract.target === contractAddress) {
        contract = bountyContract;
      }
    }
    
    if (!contract) {
      throw new Error(`No contract found for address: ${contractAddress}`);
    }
    
    return contract;
  }

  private handleTransactionError(error: unknown): TransactionError {
    console.error('Transaction error:', error);

    const errorObj = error as any;
    
    // Parse common error types
    if (errorObj.code === 'INSUFFICIENT_FUNDS') {
      return {
        type: 'insufficient_funds',
        message: 'Insufficient funds to complete transaction',
        retryable: false,
        suggestedAction: 'Add more funds to your wallet',
        originalError: error
      };
    }

    if (errorObj.code === 'ACTION_REJECTED' || errorObj.code === 4001) {
      return {
        type: 'user_rejected',
        message: 'Transaction was rejected by user',
        retryable: true,
        suggestedAction: 'Please approve the transaction in your wallet',
        originalError: error
      };
    }

    if (errorObj.code === 'NETWORK_ERROR') {
      return {
        type: 'network_error',
        message: 'Network connection error',
        retryable: true,
        suggestedAction: 'Check your internet connection and try again',
        originalError: error
      };
    }

    if (errorObj.message?.includes('gas')) {
      return {
        type: 'gas_too_high',
        message: 'Gas fees are too high',
        retryable: true,
        suggestedAction: 'Try again when network congestion is lower',
        originalError: error
      };
    }

    // Generic contract error
    return {
      type: 'contract_error',
      message: errorObj.message || 'Transaction failed',
      retryable: true,
      suggestedAction: 'Please try again',
      originalError: error
    };
  }

  // Utility methods for transaction monitoring
  async getNetworkStatus() {
    if (!this.provider) return null;
    
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const feeData = await this.provider.getFeeData();
      
      return {
        chainId: network.chainId.toString(),
        blockNumber,
        gasPrice: feeData.gasPrice?.toString(),
        maxFeePerGas: feeData.maxFeePerGas?.toString()
      };
    } catch (error) {
      console.error('Failed to get network status:', error);
      return null;
    }
  }

  async getUserBalance(address: string): Promise<string> {
    if (!this.provider) return '0';
    
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Failed to get user balance:', error);
      return '0';
    }
  }
}

export const transactionService = new TransactionService();