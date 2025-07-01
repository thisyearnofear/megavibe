import { ethers, Contract, JsonRpcProvider, BrowserProvider, formatEther, parseEther, parseUnits, isAddress } from 'ethers';
import MegaVibeTippingABI from '../contracts/MegaVibeTipping.json';
import MegaVibeBountiesABI from '../contracts/MegaVibeBounties.json';

// Standard ERC20 ABI for USDC
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

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
// USDC on Mantle Sepolia (for hackathon demo - replace with actual USDC address)
const USDC_CONTRACT_ADDRESS = import.meta.env.VITE_USDC_CONTRACT_ADDRESS || "0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9";

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
  private usdcContract: Contract | null = null;
  private usdcContractReadOnly: Contract | null = null;

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
        this.usdcContract = new Contract(USDC_CONTRACT_ADDRESS, ERC20_ABI, this.signer);
      }
      
      const readOnlyProvider = new JsonRpcProvider(MANTLE_SEPOLIA.rpcUrl);
      this.bountyContractReadOnly = new Contract(BOUNTY_CONTRACT_ADDRESS, MegaVibeBountiesABI.abi, readOnlyProvider);
      this.usdcContractReadOnly = new Contract(USDC_CONTRACT_ADDRESS, ERC20_ABI, readOnlyProvider);

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

  private getUsdcContract(): Contract {
    if (!this.usdcContract) throw new Error('USDC Contract not initialized. Is the wallet connected?');
    return this.usdcContract;
  }

  // Helper to convert USD amount to USDC units (6 decimals)
  private usdToUsdc(usdAmount: string): bigint {
    return parseUnits(usdAmount, 6); // USDC has 6 decimals
  }

  // Helper to convert USDC units to USD
  private usdcToUsd(usdcAmount: bigint): string {
    return ethers.formatUnits(usdcAmount, 6);
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
    const bountyContract = this.getBountyContract();
    const usdcContract = this.getUsdcContract();
    const usdcAmount = this.usdToUsdc(amount);

    // First approve USDC spending
    const approveTx = await usdcContract.approve(BOUNTY_CONTRACT_ADDRESS, usdcAmount);
    await approveTx.wait();

    // Then create the bounty
    const tx = await bountyContract.createBounty(usdcAmount, eventId, speakerId, description, deadline);
    await tx.wait();
    return tx.hash;
  }

  async submitForBounty(bountyId: number, submissionHash: string): Promise<string> {
    const bountyContract = this.getBountyContract();
    const usdcContract = this.getUsdcContract();
    const stakeAmount = await bountyContract.submissionStakeAmount();

    // First approve USDC spending for stake
    const approveTx = await usdcContract.approve(BOUNTY_CONTRACT_ADDRESS, stakeAmount);
    await approveTx.wait();

    // Then submit for bounty
    const tx = await bountyContract.submitForBounty(bountyId, submissionHash);
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

  async tipSpeaker(recipient: string, usdAmount: string, message: string, eventId: string, speakerId: string): Promise<string> {
    if (!isAddress(recipient)) throw new Error('Invalid recipient address');
    const tippingContract = this.getTippingContract();
    const usdcContract = this.getUsdcContract();
    const usdcAmount = this.usdToUsdc(usdAmount);

    // First approve USDC spending
    const approveTx = await usdcContract.approve(TIPPING_CONTRACT_ADDRESS, usdcAmount);
    await approveTx.wait();

    // Then send the tip
    const tx = await tippingContract.tipSpeaker(recipient, usdcAmount, message, eventId, speakerId);
    await tx.wait();
    return tx.hash;
  }

  // Get USDC balance for connected wallet
  async getUsdcBalance(): Promise<string> {
    if (!this.signer) throw new Error('Wallet not connected');
    const userAddress = await this.signer.getAddress();
    const contract = this.usdcContractReadOnly || this.usdcContract;
    if (!contract) throw new Error('USDC contract not initialized');
    
    const balance = await contract.balanceOf(userAddress);
    return this.usdcToUsd(balance);
  }

  // Check USDC allowance
  async getUsdcAllowance(spenderAddress: string): Promise<string> {
    if (!this.signer) throw new Error('Wallet not connected');
    const userAddress = await this.signer.getAddress();
    const contract = this.usdcContractReadOnly || this.usdcContract;
    if (!contract) throw new Error('USDC contract not initialized');
    
    const allowance = await contract.allowance(userAddress, spenderAddress);
    return this.usdcToUsd(allowance);
  }
}

export default new ContractService();
