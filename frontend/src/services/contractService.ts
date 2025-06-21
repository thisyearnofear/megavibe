import { ethers, Contract, JsonRpcProvider, BrowserProvider, formatEther, parseEther, isAddress } from 'ethers';
import MegaVibeTippingABI from '../contracts/MegaVibeTipping.json';
import MegaVibeBountiesABI from '../contracts/MegaVibeBounties.json';

// Use 'active' to align with filter hooks
export interface Bounty {
  id: string;
  creator: string;
  title: string;
  description: string;
  amount: string;
  deadline: number;
  status: 'active' | 'claimed' | 'expired';
  claimer?: string;
  contentUrl?: string;
}

const TIPPING_CONTRACT_ADDRESS = import.meta.env.VITE_TIPPING_CONTRACT_ADDRESS;
const BOUNTY_CONTRACT_ADDRESS = import.meta.env.VITE_BOUNTY_CONTRACT_ADDRESS;

const MANTLE_SEPOLIA = {
  id: 5003,
  name: 'Mantle Sepolia',
  rpcUrl: import.meta.env.VITE_MANTLE_RPC_URL || 'https://rpc.sepolia.mantle.xyz',
  blockExplorer: 'https://explorer.sepolia.mantle.xyz',
};

class ContractService {
  private provider: JsonRpcProvider | BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private tippingContract: Contract | null = null;
  private bountyContract: Contract | null = null;
  private bountyContractReadOnly: Contract | null = null;

  async initialize(walletClient?: any): Promise<boolean> {
    try {
      if (walletClient) {
        this.provider = new BrowserProvider(walletClient);
        this.signer = await this.provider.getSigner();
      } else {
        this.provider = new JsonRpcProvider(MANTLE_SEPOLIA.rpcUrl);
      }

      if (this.signer) {
        this.tippingContract = new Contract(TIPPING_CONTRACT_ADDRESS, MegaVibeTippingABI.abi, this.signer);
        this.bountyContract = new Contract(BOUNTY_CONTRACT_ADDRESS, MegaVibeBountiesABI.abi, this.signer);
      }
      
      const readOnlyProvider = new JsonRpcProvider(MANTLE_SEPOLIA.rpcUrl);
      this.bountyContractReadOnly = new Contract(BOUNTY_CONTRACT_ADDRESS, MegaVibeBountiesABI.abi, readOnlyProvider);

      return true;
    } catch (error) {
      console.error('Failed to initialize contract service:', error);
      return false;
    }
  }

  private getBountyContract(readOnly = false): Contract {
    if (readOnly) {
      if (!this.bountyContractReadOnly) throw new Error('Read-only Bounty Contract not initialized.');
      return this.bountyContractReadOnly;
    }
    if (!this.bountyContract) throw new Error('Bounty Contract not initialized. Is the wallet connected?');
    return this.bountyContract;
  }

  private getTippingContract(): Contract {
    if (!this.tippingContract) throw new Error('Tipping Contract not initialized. Is the wallet connected?');
    return this.tippingContract;
  }

  async getActiveBountiesForEvent(eventId: string): Promise<any[]> {
    try {
      const contract = this.getBountyContract(true);
      const data = await contract.getActiveBountiesForEvent(eventId);
      return data;
    } catch (error) {
      console.error(`Error fetching bounties for event ${eventId}:`, error);
      return [];
    }
  }

  onBountyCreated(callback: (...args: any[]) => void): () => void {
    const contract = this.getBountyContract(true);
    const eventName = 'BountyCreated';
    contract.on(eventName, callback);
    return () => {
      contract.off(eventName, callback);
    };
  }

  onBountyClaimed(callback: (...args: any[]) => void): () => void {
    const contract = this.getBountyContract(true);
    const eventName = 'BountyClaimed';
    contract.on(eventName, callback);
    return () => {
      contract.off(eventName, callback);
    };
  }

  onTipConfirmed(callback: (...args: any[]) => void): () => void {
    const contract = new Contract(TIPPING_CONTRACT_ADDRESS, MegaVibeTippingABI.abi, this.provider!);
    const eventName = 'TipConfirmed';
    contract.on(eventName, callback);
    return () => {
      contract.off(eventName, callback);
    };
  }

  async sendTip(
    recipientAddress: string, 
    amount: string, 
    message: string = '',
    eventId: string = 'current-event',
    speakerId: string = 'current-speaker'
  ): Promise<string> {
    if (!isAddress(recipientAddress)) throw new Error('Invalid recipient address');
    if (parseFloat(amount) <= 0) throw new Error('Invalid amount');
    
    const contract = this.getTippingContract();
    const tx = await contract.tipSpeaker(
      recipientAddress, 
      message, 
      eventId, 
      speakerId,
      { value: parseEther(amount) }
    );
    await tx.wait();
    return tx.hash;
  }

  async createBounty(
    eventId: string,
    speakerId: string,
    description: string, 
    amount: string, 
    deadline: number
  ): Promise<string> {
    if (parseFloat(amount) <= 0) throw new Error('Invalid amount');

    const contract = this.getBountyContract();
    const tx = await contract.createBounty(
      eventId, 
      speakerId, 
      description, 
      deadline,
      { value: parseEther(amount) }
    );
    await tx.wait();
    return tx.hash;
  }

  async claimBounty(bountyId: number, submissionHash: string): Promise<string> {
    const contract = this.getBountyContract();
    const tx = await contract.claimBounty(bountyId, submissionHash);
    await tx.wait();
    return tx.hash;
  }
}

export default new ContractService();
