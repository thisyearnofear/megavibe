/**
 * Bounty service for interacting with the MegaVibeBounties contract
 */
import { ethers } from 'ethers';
import { getContractAddress } from '@/contracts/addresses';
import MegaVibeBountiesABI from '@/contracts/abis/MegaVibeBounties.json';
import providerService from './provider';
import {
  BlockchainError,
  BlockchainErrorType,
  Bounty,
  BountyClaimData,
  BountyCreationData,
  BountyDetails,
  BountyStatus,
  BountySubmission,
  BountyType,
  PlatformStats,
  Transaction,
  TransactionStatus
} from './types';

class BountyService {
  /**
   * Get the bounty contract instance
   * @returns Contract instance or null if not available
   */
  private getContract(): ethers.Contract | null {
    const provider = providerService.getProvider();
    const signer = providerService.getSigner();
    const walletInfo = providerService.getWalletInfo();
    
    if (!provider || !signer || !walletInfo) {
      return null;
    }
    
    const contractAddress = getContractAddress('MegaVibeBounties', walletInfo.chainId);
    if (!contractAddress) {
      return null;
    }
    
    return new ethers.Contract(
      contractAddress,
      MegaVibeBountiesABI.abi,
      signer
    );
  }

  /**
   * Create a new bounty
   * @param data Bounty creation data
   * @returns Transaction hash
   */
  public async createBounty(data: BountyCreationData): Promise<Transaction> {
    const contract = this.getContract();
    if (!contract) {
      throw this.createError(
        BlockchainErrorType.CONNECTION_ERROR,
        'No wallet connected',
        'Please connect your wallet to create a bounty'
      );
    }

    try {
      // Calculate deadline (Unix timestamp in seconds)
      const deadlineDate = new Date(data.deadline);
      const deadlineTimestamp = Math.floor(deadlineDate.getTime() / 1000);
      
      // Create transaction
      const tx = await contract.createBounty(
        data.eventId,
        data.speakerId,
        data.description,
        deadlineTimestamp,
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
          'User rejected the transaction',
          'You declined the transaction. No bounty was created.'
        );
      }
      
      // Handle other errors
      throw this.createError(
        BlockchainErrorType.TRANSACTION_ERROR,
        'Failed to create bounty',
        'There was an error creating your bounty. Please try again.',
        error
      );
    }
  }

  /**
   * Claim a bounty by submitting content
   * @param data Bounty claim data
   * @returns Transaction hash
   */
  public async claimBounty(data: BountyClaimData): Promise<Transaction> {
    const contract = this.getContract();
    if (!contract) {
      throw this.createError(
        BlockchainErrorType.CONNECTION_ERROR,
        'No wallet connected',
        'Please connect your wallet to claim a bounty'
      );
    }

    try {
      // Create transaction
      const tx = await contract.claimBounty(
        data.bountyId,
        data.submissionHash
      );
      
      // Return transaction info
      const walletInfo = providerService.getWalletInfo();
      return {
        hash: tx.hash,
        status: TransactionStatus.PENDING,
        timestamp: Math.floor(Date.now() / 1000),
        from: walletInfo?.address || '',
        to: contract.target as string,
        value: '0',
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
          'User rejected the transaction',
          'You declined the transaction. The bounty was not claimed.'
        );
      }
      
      // Handle other errors
      throw this.createError(
        BlockchainErrorType.TRANSACTION_ERROR,
        'Failed to claim bounty',
        'There was an error claiming the bounty. Please try again.',
        error
      );
    }
  }

  /**
   * Get a specific bounty by ID
   * @param bountyId Bounty ID
   * @returns Bounty information
   */
  public async getBounty(bountyId: number): Promise<Bounty> {
    const contract = this.getContract();
    if (!contract) {
      throw this.createError(
        BlockchainErrorType.CONNECTION_ERROR,
        'No wallet connected',
        'Please connect your wallet to view bounty details'
      );
    }

    try {
      const bountyData = await contract.getBounty(bountyId);
      
      // Calculate time left for display
      const currentTime = Math.floor(Date.now() / 1000);
      const deadlineTime = Number(bountyData.deadline);
      const timeLeftSeconds = deadlineTime - currentTime;
      
      let timeLeft = '';
      if (timeLeftSeconds <= 0) {
        timeLeft = 'Expired';
      } else if (timeLeftSeconds < 3600) {
        timeLeft = `${Math.floor(timeLeftSeconds / 60)} minutes`;
      } else if (timeLeftSeconds < 86400) {
        timeLeft = `${Math.floor(timeLeftSeconds / 3600)} hours`;
      } else {
        timeLeft = `${Math.floor(timeLeftSeconds / 86400)} days`;
      }
      
      // Determine bounty type based on event and speaker IDs
      // This is a simplified approach - in a real implementation,
      // you would need more sophisticated logic or metadata
      const type = bountyData.eventId.startsWith('performer-') 
        ? 'performer-to-audience' 
        : 'audience-to-performer';
      
      return {
        id: bountyId,
        sponsor: bountyData.sponsor,
        reward: ethers.formatEther(bountyData.reward),
        eventId: bountyData.eventId,
        speakerId: bountyData.speakerId,
        description: bountyData.description,
        deadline: Number(bountyData.deadline),
        claimed: bountyData.claimed,
        claimant: bountyData.claimant,
        submissionHash: bountyData.submissionHash,
        createdAt: Number(bountyData.createdAt),
        
        // UI enhancements
        type,
        timeLeft,
        title: this.generateBountyTitle(bountyData.description, type),
        tags: this.extractTags(bountyData.description),
      };
    } catch (error) {
      throw this.createError(
        BlockchainErrorType.CONTRACT_ERROR,
        `Failed to get bounty #${bountyId}`,
        'Could not retrieve the bounty details. Please try again.',
        error
      );
    }
  }

  /**
   * Get all active bounties for an event
   * @param eventId Event ID
   * @returns Array of active bounties
   */
  public async getActiveBountiesForEvent(eventId: string): Promise<Bounty[]> {
    const contract = this.getContract();
    if (!contract) {
      throw this.createError(
        BlockchainErrorType.CONNECTION_ERROR,
        'No wallet connected',
        'Please connect your wallet to view bounties'
      );
    }

    try {
      const bounties = await contract.getActiveBountiesForEvent(eventId);
      
      // Transform raw contract data to our Bounty type with UI enhancements
      return Promise.all(bounties.map(async (bounty: unknown, index: number) => {
        const bountyData = bounty as any;
        // Get the bounty ID
        const bountyIds = await contract.getEventBounties(eventId);
        const bountyId = Number(bountyIds[index]);
        
        // Calculate time left for display
        const currentTime = Math.floor(Date.now() / 1000);
        const deadlineTime = Number(bountyData.deadline);
        const timeLeftSeconds = deadlineTime - currentTime;
        
        let timeLeft = '';
        if (timeLeftSeconds <= 0) {
          timeLeft = 'Expired';
        } else if (timeLeftSeconds < 3600) {
          timeLeft = `${Math.floor(timeLeftSeconds / 60)} minutes`;
        } else if (timeLeftSeconds < 86400) {
          timeLeft = `${Math.floor(timeLeftSeconds / 3600)} hours`;
        } else {
          timeLeft = `${Math.floor(timeLeftSeconds / 86400)} days`;
        }
        
        // Determine bounty type based on event and speaker IDs
        const type = bountyData.eventId.startsWith('performer-') 
          ? 'performer-to-audience' 
          : 'audience-to-performer';
        
        return {
          id: bountyId,
          sponsor: bountyData.sponsor,
          reward: ethers.formatEther(bountyData.reward),
          eventId: bountyData.eventId,
          speakerId: bountyData.speakerId,
          description: bountyData.description,
          deadline: Number(bountyData.deadline),
          claimed: bountyData.claimed,
          claimant: bountyData.claimant,
          submissionHash: bountyData.submissionHash,
          createdAt: Number(bountyData.createdAt),
          
          // UI enhancements
          type,
          timeLeft,
          title: this.generateBountyTitle(bountyData.description, type),
          tags: this.extractTags(bountyData.description),
        };
      }));
    } catch (error) {
      throw this.createError(
        BlockchainErrorType.CONTRACT_ERROR,
        `Failed to get bounties for event ${eventId}`,
        'Could not retrieve the bounties. Please try again.',
        error
      );
    }
  }

  /**
   * Get platform statistics
   * @returns Platform statistics
   */
  public async getPlatformStats(): Promise<PlatformStats> {
    const contract = this.getContract();
    if (!contract) {
      throw this.createError(
        BlockchainErrorType.CONNECTION_ERROR,
        'No wallet connected',
        'Please connect your wallet to view platform statistics'
      );
    }

    try {
      const stats = await contract.getPlatformStats();
      
      return {
        totalVolume: ethers.formatEther(stats.totalVolume),
        totalBounties: Number(stats.totalBounties),
        activeBounties: Number(stats.activeBounties),
        platformFees: ethers.formatEther(stats.platformFees),
      };
    } catch (error) {
      throw this.createError(
        BlockchainErrorType.CONTRACT_ERROR,
        'Failed to get platform statistics',
        'Could not retrieve the platform statistics. Please try again.',
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

  // Helper methods

  /**
   * Generate a title from the bounty description
   * This is a simple implementation that takes the first sentence or 50 chars
   */
  private generateBountyTitle(description: string, type: string): string {
    // Take first sentence or first 50 chars
    const firstSentence = description.split(/[.!?]/)[0];
    if (firstSentence.length <= 50) {
      return firstSentence;
    }
    return firstSentence.substring(0, 47) + '...';
  }

  /**
   * Extract tags from the bounty description
   * This is a simple implementation that looks for hashtags or keywords
   */
  private extractTags(description: string): string[] {
    const tags: string[] = [];
    
    // Look for hashtags
    const hashtagRegex = /#(\w+)/g;
    let match;
    while ((match = hashtagRegex.exec(description)) !== null) {
      tags.push(match[1]);
    }
    
    // If no hashtags, extract keywords based on common categories
    if (tags.length === 0) {
      const keywords = [
        'Music', 'Audio', 'Vocal', 'Beat', 'Remix', 'Production',
        'Video', 'Visual', 'Animation', 'Design', 'Artwork',
        'Podcast', 'Interview', 'Writing', 'Lyrics', 'Translation'
      ];
      
      keywords.forEach(keyword => {
        if (description.toLowerCase().includes(keyword.toLowerCase())) {
          tags.push(keyword);
        }
      });
    }
    
    return tags.slice(0, 5); // Limit to 5 tags
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

  /**
   * Get detailed bounty information
   * @param bountyId Bounty ID (string or number)
   * @returns Detailed bounty information
   */
  public async getBountyDetails(bountyId: string | number): Promise<BountyDetails> {
    const bountyIdNum = typeof bountyId === 'string' ? parseInt(bountyId) : bountyId;
    const contract = this.getContract();
    
    if (!contract) {
      throw this.createError(
        BlockchainErrorType.CONNECTION_ERROR,
        'No wallet connected',
        'Please connect your wallet to view bounty details'
      );
    }

    try {
      // Get basic bounty data
      const bounty = await this.getBounty(bountyIdNum);
      
      // Get submission count from contract
      const submissionsCount = await contract.getSubmissionCount(bountyIdNum);
      
      return {
        id: bounty.id.toString(),
        title: bounty.title || this.generateBountyTitle(bounty.description, bounty.type),
        description: bounty.description,
        amount: bounty.reward,
        creator: bounty.sponsor,
        deadline: bounty.deadline,
        status: bounty.claimed ? BountyStatus.COMPLETED : BountyStatus.OPEN,
        submissionsCount,
        tags: bounty.tags || [],
        createdAt: bounty.createdAt,
        updatedAt: bounty.claimed ? await contract.getClaimTimestamp(bountyIdNum) : bounty.createdAt,
        type: bounty.type === 'audience-to-performer' ? BountyType.AUDIENCE_TO_PERFORMER : BountyType.PERFORMER_TO_AUDIENCE,
        isCompleted: bounty.claimed,
        winningSubmissionId: bounty.claimed ? bounty.submissionHash : undefined
      };
    } catch (error: unknown) {
      throw this.createError(
        BlockchainErrorType.CONTRACT_ERROR,
        `Failed to get detailed bounty #${bountyId}`,
        'Could not retrieve the bounty details. Please try again.',
        error
      );
    }
  }

  /**
   * Submit a response to a bounty
   * @param submission Bounty submission data
   * @returns Transaction receipt
   */
  public async submitBountyResponse(submission: BountySubmission): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getContract();
    if (!contract) {
      throw this.createError(
        BlockchainErrorType.CONNECTION_ERROR,
        'No wallet connected',
        'Please connect your wallet to submit a response'
      );
    }

    try {
      // Format the bounty ID properly
      const bountyId = typeof submission.bountyId === 'string'
        ? parseInt(submission.bountyId)
        : submission.bountyId;

      // We'll use the contentCID as the submission hash
      const submissionHash = submission.contentCID;
      
      // Submit to contract
      return await contract.claimBounty(
        bountyId,
        submissionHash
      );
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
          "You declined the transaction. The response was not submitted."
        );
      }

      // Handle other errors
      throw this.createError(
        BlockchainErrorType.TRANSACTION_ERROR,
        "Failed to submit bounty response",
        "There was an error submitting your response. Please try again.",
        error
      );
    }
  }
}

// Create singleton instance
export const bountyService = new BountyService();

export default bountyService;