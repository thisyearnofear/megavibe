import { ethers, Contract, JsonRpcProvider, BrowserProvider, formatEther, parseEther, isAddress } from 'ethers';
import MegaVibeTippingABI from '../contracts/MegaVibeTipping.json';
import MegaVibeBountiesABI from '../contracts/MegaVibeBounties.json';

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
const BOUNTY_CONTRACT_ADDRESS = "0x59854F1DCc03E6d65E9C4e148D5635Fb56d3d892";

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
    const contract = this.getBountyContract(true);
    return contract.getActiveBountiesForEvent(eventId);
  }

  async getBounty(bountyId: number): Promise<any> {
    const contract = this.getBountyContract(true);
    return contract.getBounty(bountyId);
  }

  async getSubmissionsForBounty(bountyId: number): Promise<any[]> {
    const contract = this.getBountyContract(true);
    return contract.getSubmissionsForBounty(bountyId);
  }

  async createBounty(eventId: string, speakerId: string, description: string, amount: string, deadline: number): Promise<string> {
    const contract = this.getBountyContract();
    const tx = await contract.createBounty(eventId, speakerId, description, deadline, { value: parseEther(amount) });
    await tx.wait();
    return tx.hash;
  }

  async submitForBounty(bountyId: number, submissionHash: string): Promise<string> {
    const contract = this.getBountyContract();
    const stakeAmount = await contract.submissionStakeAmount();
    const tx = await contract.submitForBounty(bountyId, submissionHash, { value: stakeAmount });
    await tx.wait();
    return tx.hash;
  }

  async approveSubmission(bountyId: number, submissionId: number): Promise<string> {
    const contract = this.getBountyContract();
    const tx = await contract.approveSubmission(bountyId, submissionId);
    await tx.wait();
    return tx.hash;
  }

  async rejectSubmission(bountyId: number, submissionId: number): Promise<string> {
    const contract = this.getBountyContract();
    const tx = await contract.rejectSubmission(bountyId, submissionId);
    await tx.wait();
    return tx.hash;
  }

  async tipSpeaker(recipient: string, message: string, eventId: string, speakerId: string, amount: string): Promise<string> {
    if (!isAddress(recipient)) throw new Error('Invalid recipient address');
    const contract = this.getTippingContract();
    const tx = await contract.tipSpeaker(recipient, message, eventId, speakerId, { value: parseEther(amount) });
    await tx.wait();
    return tx.hash;
  }
}

export default new ContractService();
