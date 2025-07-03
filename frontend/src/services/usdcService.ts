// Multi-chain USDC Service for MegaVibe
import { ethers } from 'ethers';

// USDC contract addresses by chain ID
export const USDC_ADDRESSES: Record<number, string> = {
  // Mainnets
  1: '0xA0b86a33E6441b8a4B5b8c6b6c7b8c9c8c8c8c8c', // Ethereum (placeholder)
  42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum
  10: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', // Optimism
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base
  59144: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff', // Linea
  
  // Testnets
  11155111: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Sepolia
  421614: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', // Arbitrum Sepolia
  11155420: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7', // OP Sepolia
  84532: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia
  59141: '0xFEce4462D57bD51A6A552365A011b95f0E16d9B7', // Linea Sepolia
  5003: '0x4ea6ccef1215d9479f1024dff70fc055ca538215d2c8c348beddffd54583d0e8', // Mantle Sepolia
  324: '0xAe045DE5638162fa134807Cb558E15A3F5A7F853', // ZKsync Era Testnet
};

// Chain information for display
export const CHAIN_INFO: Record<number, { name: string; symbol: string; testnet: boolean }> = {
  1: { name: 'Ethereum', symbol: 'ETH', testnet: false },
  42161: { name: 'Arbitrum', symbol: 'ETH', testnet: false },
  10: { name: 'Optimism', symbol: 'ETH', testnet: false },
  8453: { name: 'Base', symbol: 'ETH', testnet: false },
  59144: { name: 'Linea', symbol: 'ETH', testnet: false },
  11155111: { name: 'Sepolia', symbol: 'ETH', testnet: true },
  421614: { name: 'Arbitrum Sepolia', symbol: 'ETH', testnet: true },
  11155420: { name: 'OP Sepolia', symbol: 'ETH', testnet: true },
  84532: { name: 'Base Sepolia', symbol: 'ETH', testnet: true },
  59141: { name: 'Linea Sepolia', symbol: 'ETH', testnet: true },
  5003: { name: 'Mantle Sepolia', symbol: 'MNT', testnet: true },
  324: { name: 'ZKsync Era Testnet', symbol: 'ETH', testnet: true },
};

// Standard ERC20 ABI for USDC operations
export const USDC_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

export class USDCService {
  /**
   * Get USDC contract address for a specific chain
   */
  static getUSDCAddress(chainId: number): string {
    const address = USDC_ADDRESSES[chainId];
    if (!address) {
      throw new Error(`USDC not supported on chain ${chainId}`);
    }
    return address;
  }

  /**
   * Check if USDC is supported on a chain
   */
  static isUSDCSupported(chainId: number): boolean {
    return chainId in USDC_ADDRESSES;
  }

  /**
   * Get chain information
   */
  static getChainInfo(chainId: number) {
    return CHAIN_INFO[chainId] || { name: `Chain ${chainId}`, symbol: 'ETH', testnet: false };
  }

  /**
   * Get all supported chains for USDC
   */
  static getSupportedChains(): number[] {
    return Object.keys(USDC_ADDRESSES).map(Number);
  }

  /**
   * Get testnet chains only
   */
  static getTestnetChains(): number[] {
    return Object.entries(CHAIN_INFO)
      .filter(([_, info]) => info.testnet)
      .map(([chainId]) => Number(chainId));
  }

  /**
   * Get mainnet chains only
   */
  static getMainnetChains(): number[] {
    return Object.entries(CHAIN_INFO)
      .filter(([_, info]) => !info.testnet)
      .map(([chainId]) => Number(chainId));
  }

  /**
   * Format USDC amount (6 decimals)
   */
  static formatUSDC(amount: bigint): string {
    return ethers.formatUnits(amount, 6);
  }

  /**
   * Parse USDC amount (6 decimals)
   */
  static parseUSDC(amount: string): bigint {
    return ethers.parseUnits(amount, 6);
  }

  /**
   * Get USDC contract instance
   */
  static getUSDCContract(chainId: number, signerOrProvider: ethers.Signer | ethers.Provider): ethers.Contract {
    const address = this.getUSDCAddress(chainId);
    return new ethers.Contract(address, USDC_ABI, signerOrProvider);
  }

  /**
   * Get USDC balance for an address
   */
  static async getBalance(
    chainId: number, 
    userAddress: string, 
    provider: ethers.Provider
  ): Promise<string> {
    const contract = this.getUSDCContract(chainId, provider);
    const balance = await contract.balanceOf(userAddress);
    return this.formatUSDC(balance);
  }

  /**
   * Get USDC allowance
   */
  static async getAllowance(
    chainId: number,
    ownerAddress: string,
    spenderAddress: string,
    provider: ethers.Provider
  ): Promise<string> {
    const contract = this.getUSDCContract(chainId, provider);
    const allowance = await contract.allowance(ownerAddress, spenderAddress);
    return this.formatUSDC(allowance);
  }

  /**
   * Approve USDC spending
   */
  static async approve(
    chainId: number,
    spenderAddress: string,
    amount: string,
    signer: ethers.Signer
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getUSDCContract(chainId, signer);
    const usdcAmount = this.parseUSDC(amount);
    return await contract.approve(spenderAddress, usdcAmount);
  }

  /**
   * Transfer USDC
   */
  static async transfer(
    chainId: number,
    toAddress: string,
    amount: string,
    signer: ethers.Signer
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = this.getUSDCContract(chainId, signer);
    const usdcAmount = this.parseUSDC(amount);
    return await contract.transfer(toAddress, usdcAmount);
  }
}

export default USDCService;