import { ethers, Contract, JsonRpcProvider, BrowserProvider, formatEther, parseEther, parseUnits, isAddress } from 'ethers';
import MegaVibeTippingABI from '../contracts/MegaVibeTipping.json';
import MegaVibeBountiesABI from '../contracts/MegaVibeBounties.json';
import { USDCService, USDC_ABI } from './usdcService';

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
  private currentChainId: number = 5003; // Default to Mantle Sepolia

  async initialize(walletClient?: any, chainId?: number): Promise<boolean> {
    try {
      if (chainId) {
        this.currentChainId = chainId;
      }

      if (walletClient) {
        this.provider = new BrowserProvider(walletClient);
        this.signer = await this.provider.getSigner();
        
        // Get the actual chain ID from the provider
        const network = await this.provider.getNetwork();
        this.currentChainId = Number(network.chainId);
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

  private getUsdcContract(): Contract {
    if (!this.signer) throw new Error('Wallet not connected');
    return USDCService.getUSDCContract(this.currentChainId, this.signer);
  }

  private getUsdcContractReadOnly(): Contract {
    if (!this.provider) throw new Error('Provider not initialized');
    return USDCService.getUSDCContract(this.currentChainId, this.provider);
  }

  // Helper to convert USD amount to USDC units (6 decimals)
  private usdToUsdc(usdAmount: string): bigint {
    return USDCService.parseUSDC(usdAmount);
  }

  // Helper to convert USDC units to USD
  private usdcToUsd(usdcAmount: bigint): string {
    return USDCService.formatUSDC(usdcAmount);
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
    
    // Check if USDC is supported on current chain
    if (!USDCService.isUSDCSupported(this.currentChainId)) {
      throw new Error(`USDC not supported on chain ${this.currentChainId}`);
    }

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
    if (!USDCService.isUSDCSupported(this.currentChainId)) {
      return '0';
    }
    
    const userAddress = await this.signer.getAddress();
    return await USDCService.getBalance(this.currentChainId, userAddress, this.provider!);
  }

  // Check USDC allowance
  async getUsdcAllowance(spenderAddress: string): Promise<string> {
    if (!this.signer) throw new Error('Wallet not connected');
    if (!USDCService.isUSDCSupported(this.currentChainId)) {
      return '0';
    }
    
    const userAddress = await this.signer.getAddress();
    return await USDCService.getAllowance(this.currentChainId, userAddress, spenderAddress, this.provider!);
  }

  // Get current chain ID
  getCurrentChainId(): number {
    return this.currentChainId;
  }

  // Check if current chain supports USDC
  isUSDCSupported(): boolean {
    return USDCService.isUSDCSupported(this.currentChainId);
  }
}

export default new ContractService();
