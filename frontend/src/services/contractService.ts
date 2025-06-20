import { ethers, Contract, JsonRpcProvider, BrowserProvider, formatEther, parseEther, isAddress } from 'ethers';
import MegaVibeTippingABI from '../contracts/MegaVibeTipping.json';
import MegaVibeBountiesABI from '../contracts/MegaVibeBounties.json';

// Add these interfaces at the top of the file
interface Tip {
  sender: string;
  recipient: string;
  amount: string;
  message: string;
  timestamp: number;
  id: string;
}

interface Bounty {
  id: string;
  creator: string;
  title: string;
  description: string;
  amount: string;
  deadline: number;
  status: 'open' | 'claimed' | 'expired';
  claimer?: string;
  contentUrl?: string;
}

// Use the deployed contract addresses from environment variables
const TIPPING_CONTRACT_ADDRESS = process.env.VITE_TIPPING_CONTRACT_ADDRESS;
const BOUNTY_CONTRACT_ADDRESS = process.env.VITE_BOUNTY_CONTRACT_ADDRESS;
const FEE_RECIPIENT_ADDRESS = process.env.VITE_FEE_RECIPIENT_ADDRESS;
const PLATFORM_FEE_PERCENTAGE = Number(process.env.VITE_PLATFORM_FEE_PERCENTAGE || '5');

// Mantle Sepolia network configuration
const MANTLE_SEPOLIA = {
  id: 5003,
  name: 'Mantle Sepolia',
  rpcUrl: process.env.VITE_MANTLE_RPC_URL || 'https://rpc.sepolia.mantle.xyz',
  blockExplorer: 'https://explorer.sepolia.mantle.xyz',
};

class ContractService {
  private provider: JsonRpcProvider | BrowserProvider | null = null;
  private signer: any | null = null;

  /**
   * Initialize the contract service with a provider and signer
   */
  async initialize(walletClient?: any): Promise<boolean> {
    try {
      // Use the wallet client if provided, otherwise use the RPC provider
      if (walletClient) {
        this.provider = new BrowserProvider(walletClient);
        this.signer = await this.provider.getSigner();
      } else {
        this.provider = new JsonRpcProvider(MANTLE_SEPOLIA.rpcUrl);
      }
      return true;
    } catch (error) {
      console.error('Failed to initialize contract service:', error);
      return false;
    }
  }

