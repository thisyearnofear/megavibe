import { ethers } from 'ethers';
import { getAccount, getNetwork, readContract, writeContract, waitForTransaction } from '@wagmi/core';
import TippingContractABI from '../contracts/abis/TippingContract.json';
import BountyContractABI from '../contracts/abis/BountyContract.json';

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
const TIPPING_CONTRACT_ADDRESS = import.meta.env.VITE_TIPPING_CONTRACT_ADDRESS;
const BOUNTY_CONTRACT_ADDRESS = import.meta.env.VITE_BOUNTY_CONTRACT_ADDRESS;
const FEE_RECIPIENT_ADDRESS = import.meta.env.VITE_FEE_RECIPIENT_ADDRESS;
const PLATFORM_FEE_PERCENTAGE = Number(import.meta.env.VITE_PLATFORM_FEE_PERCENTAGE || '5');

// Mantle Sepolia network configuration
const MANTLE_SEPOLIA = {
  id: 5003,
  name: 'Mantle Sepolia',
  rpcUrl: import.meta.env.VITE_MANTLE_RPC_URL || 'https://rpc.sepolia.mantle.xyz',
  blockExplorer: 'https://explorer.sepolia.mantle.xyz',
};

class ContractService {
  /**
   * Ensures the user is connected to Mantle Sepolia network
   */
  async ensureMantleNetwork(): Promise&lt;boolean&gt; {
    try {
      const network = await getNetwork();
      if (network.chain?.id !== MANTLE_SEPOLIA.id) {
        const ethereum = window.ethereum;
        if (!ethereum) throw new Error('No Ethereum provider found');
        
        try {
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${MANTLE_SEPOLIA.id.toString(16)}` }],
          });
          return true;
        } catch (switchError: any) {
          // Chain hasn't been added to MetaMask
          if (switchError.code === 4902) {
            await ethereum.request({
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
  async sendTip(recipientAddress: string, amount: string, message: string = ''): Promise&lt;string&gt; {
    // Validate inputs
    if (!this.validateAddress(recipientAddress)) {
      throw new Error('Invalid recipient address');
    }
    
    if (!this.validateAmount(amount)) {
      throw new Error('Invalid amount');
    }
    
    await this.ensureMantleNetwork();
    
    try {
      const account = getAccount();
      if (!account.address) throw new Error('No wallet connected');
      
      const tx = await writeContract({
        address: TIPPING_CONTRACT_ADDRESS as `0x${string}`,
        abi: TippingContractABI,
        functionName: 'sendTip',
        args: [recipientAddress, message],
        value: ethers.utils.parseEther(amount),
      });
      
      const receipt = await waitForTransaction({ hash: tx.hash });
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
    title: string, 
    description: string, 
    amount: string, 
    deadline: number
  ): Promise&lt;string&gt; {
    // Validate inputs
    if (!this.validateAmount(amount)) {
      throw new Error('Invalid amount');
    }
    
    await this.ensureMantleNetwork();
    
    try {
      const account = getAccount();
      if (!account.address) throw new Error('No wallet connected');
      
      const tx = await writeContract({
        address: BOUNTY_CONTRACT_ADDRESS as `0x${string}`,
        abi: BountyContractABI,
        functionName: 'createBounty',
        args: [title, description, deadline],
        value: ethers.utils.parseEther(amount),
      });
      
      const receipt = await waitForTransaction({ hash: tx.hash });
      return tx.hash;
    } catch (error) {
      console.error('Error creating bounty:', error);
      throw error;
    }
  }

  /**
   * Claim a bounty (for content creators)
   */
  async claimBounty(bountyId: string, contentUrl: string): Promise&lt;string&gt; {
    await this.ensureMantleNetwork();
    
    try {
      const tx = await writeContract({
        address: BOUNTY_CONTRACT_ADDRESS as `0x${string}`,
        abi: BountyContractABI,
        functionName: 'claimBounty',
        args: [bountyId, contentUrl],
      });
      
      const receipt = await waitForTransaction({ hash: tx.hash });
      return tx.hash;
    } catch (error) {
      console.error('Error claiming bounty:', error);
      throw error;
    }
  }

  /**
   * Get all bounties for an event
   */
  async getBountiesForEvent(eventId: string): Promise&lt;Bounty[]&gt; {
    try {
      const data = await readContract({
        address: BOUNTY_CONTRACT_ADDRESS as `0x${string}`,
        abi: BountyContractABI,
        functionName: 'getBountiesForEvent',
        args: [eventId],
      });
      
      // Transform the raw data into our typed interface
      return (data as any[]).map(item => ({
        id: item.id.toString(),
        creator: item.creator,
        title: item.title,
        description: item.description,
        amount: ethers.utils.formatEther(item.amount),
        deadline: item.deadline.toNumber(),
        status: this.getBountyStatus(item),
        claimer: item.claimer !== ethers.constants.AddressZero ? item.claimer : undefined,
        contentUrl: item.contentUrl || undefined
      }));
    } catch (error) {
      console.error('Error fetching bounties:', error);
      return [];
    }
  }

  /**
   * Get tips for a specific recipient
   */
  async getTipsForRecipient(recipientAddress: string): Promise&lt;any[]&gt; {
    try {
      const data = await readContract({
        address: TIPPING_CONTRACT_ADDRESS as `0x${string}`,
        abi: TippingContractABI,
        functionName: 'getTipsForRecipient',
        args: [recipientAddress],
      });
      
      return data as any[];
    } catch (error) {
      console.error('Error fetching tips:', error);
      return [];
    }
  }

  /**
   * Calculate platform fee for a given amount
   */
  calculatePlatformFee(amount: string): string {
    const amountBN = ethers.utils.parseEther(amount);
    const feePercentage = PLATFORM_FEE_PERCENTAGE;
    const feeBN = amountBN.mul(feePercentage).div(100);
    return ethers.utils.formatEther(feeBN);
  }

  // Add a helper method to determine bounty status
  private getBountyStatus(bounty: any): 'open' | 'claimed' | 'expired' {
    if (bounty.claimer !== ethers.constants.AddressZero) {
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
    return ethers.utils.isAddress(address);
  }

  private validateAmount(amount: string): boolean {
    try {
      const amountBN = ethers.utils.parseEther(amount);
      return amountBN.gt(0);
    } catch (error) {
      return false;
    }
  }
}

export default new ContractService();