/**
 * TippingService.ts
 * 
 * Service for handling tipping functionality, including cross-chain tipping,
 * tip history, and reputation updates.
 */

import { BaseService, ServiceResponse, ErrorCode } from './BaseService';
import { ethers } from 'ethers';

import ConfigService from './ConfigService';

interface Tip {
  tipper: string;
  recipient: string;
  amount: string;
  message: string;
  timestamp: number;
  eventId: string;
  speakerId: string;
  isWithdrawn: boolean;
}

export interface TipRequest {
  recipientAddress: string;
  amount: string; // Amount in smallest units (e.g., wei)
  message: string;
  eventId: string;
  speakerId: string;
}

export interface TipHistoryRequest {
  eventId?: string;
  speakerId?: string;
  limit?: number;
  offset?: number;
}

export class TippingService extends BaseService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private tippingContract: ethers.Contract | null = null;
  private usdcContract: ethers.Contract | null = null;

  constructor() {
    super('TippingService');
  }

  /**
   * Initialize the service with provider and signer
   */
  public async initialize(
    provider: ethers.Provider,
    signer: ethers.Signer
  ): Promise<ServiceResponse<boolean>> {
    return this.executeOperation(async () => {
      this.provider = provider;
      this.signer = signer;

      // Get current chain ID
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      
      // Get contract address and ABI from config
      const contractAddress = ConfigService.getContractAddress('TippingContract', chainId) ||
                             ConfigService.get('chains.0.contractAddresses.TippingContract');
      
      // Get contract ABI with proper typing for ethers.js
      const fallbackAbi = [
        'function tipSpeaker(address recipient, uint256 usdcAmount, string memory message, string memory eventId, string memory speakerId) external',
        'function withdrawTips() external',
        'function getSpeakerBalance(address speaker) external view returns (uint256)',
        'function getRecentEventTips(string memory eventId, uint256 limit) external view returns (tuple(address tipper, address recipient, uint256 amount, string message, uint256 timestamp, string eventId, string speakerId, bool isWithdrawn)[])',
        'function getEventTips(string memory eventId) external view returns (uint256[] memory)',
        'function getSpeakerTips(string memory speakerId) external view returns (uint256[] memory)',
        'function getTip(uint256 tipId) external view returns (tuple(address tipper, address recipient, uint256 amount, string message, uint256 timestamp, string eventId, string speakerId, bool isWithdrawn))'
      ];
      
      // Cast to a type that ethers.Contract accepts
      const contractAbi = (ConfigService.get('contracts.TippingContract.abi') as string[] | ethers.InterfaceAbi) || fallbackAbi;
      
      if (!contractAddress) {
        this.logError('Tipping contract address not found for chain ID', chainId);
        throw new Error(`Tipping contract address not found for chain ID ${chainId}`);
      }
      
      // Initialize contracts
      this.tippingContract = new ethers.Contract(
        contractAddress,
        contractAbi,
        this.signer
      );

      // We'll initialize USDC contract in a later implementation
      // Ideally this would come from a ContractRegistry

      this.logInfo('TippingService initialized successfully');
      return true;
    }, 'Failed to initialize TippingService');
  }

  /**
   * Send a tip to a speaker
   */
  public async sendTip(request: TipRequest): Promise<ServiceResponse<string>> {
    if (!this.tippingContract || !this.signer) {
      return this.error({
        code: ErrorCode.UNAUTHORIZED,
        message: 'Wallet not connected. Please connect your wallet to continue.'
      });
    }

    return this.executeOperation(async () => {
      this.logInfo('Sending tip', request);

      // In a full implementation, we would:
      // 1. Check USDC balance
      // 2. Approve USDC transfer if needed
      // 3. Then execute the tip transaction
      
      // For now, we'll just execute the tip transaction
      const tx = await this.tippingContract.tipSpeaker(
        request.recipientAddress,
        request.amount,
        request.message,
        request.eventId,
        request.speakerId
      );

      this.logInfo('Tip transaction submitted', tx.hash);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      this.logInfo('Tip transaction confirmed', receipt);
      
      return tx.hash;
    }, 'Failed to send tip');
  }

  /**
   * Get tips for an event
   */
  public async getEventTips(
    eventId: string,
    limit: number = 10
  ): Promise<ServiceResponse<Tip[]>> {
    if (!this.tippingContract || !this.provider) {
      return this.error({
        code: ErrorCode.UNAUTHORIZED,
        message: 'Wallet not connected. Please connect your wallet to continue.'
      });
    }

    return this.executeOperation(async () => {
      this.logInfo(`Fetching tips for event ${eventId}`);
      
      // Get recent tips for the event
      const tips = await this.tippingContract.getRecentEventTips(eventId, limit);
      
      return tips.map((tip: any) => ({
        tipper: tip.tipper,
        recipient: tip.recipient,
        amount: tip.amount.toString(),
        message: tip.message,
        timestamp: tip.timestamp.toNumber(),
        eventId: tip.eventId,
        speakerId: tip.speakerId,
        isWithdrawn: tip.isWithdrawn
      }));
    }, `Failed to fetch tips for event ${eventId}`);
  }

  /**
   * Get tips for a speaker
   */
  public async getSpeakerTips(
    speakerId: string,
    limit: number = 10
  ): Promise<ServiceResponse<Tip[]>> {
    if (!this.tippingContract || !this.provider) {
      return this.error({
        code: ErrorCode.UNAUTHORIZED,
        message: 'Wallet not connected. Please connect your wallet to continue.'
      });
    }

    return this.executeOperation(async () => {
      this.logInfo(`Fetching tips for speaker ${speakerId}`);
      
      // Get tip IDs for the speaker
      const tipIds = await this.tippingContract.getSpeakerTips(speakerId);
      
      // Get the most recent tips (up to the limit)
      const tipPromises = tipIds
        .slice(Math.max(0, tipIds.length - limit))
        .map((tipId: ethers.BigNumberish) => 
          this.tippingContract?.getTip(tipId)
        );
      
      const tips = await Promise.all(tipPromises);
      
      return tips.map((tip: any) => ({
        tipper: tip.tipper,
        recipient: tip.recipient,
        amount: tip.amount.toString(),
        message: tip.message,
        timestamp: tip.timestamp.toNumber(),
        eventId: tip.eventId,
        speakerId: tip.speakerId,
        isWithdrawn: tip.isWithdrawn
      }));
    }, `Failed to fetch tips for speaker ${speakerId}`);
  }

  /**
   * Get speaker's balance
   */
  public async getSpeakerBalance(
    speakerAddress: string
  ): Promise<ServiceResponse<string>> {
    if (!this.tippingContract || !this.provider) {
      return this.error({
        code: ErrorCode.UNAUTHORIZED,
        message: 'Wallet not connected. Please connect your wallet to continue.'
      });
    }

    return this.executeOperation(async () => {
      this.logInfo(`Fetching balance for speaker ${speakerAddress}`);
      
      const balance = await this.tippingContract.getSpeakerBalance(speakerAddress);
      
      return balance.toString();
    }, `Failed to fetch balance for speaker ${speakerAddress}`);
  }

  /**
   * Withdraw tips (for speakers only)
   */
  public async withdrawTips(): Promise<ServiceResponse<string>> {
    if (!this.tippingContract || !this.signer) {
      return this.error({
        code: ErrorCode.UNAUTHORIZED,
        message: 'Wallet not connected. Please connect your wallet to continue.'
      });
    }

    return this.executeOperation(async () => {
      this.logInfo('Withdrawing tips');
      
      const tx = await this.tippingContract.withdrawTips();
      
      this.logInfo('Withdrawal transaction submitted', tx.hash);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      this.logInfo('Withdrawal transaction confirmed', receipt);
      
      return tx.hash;
    }, 'Failed to withdraw tips');
  }

  /**
   * Convert USD amount to token amount
   * This implementation uses configuration values with fallbacks
   */
  public async convertUSDToTokenAmount(usdAmount: number): Promise<string> {
    // Get configuration values with fallbacks
    const tokenDecimals = ConfigService.get<number>('tokens.USDC.decimals', 6);
    const exchangeRate = ConfigService.get<number>('tokens.USDC.exchangeRate', 1);
    
    // Calculate token amount using exchange rate
    const tokenAmount = usdAmount * exchangeRate;
    
    // Format with correct decimals
    // Ensure we don't lose precision by using appropriate number of decimal places
    const formattedAmount = tokenAmount.toFixed(tokenDecimals > 8 ? 8 : tokenDecimals);
    
    // Parse units with the proper number of decimals (USDC typically uses 6)
    const tokenAmountWithDecimals = ethers.parseUnits(formattedAmount, tokenDecimals);
    
    this.logInfo(`Converted ${usdAmount} USD to ${tokenAmountWithDecimals.toString()} tokens`);
    return tokenAmountWithDecimals.toString();
  }

  /**
   * Send a cross-chain tip using CrossChainService
   */
  public async sendCrossChainTip(
    sourceChainId: number,
    recipientAddress: string,
    amountUSD: number,
    message: string,
    eventId: string,
    speakerId: string,
    statusCallback?: (status: string, progress: number) => void
  ): Promise<ServiceResponse<{ txHash?: string; success: boolean }>> {
    return this.executeOperation(async () => {
      this.logInfo('Sending cross-chain tip', {
        sourceChainId,
        recipientAddress,
        amountUSD,
        eventId,
        speakerId
      });

      // Import dynamically to avoid circular dependencies
      const CrossChainService = (await import('./CrossChainService')).default;
      
      // Forward the request to CrossChainService
      const result = await CrossChainService.sendCrossChainTip(
        sourceChainId,
        recipientAddress,
        amountUSD,
        message,
        eventId,
        speakerId,
        statusCallback ? (status) => {
          if (status.progress !== undefined && statusCallback) {
            statusCallback(status.status, status.progress);
          }
        } : undefined
      );
      
      return {
        txHash: result.txHash,
        success: result.success
      };
    }, 'Failed to send cross-chain tip');
  }
}

export default new TippingService();