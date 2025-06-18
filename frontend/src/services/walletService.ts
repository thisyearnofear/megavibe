// walletService.ts - Wallet integration for MegaVibe tipping
import { ethers } from 'ethers';
import MegaVibeTippingABI from '../contracts/MegaVibeTipping.json';
import { env } from '../config/environment';

// Mantle Sepolia network configuration from centralized environment
export const MANTLE_SEPOLIA_CONFIG = {
  chainId: env.mantle.chainId,
  chainName: env.mantle.name,
  nativeCurrency: {
    name: 'MNT',
    symbol: 'MNT',
    decimals: 18,
  },
  rpcUrls: [env.mantle.rpcUrl],
  blockExplorerUrls: [env.mantle.blockExplorerUrl],
};

export interface TipTransaction {
  to: string;
  value: string;
  data: string;
  gasLimit?: string;
  gasPrice?: string;
}

export interface TipResult {
  txHash: string;
  blockNumber?: number;
  gasUsed?: string;
  success: boolean;
}

class WalletService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private contract: ethers.Contract | null = null;
  private contractAddress: string;
  private feeRecipient: string;
  private platformFeePercentage: number;

  constructor() {
    this.contractAddress = env.contracts.tipping.address;
    this.feeRecipient = env.fees.recipient;
    this.platformFeePercentage = env.fees.percentage;

    // Debug logging in development
    if (env.development.debug) {
      console.log('WalletService initialized with:', {
        contractAddress: this.contractAddress,
        chainId: MANTLE_SEPOLIA_CONFIG.chainId,
        rpcUrl: MANTLE_SEPOLIA_CONFIG.rpcUrls[0],
        feeRecipient: this.feeRecipient,
        platformFeePercentage: this.platformFeePercentage
      });
    }
  }

  // Initialize wallet connection
  async initialize(walletClient: any): Promise<boolean> {
    try {
      if (!walletClient) {
        throw new Error('Wallet client not provided');
      }

      // Create ethers provider from Dynamic wallet
      this.provider = new ethers.BrowserProvider(walletClient);
      this.signer = await this.provider.getSigner();

      // Initialize contract
      this.contract = new ethers.Contract(
        this.contractAddress,
        MegaVibeTippingABI.abi,
        this.signer
      );

      // Check if we're on the correct network
      const network = await this.provider.getNetwork();
      if (Number(network.chainId) !== MANTLE_SEPOLIA_CONFIG.chainId) {
        await this.switchToMantleSepolia();
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize wallet service:', error);
      return false;
    }
  }

  // Switch to Mantle Sepolia network
  async switchToMantleSepolia(): Promise<boolean> {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      // Request network switch
      await this.provider.send('wallet_switchEthereumChain', [
        { chainId: `0x${MANTLE_SEPOLIA_CONFIG.chainId.toString(16)}` }
      ]);

      return true;
    } catch (switchError: any) {
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await this.provider!.send('wallet_addEthereumChain', [
            {
              chainId: `0x${MANTLE_SEPOLIA_CONFIG.chainId.toString(16)}`,
              chainName: MANTLE_SEPOLIA_CONFIG.chainName,
              nativeCurrency: MANTLE_SEPOLIA_CONFIG.nativeCurrency,
              rpcUrls: MANTLE_SEPOLIA_CONFIG.rpcUrls,
              blockExplorerUrls: MANTLE_SEPOLIA_CONFIG.blockExplorerUrls,
            }
          ]);
          return true;
        } catch (addError) {
          console.error('Failed to add Mantle Sepolia network:', addError);
          return false;
        }
      }
      console.error('Failed to switch to Mantle Sepolia:', switchError);
      return false;
    }
  }

  // Get current wallet address
  async getAddress(): Promise<string | null> {
    try {
      if (!this.signer) {
        throw new Error('Signer not initialized');
      }
      return await this.signer.getAddress();
    } catch (error) {
      console.error('Failed to get wallet address:', error);
      return null;
    }
  }

  // Get wallet balance in MNT
  // Get current network information
  async getNetwork(): Promise<{ chainId: bigint; name: string } | null> {
    if (!this.provider) {
      return null;
    }

    try {
      const network = await this.provider.getNetwork();
      return {
        chainId: network.chainId,
        name: network.name
      };
    } catch (error) {
      console.error('Failed to get network:', error);
      return null;
    }
  }

  async getBalance(): Promise<string> {
    if (!this.provider || !this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const address = await this.signer.getAddress();
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Failed to get balance:', error);
      return '0';
    }
  }

  // Convert USD amount to MNT (simplified - in production use real price feed)
  async convertUSDToMNT(usdAmount: number): Promise<string> {
    try {
      // For testing, using a mock conversion rate: 1 MNT = $1000
      // In production, integrate with price oracle or API
      const mockMNTPrice = 1000; // $1000 per MNT
      const mntAmount = usdAmount / mockMNTPrice;
      return mntAmount.toString();
    } catch (error) {
      console.error('Failed to convert USD to MNT:', error);
      return '0';
    }
  }

  // Estimate gas for tip transaction
  async estimateGas(
    recipientAddress: string,
    amountMNT: string,
    message: string,
    eventId: string,
    speakerId: string
  ): Promise<string> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const valueInWei = ethers.parseEther(amountMNT);
      const gasEstimate = await this.contract.tipSpeaker.estimateGas(
        recipientAddress,
        message,
        eventId,
        speakerId,
        { value: valueInWei }
      );

      return gasEstimate.toString();
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      // Return a conservative estimate
      return '100000';
    }
  }

  // Send tip transaction
  async sendTip(
    recipientAddress: string,
    amountMNT: string,
    message: string,
    eventId: string,
    speakerId: string
  ): Promise<TipResult> {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Contract or signer not initialized');
      }

      const valueInWei = ethers.parseEther(amountMNT);

      // Send transaction
      const tx = await this.contract.tipSpeaker(
        recipientAddress,
        message,
        eventId,
        speakerId,
        {
          value: valueInWei,
          gasLimit: 150000, // Conservative gas limit
        }
      );

      console.log('Transaction sent:', tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();

      return {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        success: true,
      };
    } catch (error) {
      console.error('Failed to send tip:', error);
      return {
        txHash: '',
        success: false,
      };
    }
  }

  // Check if wallet is connected and on correct network
  async isReady(): Promise<boolean> {
    try {
      if (!this.provider || !this.signer || !this.contract) {
        return false;
      }

      const network = await this.provider.getNetwork();
      return Number(network.chainId) === MANTLE_SEPOLIA_CONFIG.chainId;
    } catch (error) {
      console.error('Failed to check wallet readiness:', error);
      return false;
    }
  }

  // Get contract events for tips
  async getTipEvents(eventId?: string): Promise<Array<{
    txHash: string;
    blockNumber: number;
    tipper: string;
    recipient: string;
    amount: string;
    message: string;
    eventId: string;
    speakerId: string;
    timestamp: bigint;
  }>> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const filter = this.contract.filters.TipSent();
      const events = await this.contract.queryFilter(filter, -1000); // Last 1000 blocks

      return events
        .filter((event): event is ethers.EventLog => 'args' in event)
        .filter(event => !eventId || event.args?.eventId === eventId)
        .map(event => ({
          txHash: event.transactionHash,
          blockNumber: event.blockNumber,
          tipper: event.args?.tipper || '',
          recipient: event.args?.recipient || '',
          amount: ethers.formatEther(event.args?.amount || '0'),
          message: event.args?.message || '',
          eventId: event.args?.eventId || '',
          speakerId: event.args?.speakerId || '',
          timestamp: event.args?.timestamp || BigInt(0),
        }));
    } catch (error) {
      console.error('Failed to get tip events:', error);
      return [];
    }
  }

  // Get current network info
  async getNetworkInfo(): Promise<{ chainId: number; name: string } | null> {
    try {
      if (!this.provider) {
        return null;
      }

      const network = await this.provider.getNetwork();
      return {
        chainId: Number(network.chainId),
        name: network.name,
      };
    } catch (error) {
      console.error('Failed to get network info:', error);
      return null;
    }
  }

  // Format transaction hash for display
  formatTxHash(hash: string): string {
    if (!hash) return '';
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  }

  // Get transaction explorer URL
  getTxExplorerUrl(hash: string): string {
    return `${MANTLE_SEPOLIA_CONFIG.blockExplorerUrls[0]}/tx/${hash}`;
  }

  // Get address explorer URL
  getAddressExplorerUrl(address: string): string {
    return `${MANTLE_SEPOLIA_CONFIG.blockExplorerUrls[0]}/address/${address}`;
  }

  // Cleanup
  disconnect(): void {
    this.provider = null;
    this.signer = null;
    this.contract = null;
  }
}

// Export singleton instance
export const walletService = new WalletService();
export default walletService;
