/**
 * Event service for interacting with the EventContract
 */
import { ethers } from 'ethers';
import { getContractAddress } from '@/contracts/addresses';
import EventContractABI from '@/contracts/abis/EventContract.json';
import providerService from './provider';
import { 
  BlockchainError, 
  BlockchainErrorType, 
  Transaction, 
  TransactionStatus 
} from './types';

// Event interface
export interface Event {
  id: string;
  name: string;
  description: string;
  startTime: number;
  endTime: number;
  location: string;
  organizer: string;
  isActive: boolean;
  speakerIds: string[];
  speakerCount: number;
  attendeeCount: number;
}

// Speaker/Performer interface
export interface Speaker {
  id: string;
  name: string;
  bio: string;
  profileImage: string;
  walletAddress: string;
  eventIds: string[];
  isActive: boolean;
}

class EventService {
  /**
   * Get the event contract instance
   * @returns Contract instance or null if not available
   */
  private getContract(): ethers.Contract | null {
    const provider = providerService.getProvider();
    const signer = providerService.getSigner();
    const walletInfo = providerService.getWalletInfo();
    
    if (!provider || !signer || !walletInfo) {
      return null;
    }
    
    // EventContract deployed at 0x1234567890abcdef1234567890abcdef12345678
    const contractAddress = getContractAddress('EventContract', walletInfo.chainId);
    if (!contractAddress) {
      return null;
    }
    
    return new ethers.Contract(
      contractAddress,
      EventContractABI.abi,
      signer
    );
  }

  /**
   * Get an event by ID
   * @param eventId Event ID
   * @returns Event information
   */
  public async getEvent(eventId: string): Promise<Event> {
    const contract = this.getContract();
    if (!contract) {
      throw this.createError(
        BlockchainErrorType.CONNECTION_ERROR,
        'No wallet connected',
        'Please connect your wallet to view event details'
      );
    }

    try {
      // Use a different variable name to avoid confusion with ethers ContractEvent type
      // and explicitly cast the return value to any to handle the contract's custom structure
      const eventDataFromContract: unknown = await contract.getEvent(eventId);
      const eventData = eventDataFromContract as any;
      
      return {
        id: eventId,
        name: eventData.name,
        description: eventData.description,
        startTime: Number(eventData.startTime),
        endTime: Number(eventData.endTime),
        location: eventData.location,
        organizer: eventData.organizer,
        isActive: eventData.isActive,
        speakerIds: eventData.speakerIds,
        speakerCount: eventData.speakerIds.length,
        attendeeCount: Number(eventData.attendeeCount),
      };
    } catch (error) {
      throw this.createError(
        BlockchainErrorType.CONTRACT_ERROR,
        `Failed to get event ${eventId}`,
        'Could not retrieve the event details. Please try again.',
        error
      );
    }
  }

  /**
   * Get all active events
   * @returns Array of active events
   */
  public async getActiveEvents(): Promise<Event[]> {
    const contract = this.getContract();
    if (!contract) {
      throw this.createError(
        BlockchainErrorType.CONNECTION_ERROR,
        'No wallet connected',
        'Please connect your wallet to view events'
      );
    }

    try {
      const eventIds = await contract.getActiveEventIds();
      
      // Get details for each event
      const events = await Promise.all(
        eventIds.map((id: string) => this.getEvent(id))
      );
      
      return events;
    } catch (error) {
      throw this.createError(
        BlockchainErrorType.CONTRACT_ERROR,
        'Failed to get active events',
        'Could not retrieve the events list. Please try again.',
        error
      );
    }
  }

  /**
   * Get a speaker/performer by ID
   * @param speakerId Speaker ID
   * @returns Speaker information
   */
  public async getSpeaker(speakerId: string): Promise<Speaker> {
    const contract = this.getContract();
    if (!contract) {
      throw this.createError(
        BlockchainErrorType.CONNECTION_ERROR,
        'No wallet connected',
        'Please connect your wallet to view performer details'
      );
    }

    try {
      // Use a different variable name and explicitly cast to any
      const speakerDataFromContract: unknown = await contract.getSpeaker(speakerId);
      const speakerData = speakerDataFromContract as any;
      
      return {
        id: speakerId,
        name: speakerData.name,
        bio: speakerData.bio,
        profileImage: speakerData.profileImage,
        walletAddress: speakerData.walletAddress,
        eventIds: speakerData.eventIds,
        isActive: speakerData.isActive,
      };
    } catch (error) {
      throw this.createError(
        BlockchainErrorType.CONTRACT_ERROR,
        `Failed to get performer ${speakerId}`,
        'Could not retrieve the performer details. Please try again.',
        error
      );
    }
  }

  /**
   * Get speakers/performers for an event
   * @param eventId Event ID
   * @returns Array of speakers
   */
  public async getEventSpeakers(eventId: string): Promise<Speaker[]> {
    const contract = this.getContract();
    if (!contract) {
      throw this.createError(
        BlockchainErrorType.CONNECTION_ERROR,
        'No wallet connected',
        'Please connect your wallet to view event performers'
      );
    }

    try {
      const event = await this.getEvent(eventId);
      
      // Get details for each speaker
      const speakers = await Promise.all(
        event.speakerIds.map((id: string) => this.getSpeaker(id))
      );
      
      return speakers;
    } catch (error) {
      throw this.createError(
        BlockchainErrorType.CONTRACT_ERROR,
        `Failed to get performers for event ${eventId}`,
        'Could not retrieve the performer list. Please try again.',
        error
      );
    }
  }

  /**
   * Get events for a speaker/performer
   * @param speakerId Speaker ID
   * @returns Array of events
   */
  public async getSpeakerEvents(speakerId: string): Promise<Event[]> {
    const contract = this.getContract();
    if (!contract) {
      throw this.createError(
        BlockchainErrorType.CONNECTION_ERROR,
        'No wallet connected',
        'Please connect your wallet to view performer events'
      );
    }

    try {
      const speaker = await this.getSpeaker(speakerId);
      
      // Get details for each event
      const events = await Promise.all(
        speaker.eventIds.map((id: string) => this.getEvent(id))
      );
      
      return events;
    } catch (error) {
      throw this.createError(
        BlockchainErrorType.CONTRACT_ERROR,
        `Failed to get events for performer ${speakerId}`,
        'Could not retrieve the event list. Please try again.',
        error
      );
    }
  }
  
  /**
   * Register as an attendee for an event
   * @param eventId Event ID
   * @returns Transaction info
   */
  public async registerForEvent(eventId: string): Promise<Transaction> {
    const contract = this.getContract();
    if (!contract) {
      throw this.createError(
        BlockchainErrorType.CONNECTION_ERROR,
        'No wallet connected',
        'Please connect your wallet to register for the event'
      );
    }

    try {
      // Create transaction
      const tx = await contract.registerAttendee(eventId);
      
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
          "User rejected the transaction",
          "You declined the transaction. Registration was not completed."
        );
      }

      // Handle other errors
      throw this.createError(
        BlockchainErrorType.TRANSACTION_ERROR,
        "Failed to register for event",
        "There was an error registering for the event. Please try again.",
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
export const eventService = new EventService();

export default eventService;