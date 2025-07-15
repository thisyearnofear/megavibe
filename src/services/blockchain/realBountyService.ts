import { ethers } from 'ethers';
import { transactionService, TransactionResult, GasEstimate } from './transactionService';
import { CONTRACTS } from '@/contracts/addresses';

export interface BountyResult extends TransactionResult {
  bountyId?: string;
  performerId: string;
  requestType: string;
  description: string;
  amount: string;
  timestamp: number;
}

export interface BountyRecord {
  id: string;
  performerId: string;
  creator: string;
  requestType: string;
  description: string;
  amount: string;
  timestamp: number;
  deadline?: number;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed' | 'completed' | 'cancelled';
  responses?: BountyResponse[];
}

export interface BountyResponse {
  id: string;
  bountyId: string;
  responder: string;
  content: string;
  timestamp: number;
  txHash?: string;
  status: 'pending' | 'accepted' | 'rejected';
}

class RealBountyService {
  private contractAddress: string;
  private contractABI: any[];

  constructor() {
    this.contractAddress = CONTRACTS.MegaVibeBounties;
    this.contractABI = require('@/contracts/abis/MegaVibeBounties.json');
  }

  async createBounty(
    performerId: string,
    requestType: string,
    description: string,
    amount: number,
    deadline?: number
  ): Promise<BountyResult> {
    try {
      await transactionService.initialize();

      // Convert amount to wei
      const amountWei = ethers.parseEther(amount.toString());
      
      // Set default deadline (24 hours from now)
      const bountyDeadline = deadline || Math.floor(Date.now() / 1000) + (24 * 60 * 60);

      // Prepare contract call parameters
      const params = [performerId, requestType, description, bountyDeadline];

      // Send transaction
      const result = await transactionService.sendTransaction(
        this.contractAddress,
        'createBounty',
        params,
        amountWei.toString()
      );

      // Store bounty record locally for immediate UI update
      const bountyRecord: BountyRecord = {
        id: `bounty_${Date.now()}`,
        performerId,
        creator: await this.getCurrentUserAddress(),
        requestType,
        description,
        amount: amount.toString(),
        timestamp: Date.now(),
        deadline: bountyDeadline * 1000, // Convert to milliseconds
        txHash: result.txHash,
        status: 'pending',
        responses: []
      };

      this.storeBountyRecord(bountyRecord);

      return {
        ...result,
        performerId,
        requestType,
        description,
        amount: amount.toString(),
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Failed to create bounty:', error);
      throw error;
    }
  }

  async estimateBountyGas(
    performerId: string,
    requestType: string,
    description: string,
    amount: number,
    deadline?: number
  ): Promise<GasEstimate> {
    try {
      await transactionService.initialize();
      
      const amountWei = ethers.parseEther(amount.toString());
      const bountyDeadline = deadline || Math.floor(Date.now() / 1000) + (24 * 60 * 60);
      const params = [performerId, requestType, description, bountyDeadline];

      return await transactionService.estimateGas(
        this.contractAddress,
        'createBounty',
        params,
        amountWei.toString()
      );
    } catch (error) {
      console.error('Failed to estimate bounty gas:', error);
      throw error;
    }
  }

  async submitBountyResponse(
    bountyId: string,
    content: string
  ): Promise<TransactionResult> {
    try {
      await transactionService.initialize();

      const params = [bountyId, content];

      const result = await transactionService.sendTransaction(
        this.contractAddress,
        'submitResponse',
        params
      );

      // Store response locally
      const response: BountyResponse = {
        id: `response_${Date.now()}`,
        bountyId,
        responder: await this.getCurrentUserAddress(),
        content,
        timestamp: Date.now(),
        txHash: result.txHash,
        status: 'pending'
      };

      this.storeBountyResponse(response);

      return result;
    } catch (error) {
      console.error('Failed to submit bounty response:', error);
      throw error;
    }
  }

  async acceptBountyResponse(
    bountyId: string,
    responseId: string
  ): Promise<TransactionResult> {
    try {
      await transactionService.initialize();

      const params = [bountyId, responseId];

      const result = await transactionService.sendTransaction(
        this.contractAddress,
        'acceptResponse',
        params
      );

      // Update local records
      this.updateBountyStatus(bountyId, 'completed');
      this.updateResponseStatus(responseId, 'accepted');

      return result;
    } catch (error) {
      console.error('Failed to accept bounty response:', error);
      throw error;
    }
  }

  async getBountyStatus(txHash: string): Promise<BountyResult | null> {
    try {
      const result = await transactionService.getTransactionStatus(txHash);
      
      const bountyRecord = this.getBountyRecord(txHash);
      if (!bountyRecord) return null;

      // Update local record status
      bountyRecord.status = result.status;
      this.updateBountyRecord(bountyRecord);

      return {
        ...result,
        performerId: bountyRecord.performerId,
        requestType: bountyRecord.requestType,
        description: bountyRecord.description,
        amount: bountyRecord.amount,
        timestamp: bountyRecord.timestamp
      };
    } catch (error) {
      console.error('Failed to get bounty status:', error);
      return null;
    }
  }

  async getPerformerBounties(performerId: string): Promise<BountyRecord[]> {
    const allBounties = this.getAllBountyRecords();
    return allBounties.filter(bounty => bounty.performerId === performerId);
  }

  async getUserBounties(userAddress?: string): Promise<BountyRecord[]> {
    const address = userAddress || await this.getCurrentUserAddress();
    const allBounties = this.getAllBountyRecords();
    return allBounties.filter(bounty => bounty.creator.toLowerCase() === address.toLowerCase());
  }

  async getBountyResponses(bountyId: string): Promise<BountyResponse[]> {
    const allResponses = this.getAllBountyResponses();
    return allResponses.filter(response => response.bountyId === bountyId);
  }

  // Contract interaction methods
  getContractAddress(): string {
    return this.contractAddress;
  }

  getContract(signer: ethers.Signer): ethers.Contract {
    return new ethers.Contract(this.contractAddress, this.contractABI, signer);
  }

  // Local storage methods for immediate UI updates
  private storeBountyRecord(bounty: BountyRecord): void {
    const bounties = this.getAllBountyRecords();
    bounties.push(bounty);
    localStorage.setItem('megavibe_bounties', JSON.stringify(bounties));
  }

  private getBountyRecord(txHash: string): BountyRecord | null {
    const bounties = this.getAllBountyRecords();
    return bounties.find(bounty => bounty.txHash === txHash) || null;
  }

  private updateBountyRecord(updatedBounty: BountyRecord): void {
    const bounties = this.getAllBountyRecords();
    const index = bounties.findIndex(bounty => bounty.txHash === updatedBounty.txHash);
    if (index !== -1) {
      bounties[index] = updatedBounty;
      localStorage.setItem('megavibe_bounties', JSON.stringify(bounties));
    }
  }

  private updateBountyStatus(bountyId: string, status: BountyRecord['status']): void {
    const bounties = this.getAllBountyRecords();
    const index = bounties.findIndex(bounty => bounty.id === bountyId);
    if (index !== -1) {
      bounties[index].status = status;
      localStorage.setItem('megavibe_bounties', JSON.stringify(bounties));
    }
  }

  private getAllBountyRecords(): BountyRecord[] {
    try {
      const stored = localStorage.getItem('megavibe_bounties');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to parse bounty records:', error);
      return [];
    }
  }

  private storeBountyResponse(response: BountyResponse): void {
    const responses = this.getAllBountyResponses();
    responses.push(response);
    localStorage.setItem('megavibe_bounty_responses', JSON.stringify(responses));
  }

  private updateResponseStatus(responseId: string, status: BountyResponse['status']): void {
    const responses = this.getAllBountyResponses();
    const index = responses.findIndex(response => response.id === responseId);
    if (index !== -1) {
      responses[index].status = status;
      localStorage.setItem('megavibe_bounty_responses', JSON.stringify(responses));
    }
  }

  private getAllBountyResponses(): BountyResponse[] {
    try {
      const stored = localStorage.getItem('megavibe_bounty_responses');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to parse bounty responses:', error);
      return [];
    }
  }

  private async getCurrentUserAddress(): Promise<string> {
    if (typeof window !== 'undefined' && window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      return await signer.getAddress();
    }
    throw new Error('No wallet connected');
  }

  // Real-time bounty monitoring
  async subscribeToBountyEvents(
    performerId: string,
    callback: (bounty: BountyRecord) => void
  ): Promise<() => void> {
    try {
      await transactionService.initialize();
      const contract = this.getContract(await new ethers.BrowserProvider(window.ethereum).getSigner());
      
      const filter = contract.filters.BountyCreated(performerId);
      
      const listener = (
        bountyId: string,
        performerId: string,
        creator: string,
        requestType: string,
        description: string,
        amount: bigint,
        deadline: bigint,
        event: any
      ) => {
        const bountyRecord: BountyRecord = {
          id: bountyId,
          performerId,
          creator,
          requestType,
          description,
          amount: ethers.formatEther(amount),
          timestamp: Date.now(),
          deadline: Number(deadline) * 1000,
          txHash: event.transactionHash,
          status: 'confirmed',
          responses: []
        };
        
        this.storeBountyRecord(bountyRecord);
        callback(bountyRecord);
      };

      contract.on(filter, listener);

      return () => {
        contract.off(filter, listener);
      };
    } catch (error) {
      console.error('Failed to subscribe to bounty events:', error);
      return () => {};
    }
  }

  // Utility methods
  async validateBountyRequest(
    performerId: string,
    requestType: string,
    description: string,
    amount: number
  ): Promise<{ valid: boolean; error?: string }> {
    if (!performerId || performerId.length === 0) {
      return { valid: false, error: 'Performer ID is required' };
    }

    if (!requestType || requestType.length === 0) {
      return { valid: false, error: 'Request type is required' };
    }

    if (!description || description.trim().length === 0) {
      return { valid: false, error: 'Description is required' };
    }

    if (amount <= 0) {
      return { valid: false, error: 'Amount must be greater than 0' };
    }

    if (amount > 1000) { // Reasonable upper limit
      return { valid: false, error: 'Amount is too large' };
    }

    return { valid: true };
  }

  formatBountyAmount(amount: string): string {
    try {
      const num = parseFloat(amount);
      return num.toFixed(4);
    } catch {
      return '0.0000';
    }
  }

  calculateTimeRemaining(deadline: number): {
    expired: boolean;
    timeLeft: string;
    urgency: 'low' | 'medium' | 'high';
  } {
    const now = Date.now();
    const timeLeft = deadline - now;
    
    if (timeLeft <= 0) {
      return { expired: true, timeLeft: 'Expired', urgency: 'high' };
    }

    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    let urgency: 'low' | 'medium' | 'high' = 'low';
    if (hours < 2) urgency = 'high';
    else if (hours < 6) urgency = 'medium';

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return { expired: false, timeLeft: `${days}d ${hours % 24}h`, urgency };
    }

    return { expired: false, timeLeft: `${hours}h ${minutes}m`, urgency };
  }
}

export const realBountyService = new RealBountyService();