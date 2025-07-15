import { ethers } from 'ethers';
import { transactionService, TransactionResult, GasEstimate } from './transactionService';
import { CONTRACTS } from '@/contracts/addresses';

export interface TipResult extends TransactionResult {
  tipId?: string;
  performerId: string;
  amount: string;
  message?: string;
  timestamp: number;
}

export interface TipRecord {
  id: string;
  performerId: string;
  tipper: string;
  amount: string;
  message?: string;
  timestamp: number;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
}

class RealTippingService {
  private contractAddress: string;
  private contractABI: any[];

  constructor() {
    this.contractAddress = CONTRACTS.MegaVibeTipping;
    // Import the ABI from your contracts
    this.contractABI = require('@/contracts/abis/MegaVibeTipping.json');
  }

  async sendTip(
    performerId: string, 
    amount: number, 
    message?: string
  ): Promise<TipResult> {
    try {
      // Initialize transaction service
      await transactionService.initialize();

      // Convert amount to wei (assuming amount is in ETH)
      const amountWei = ethers.parseEther(amount.toString());

      // Prepare contract call parameters
      const params = [performerId, message || ''];

      // Send transaction
      const result = await transactionService.sendTransaction(
        this.contractAddress,
        'sendTip',
        params,
        amountWei.toString()
      );

      // Store tip record locally for immediate UI update
      const tipRecord: TipRecord = {
        id: `tip_${Date.now()}`,
        performerId,
        tipper: await this.getCurrentUserAddress(),
        amount: amount.toString(),
        message,
        timestamp: Date.now(),
        txHash: result.txHash,
        status: 'pending'
      };

      this.storeTipRecord(tipRecord);

      return {
        ...result,
        performerId,
        amount: amount.toString(),
        message,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Failed to send tip:', error);
      throw error;
    }
  }

  async estimateTipGas(performerId: string, amount: number, message?: string): Promise<GasEstimate> {
    try {
      await transactionService.initialize();
      
      const amountWei = ethers.parseEther(amount.toString());
      const params = [performerId, message || ''];

      return await transactionService.estimateGas(
        this.contractAddress,
        'sendTip',
        params,
        amountWei.toString()
      );
    } catch (error) {
      console.error('Failed to estimate tip gas:', error);
      throw error;
    }
  }

  async getTipStatus(txHash: string): Promise<TipResult | null> {
    try {
      const result = await transactionService.getTransactionStatus(txHash);
      
      // Get tip record from local storage
      const tipRecord = this.getTipRecord(txHash);
      if (!tipRecord) return null;

      // Update local record status
      tipRecord.status = result.status;
      this.updateTipRecord(tipRecord);

      return {
        ...result,
        performerId: tipRecord.performerId,
        amount: tipRecord.amount,
        message: tipRecord.message,
        timestamp: tipRecord.timestamp
      };
    } catch (error) {
      console.error('Failed to get tip status:', error);
      return null;
    }
  }

  async getPerformerTips(performerId: string): Promise<TipRecord[]> {
    // In production, this would query the blockchain or backend API
    // For now, return from local storage
    const allTips = this.getAllTipRecords();
    return allTips.filter(tip => tip.performerId === performerId);
  }

  async getUserTips(userAddress?: string): Promise<TipRecord[]> {
    const address = userAddress || await this.getCurrentUserAddress();
    const allTips = this.getAllTipRecords();
    return allTips.filter(tip => tip.tipper.toLowerCase() === address.toLowerCase());
  }

  // Contract interaction methods
  getContractAddress(): string {
    return this.contractAddress;
  }

  getContract(signer: ethers.Signer): ethers.Contract {
    return new ethers.Contract(this.contractAddress, this.contractABI, signer);
  }

  // Local storage methods for immediate UI updates
  private storeTipRecord(tip: TipRecord): void {
    const tips = this.getAllTipRecords();
    tips.push(tip);
    localStorage.setItem('megavibe_tips', JSON.stringify(tips));
  }

  private getTipRecord(txHash: string): TipRecord | null {
    const tips = this.getAllTipRecords();
    return tips.find(tip => tip.txHash === txHash) || null;
  }

  private updateTipRecord(updatedTip: TipRecord): void {
    const tips = this.getAllTipRecords();
    const index = tips.findIndex(tip => tip.txHash === updatedTip.txHash);
    if (index !== -1) {
      tips[index] = updatedTip;
      localStorage.setItem('megavibe_tips', JSON.stringify(tips));
    }
  }

  private getAllTipRecords(): TipRecord[] {
    try {
      const stored = localStorage.getItem('megavibe_tips');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to parse tip records:', error);
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

  // Real-time tip monitoring
  async subscribeToTipEvents(
    performerId: string, 
    callback: (tip: TipRecord) => void
  ): Promise<() => void> {
    try {
      await transactionService.initialize();
      const contract = this.getContract(await new ethers.BrowserProvider(window.ethereum).getSigner());
      
      // Listen for TipSent events
      const filter = contract.filters.TipSent(performerId);
      
      const listener = (performerId: string, tipper: string, amount: bigint, message: string, event: any) => {
        const tipRecord: TipRecord = {
          id: `tip_${event.blockNumber}_${event.transactionIndex}`,
          performerId,
          tipper,
          amount: ethers.formatEther(amount),
          message: message || undefined,
          timestamp: Date.now(),
          txHash: event.transactionHash,
          status: 'confirmed'
        };
        
        this.storeTipRecord(tipRecord);
        callback(tipRecord);
      };

      contract.on(filter, listener);

      // Return cleanup function
      return () => {
        contract.off(filter, listener);
      };
    } catch (error) {
      console.error('Failed to subscribe to tip events:', error);
      return () => {}; // Return empty cleanup function
    }
  }

  // Utility methods
  async validatePerformer(performerId: string): Promise<boolean> {
    // In production, this would check if performer exists in the system
    // For now, return true for any non-empty ID
    return performerId.length > 0;
  }

  formatTipAmount(amount: string): string {
    try {
      const num = parseFloat(amount);
      return num.toFixed(4);
    } catch {
      return '0.0000';
    }
  }

  calculateTipWithFees(amount: number, gasEstimate: GasEstimate): {
    tipAmount: string;
    gasFee: string;
    total: string;
  } {
    const gasFeeEth = parseFloat(gasEstimate.estimatedCost);
    const total = amount + gasFeeEth;
    
    return {
      tipAmount: amount.toFixed(4),
      gasFee: gasFeeEth.toFixed(6),
      total: total.toFixed(4)
    };
  }

  // Token Approval Methods for One-Tap Tipping
  async approveTokens(amount: number): Promise<string> {
    try {
      await transactionService.initialize();
      
      // For ETH tips, we don't need token approval
      // This would be used for ERC-20 token tips
      const amountWei = ethers.parseEther(amount.toString());
      
      // Store approval locally for immediate UI feedback
      localStorage.setItem('megavibe_approved_amount', amount.toString());
      
      // In a real implementation, this would call approve() on an ERC-20 token
      // For ETH tips, we just store the user's intended spending limit
      return `approval_${Date.now()}`;
    } catch (error) {
      console.error('Failed to approve tokens:', error);
      throw error;
    }
  }

  async getApprovedAmount(): Promise<number> {
    try {
      const stored = localStorage.getItem('megavibe_approved_amount');
      return stored ? parseFloat(stored) : 0;
    } catch (error) {
      console.error('Failed to get approved amount:', error);
      return 0;
    }
  }

  async updateApprovedAmount(newAmount: number): Promise<void> {
    localStorage.setItem('megavibe_approved_amount', newAmount.toString());
  }
}

export const realTippingService = new RealTippingService();