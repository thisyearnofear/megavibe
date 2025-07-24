import { ethers } from 'ethers';
import { CONTRACTS, CONTRACT_ADDRESSES } from '@/contracts/addresses';
import { BLOCKCHAIN_CONFIG } from '@/contracts/config';
import { getNetworkConfig } from '@/contracts/networkConfig';

// Import ABIs
import MegaVibeTippingABI from '@/contracts/abis/MegaVibeTipping.json';
import MegaVibeBountiesABI from '@/contracts/abis/MegaVibeBounties.json';
// TODO: Generate SimpleReputation ABI
// import SimpleReputationABI from '@/contracts/abis/SimpleReputation.json';

export class ContractService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private chainId: number | null = null;

  async initialize() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      const network = await this.provider.getNetwork();
      this.chainId = Number(network.chainId);
    }
  }

  async switchNetwork(targetChainId: number): Promise<boolean> {
    if (!window.ethereum) return false;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
      
      // Update internal state
      await this.initialize();
      return true;
    } catch (error: unknown) {
      // If network doesn't exist, add it
      if (typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === 4902) {
        return await this.addNetwork(targetChainId);
      }
      console.error('Failed to switch network:', error);
      return false;
    }
  }

  async addNetwork(chainId: number): Promise<boolean> {
    if (!window.ethereum) return false;

    const networkConfig = getNetworkConfig(chainId);
    if (!networkConfig) return false;

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${chainId.toString(16)}`,
          chainName: networkConfig.displayName,
          nativeCurrency: networkConfig.nativeCurrency,
          rpcUrls: [networkConfig.rpcUrl],
          blockExplorerUrls: [networkConfig.blockExplorer],
        }],
      });
      
      await this.initialize();
      return true;
    } catch (error) {
      console.error('Failed to add network:', error);
      return false;
    }
  }

  getContractAddress(contractName: keyof typeof CONTRACTS, chainId?: number): string {
    const targetChainId = chainId || this.chainId || BLOCKCHAIN_CONFIG.defaultChainId;
    
    // Try to get from network-specific addresses first
    const networkAddresses = CONTRACT_ADDRESSES[targetChainId];
    if (networkAddresses && networkAddresses[contractName]) {
      return networkAddresses[contractName]!;
    }
    
    // Fallback to default addresses
    return CONTRACTS[contractName];
  }

  getTippingContract(chainId?: number): ethers.Contract | null {
    if (!this.signer) return null;
    
    const address = this.getContractAddress('MegaVibeTipping', chainId);
    if (!address) return null;
    
    return new ethers.Contract(address, MegaVibeTippingABI.abi, this.signer);
  }

  getBountiesContract(chainId?: number): ethers.Contract | null {
    if (!this.signer) return null;
    
    const address = this.getContractAddress('MegaVibeBounties', chainId);
    if (!address) return null;
    
    return new ethers.Contract(address, MegaVibeBountiesABI.abi, this.signer);
  }

  // TODO: Uncomment when SimpleReputation ABI is available
  // getReputationContract(chainId?: number): ethers.Contract | null {
  //   if (!this.signer) return null;
  //
  //   const address = this.getContractAddress('SimpleReputation', chainId);
  //   if (!address) return null;
  //
  //   return new ethers.Contract(address, SimpleReputationABI, this.signer);
  // }

  async validateContractDeployment(contractName: keyof typeof CONTRACTS, chainId?: number): Promise<{
    deployed: boolean;
    address: string;
    error?: string;
  }> {
    try {
      const address = this.getContractAddress(contractName, chainId);
      
      if (!address) {
        return {
          deployed: false,
          address: '',
          error: 'No contract address configured'
        };
      }

      if (!this.provider) {
        await this.initialize();
      }

      if (!this.provider) {
        return {
          deployed: false,
          address,
          error: 'No provider available'
        };
      }

      // Check if contract exists at address
      const code = await this.provider.getCode(address);
      const deployed = code !== '0x';

      return {
        deployed,
        address,
        error: deployed ? undefined : 'No contract code at address'
      };
    } catch (error) {
      return {
        deployed: false,
        address: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async validateAllContracts(chainId?: number): Promise<Record<string, {
    deployed: boolean;
    address: string;
    error?: string;
  }>> {
    const results: Record<string, unknown> = {};
    
    for (const contractName of Object.keys(CONTRACTS) as Array<keyof typeof CONTRACTS>) {
      results[contractName] = await this.validateContractDeployment(contractName, chainId);
    }
    
    return results;
  }

  getCurrentChainId(): number | null {
    return this.chainId;
  }

  isNetworkSupported(chainId?: number): boolean {
    const targetChainId = chainId || this.chainId;
    return targetChainId ? BLOCKCHAIN_CONFIG.supportedChains.includes(targetChainId) : false;
  }

  getNetworkName(chainId?: number): string {
    const targetChainId = chainId || this.chainId || BLOCKCHAIN_CONFIG.defaultChainId;
    const config = getNetworkConfig(targetChainId);
    return config?.displayName || `Unknown Network (${targetChainId})`;
  }

  async getNetworkStatus(): Promise<{
    connected: boolean;
    chainId: number | null;
    networkName: string;
    supported: boolean;
    contractsDeployed: boolean;
    rpcWorking: boolean;
  }> {
    try {
      if (!this.provider) {
        await this.initialize();
      }

      const chainId = this.chainId;
      const supported = chainId ? this.isNetworkSupported(chainId) : false;
      const networkName = chainId ? this.getNetworkName(chainId) : 'Unknown';

      // Test RPC connection
      let rpcWorking = false;
      try {
        if (this.provider) {
          await this.provider.getBlockNumber();
          rpcWorking = true;
        }
      } catch (error) {
        console.error('RPC connection failed:', error);
      }

      // Check contract deployments
      const contractValidations = chainId ? await this.validateAllContracts(chainId) : {};
      const contractsDeployed = Object.values(contractValidations).every(v => v.deployed);

      return {
        connected: !!this.provider && !!this.signer,
        chainId,
        networkName,
        supported,
        contractsDeployed,
        rpcWorking
      };
    } catch (error) {
      console.error('Failed to get network status:', error);
      return {
        connected: false,
        chainId: null,
        networkName: 'Unknown',
        supported: false,
        contractsDeployed: false,
        rpcWorking: false
      };
    }
  }
}

export const contractService = new ContractService();