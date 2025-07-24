/**
 * Tipping service for interacting with the MegaVibeTipping contract
 */
import { ethers } from 'ethers';
import { getContractAddress } from '@/contracts/addresses';
import MegaVibeTippingABI from '@/contracts/abis/MegaVibeTipping.json';
import providerService from './provider';
import { 
  BlockchainError, 
  BlockchainErrorType, 
  TipData, 
  Transaction, 
  TransactionStatus 
} from './types';

class TippingService {
  /**
   * Get the tipping contract instance
   * @returns Contract instance or null if not available
   */
  private getContract(): ethers.Contract | null {
    const provider = providerService.getProvider();
    const signer = providerService.getSigner();
    const walletInfo = providerService.getWalletInfo();
    
    if (!provider || !signer || !walletInfo) {
      return null;
    }
    
    const contractAddress = getContractAddress('MegaVibeTipping', walletInfo.chainId);
    if (!contractAddress) {
      return null;
    }
    
    return new ethers.Contract(
      contractAddress,
      MegaVibeTippingABI.abi,
      signer
    );
  }

  /**
   * Send a tip to a performer
   * @param data Tip data
   * @returns Transaction hash
   */
  public async sendTip(data: TipData): Promise<Transaction> {
    const contract = this.getContract();
    if (!contract) {
      throw this.createError(
        BlockchainErrorType.CONNECTION_ERROR,
        'No wallet connected',
        'Please connect your wallet to send a tip'
      );
    }

    try {
      // Create transaction
      const tx = await contract.sendTip(
        data.recipientId,
        data.message || '',
        { value: ethers.parseEther(data.amount) }
      );
      
      // Return transaction info
      const walletInfo = providerService.getWalletInfo();
      return {
        hash: tx.hash,
        status: TransactionStatus.PENDING,
        timestamp: Math.floor(Date.now() / 1000),
        from: walletInfo?.address || '',
        to: contract.target as string,
        value: data.amount,
      };
    } catch (error: unknown) {
      // Handle user rejected transaction
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: number }).code === 4001
      ) {
        throw this.createError(
          BlockchainErrorType.USER_REJECTED,
          "User rejected the transaction",
          "You declined the transaction. No tip was sent."
        );
      }

      // Handle other errors
      throw this.createError(
        BlockchainErrorType.TRANSACTION_ERROR,
        "Failed to send tip",
        "There was an error sending your tip. Please try again.",
        error
      );
    }
  }

  /**
   * Get tip history for a user (either sent or received)
   * @param address User address
   * @param type 'sent' or 'received'
   * @returns Array of tip transactions
   */
  public async getTipHistory(
    address: string,
    type: 'sent' | 'received'
  ): Promise<Transaction[]> {
    const contract = this.getContract();
    if (!contract) {
      throw this.createError(
        BlockchainErrorType.CONNECTION_ERROR,
        'No wallet connected',
        'Please connect your wallet to view tip history'
      );
    }

    try {
      // Get tip events from contract
      const filter = type === 'sent'
        ? contract.filters.TipSent(address, null)
        : contract.filters.TipSent(null, address);
        
      const events = await contract.queryFilter(filter);
      
      // Convert events to transactions
      return events.map(event => {
        // Check if this is an EventLog (which has args) rather than a Log
        if (!('args' in event)) {
          throw new Error('Event does not contain expected arguments');
        }

        const argsUnknown = event.args as unknown;
        // Safely check for required properties
        if (
          typeof argsUnknown === "object" &&
          argsUnknown !== null &&
          "timestamp" in argsUnknown &&
          "sender" in argsUnknown &&
          "recipient" in argsUnknown &&
          "amount" in argsUnknown
        ) {
          const args = argsUnknown as {
            timestamp: string | number;
            sender: string;
            recipient: string;
            amount: string | bigint;
          };
          return {
            hash: event.transactionHash,
            status: TransactionStatus.CONFIRMED,
            timestamp: Number(args.timestamp),
            from: args.sender,
            to: args.recipient,
            value: ethers.formatEther(args.amount),
            blockNumber: event.blockNumber,
          };
        } else {
          throw new Error('Event arguments missing required fields');
        }
      });
    } catch (error) {
      throw this.createError(
        BlockchainErrorType.CONTRACT_ERROR,
        `Failed to get tip history for ${address}`,
        'Could not retrieve your tip history. Please try again.',
        error
      );
    }
  }

  /**
   * Get the total tips received by a performer
   * @param address Performer address
   * @returns Total tips in MNT
   */
  public async getTotalTipsReceived(address: string): Promise<string> {
    const contract = this.getContract();
    if (!contract) {
      throw this.createError(
        BlockchainErrorType.CONNECTION_ERROR,
        'No wallet connected',
        'Please connect your wallet to view tip statistics'
      );
    }

    try {
      const total = await contract.getTotalTipsReceived(address);
      return ethers.formatEther(total);
    } catch (error) {
      throw this.createError(
        BlockchainErrorType.CONTRACT_ERROR,
        `Failed to get total tips for ${address}`,
        'Could not retrieve the tip statistics. Please try again.',
        error
      );
    }
  }
  
  /**
   * Wait for a transaction to be confirmed
   * @param txHash Transaction hash
   * @returns Updated transaction with confirmation status
   */
  public async waitForTransaction(txHash: string): Promise<Transaction> {
    const provider = providerService.getProvider();
    if (!provider) {
      throw this.createError(
        BlockchainErrorType.CONNECTION_ERROR,
        'No provider available',
        'Cannot track transaction status without a connected wallet'
      );
    }
    
    try {
      const txReceipt = await provider.waitForTransaction(txHash);
      
      // Handle the case where txReceipt might be null
      if (!txReceipt) {
        throw new Error('Transaction receipt not found');
      }
      
      return {
        hash: txHash,
        status: txReceipt.status ? TransactionStatus.CONFIRMED : TransactionStatus.FAILED,
        timestamp: Math.floor(Date.now() / 1000),
        from: txReceipt.from,
        to: txReceipt.to || '',
        value: '0', // Need to query the transaction to get the value
        gasUsed: txReceipt.gasUsed.toString(),
        blockNumber: txReceipt.blockNumber,
      };
    } catch (error) {
      throw this.createError(
        BlockchainErrorType.TRANSACTION_ERROR,
        'Failed to get transaction status',
        'Could not verify if your transaction was successful. Please check your wallet for details.',
        error
      );
    }
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
export const tippingService = new TippingService();

export default tippingService;