  /**
   * Ensures the user is connected to Mantle Sepolia network
   */
  async ensureMantleNetwork(): Promise<boolean> {
    try {
      if (!window.ethereum) throw new Error('No Ethereum provider found');
      
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(chainId, 16);
      
      if (currentChainId !== MANTLE_SEPOLIA.id) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${MANTLE_SEPOLIA.id.toString(16)}` }],
          });
          return true;
        } catch (switchError: any) {
          // Chain hasn't been added to MetaMask
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: `0x${MANTLE_SEPOLIA.id.toString(16)}`,
                  chainName: MANTLE_SEPOLIA.name,
                  nativeCurrency: {
                    name: 'MNT',
                    symbol: 'MNT',
                    decimals: 18,
                  },
                  rpcUrls: [MANTLE_SEPOLIA.rpcUrl],
                  blockExplorerUrls: [MANTLE_SEPOLIA.blockExplorer],
                },
              ],
            });
            return true;
          }
          throw switchError;
        }
      }
      return true;
    } catch (error) {
      console.error('Failed to ensure Mantle Sepolia network:', error);
      return false;
    }
  }

  /**
   * Send a tip to a speaker/performer
   */
  async sendTip(
    recipientAddress: string, 
    amount: string, 
    message: string = '',
    eventId: string = 'current-event',
    speakerId: string = 'current-speaker'
  ): Promise<string> {
    // Validate inputs
    if (!this.validateAddress(recipientAddress)) {
      throw new Error('Invalid recipient address');
    }
    
    if (!this.validateAmount(amount)) {
      throw new Error('Invalid amount');
    }
    
    await this.ensureMantleNetwork();
    
    try {
      if (!this.signer) throw new Error('No signer available');
      
      const contract = new Contract(
        TIPPING_CONTRACT_ADDRESS, 
        MegaVibeTippingABI.abi, 
        this.signer
      );
      
      const tx = await contract.tipSpeaker(
        recipientAddress, 
        message, 
        eventId, 
        speakerId,
        { value: parseEther(amount) }
      );
      
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error sending tip:', error);
      throw error;
    }
  }

  /**
   * Create a bounty for content
   */
  async createBounty(
    eventId: string,
    speakerId: string,
    description: string, 
    amount: string, 
    deadline: number
  ): Promise<string> {
    // Validate inputs
    if (!this.validateAmount(amount)) {
      throw new Error('Invalid amount');
    }
    
    await this.ensureMantleNetwork();
    
    try {
      if (!this.signer) throw new Error('No signer available');
      
      const contract = new Contract(
        BOUNTY_CONTRACT_ADDRESS, 
        MegaVibeBountiesABI.abi, 
        this.signer
      );
      
      const tx = await contract.createBounty(
        eventId, 
        speakerId, 
        description, 
        deadline,
        { value: parseEther(amount) }
      );
      
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error creating bounty:', error);
      throw error;
    }
  }

  /**
   * Claim a bounty (for content creators)
   */
  async claimBounty(bountyId: number, submissionHash: string): Promise<string> {
    await this.ensureMantleNetwork();
    
    try {
      if (!this.signer) throw new Error('No signer available');
      
      const contract = new Contract(
        BOUNTY_CONTRACT_ADDRESS, 
        MegaVibeBountiesABI.abi, 
        this.signer
      );
      
      const tx = await contract.claimBounty(bountyId, submissionHash);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error claiming bounty:', error);
      throw error;
    }
  }

  /**
   * Get all bounties for an event
   */
  async getBountiesForEvent(eventId: string): Promise<Bounty[]> {
    try {
      if (!this.provider) {
        await this.initialize();
      }
      
      const contract = new Contract(
        BOUNTY_CONTRACT_ADDRESS, 
        MegaVibeBountiesABI.abi, 
        this.provider
      );
      
      const data = await contract.getActiveBountiesForEvent(eventId);
      
      // Transform the raw data into our typed interface
      return (data as any[]).map((item, index) => ({
        id: index.toString(),
        creator: item.sponsor,
        title: '', // No title field in contract
        description: item.description,
        amount: formatEther(item.reward),
        deadline: item.deadline.toNumber(),
        status: this.getBountyStatus(item),
        claimer: item.claimed && item.claimant !== '0x0000000000000000000000000000000000000000' ? item.claimant : undefined,
        contentUrl: item.submissionHash || undefined
      }));
    } catch (error) {
      console.error('Error fetching bounties:', error);
      return [];
    }
  }

  /**
   * Get recent tips for an event
   */
  async getRecentTipsForEvent(eventId: string, limit: number = 10): Promise<any[]> {
    try {
      if (!this.provider) {
        await this.initialize();
      }
      
      const contract = new Contract(
        TIPPING_CONTRACT_ADDRESS, 
        MegaVibeTippingABI.abi, 
        this.provider
      );
      
      const data = await contract.getRecentEventTips(eventId, limit);
      return data as any[];
    } catch (error) {
      console.error('Error fetching recent tips:', error);
      return [];
    }
  }

  /**
   * Calculate platform fee for a given amount
   */
  calculatePlatformFee(amount: string): string {
    const amountBN = parseEther(amount);
    const feePercentage = PLATFORM_FEE_PERCENTAGE;
    const feeBN = (amountBN * BigInt(feePercentage)) / BigInt(100);
    return formatEther(feeBN);
  }

  // Add a helper method to determine bounty status
  private getBountyStatus(bounty: any): 'open' | 'claimed' | 'expired' {
    if (bounty.claimed) {
      return 'claimed';
    }
    
    const now = Math.floor(Date.now() / 1000);
    if (bounty.deadline.toNumber() < now) {
      return 'expired';
    }
    
    return 'open';
  }

  // Add validation methods
  private validateAddress(address: string): boolean {
    return isAddress(address);
  }

  private validateAmount(amount: string): boolean {
    try {
      const amountBN = parseEther(amount);
      return amountBN > 0n;
    } catch (error) {
      return false;
    }
  }
}

export default new ContractService();
