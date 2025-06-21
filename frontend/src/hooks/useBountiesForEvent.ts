import { useState, useEffect, useCallback, useRef } from 'react';
import { formatEther } from 'ethers';
import contractService, { Bounty } from '../services/contractService';
import { useWallet } from '../contexts/WalletContext';

const POLLING_INTERVAL = 30000; // 30 seconds

export interface BountyStats {
  totalBounties: number;
  totalReward: number;
  activeBounties: number;
  claimedBounties: number;
}

interface UseBountiesForEventReturn {
  bounties: Bounty[];
  stats: BountyStats;
  isLoading: boolean;
  error: string | null;
  refreshBounties: () => void;
}

const transformContractBounty = (bountyData: any, id: number): Bounty => {
  const rewardInEth = parseFloat(formatEther(bountyData.reward));
  const deadline = Number(bountyData.deadline) * 1000;
  const status: 'active' | 'claimed' | 'expired' = bountyData.claimed ? 'claimed' : (deadline < Date.now() ? 'expired' : 'active');

  return {
    id: id.toString(),
    creator: bountyData.sponsor,
    title: '',
    description: bountyData.description,
    amount: rewardInEth.toString(),
    deadline: deadline,
    status: status,
    claimer: bountyData.claimant !== '0x0000000000000000000000000000000000000000' ? bountyData.claimant : undefined,
    contentUrl: bountyData.submissionHash,
  };
};

export const useBountiesForEvent = (eventId: string): UseBountiesForEventReturn => {
  const { isWalletReady, isConnected, isCorrectNetwork, primaryWallet } = useWallet();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [stats, setStats] = useState<BountyStats>({ totalBounties: 0, totalReward: 0, activeBounties: 0, claimedBounties: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBounties = useCallback(async (isInitialLoad = false) => {
    if (!eventId || !primaryWallet) return;
    if (isInitialLoad) setIsLoading(true);
    setError(null);

    try {
      const walletClient = await primaryWallet.getWalletClient();
      const initialized = await contractService.initialize(walletClient);
      if (!initialized) {
        throw new Error("Contract service could not be initialized.");
      }
      
      const contractBounties = await contractService.getActiveBountiesForEvent(eventId);
      console.log(`Fetched ${contractBounties.length} bounties from contract.`);
      const transformedBounties = contractBounties.map(transformContractBounty);
      setBounties(transformedBounties);

    } catch (err: any) {
      console.error('Failed to load on-chain bounties:', err);
      setError('Could not load bounties from the smart contract.');
      setBounties([]);
    } finally {
      if (isInitialLoad) setIsLoading(false);
    }
  }, [eventId, primaryWallet]);

  // Use a ref to hold the callback to avoid re-triggering the polling useEffect.
  const loadBountiesRef = useRef(loadBounties);
  useEffect(() => {
    loadBountiesRef.current = loadBounties;
  }, [loadBounties]);

  useEffect(() => {
    if (isWalletReady() && isConnected && isCorrectNetwork) {
      loadBountiesRef.current(true); // Initial load

      const intervalId = setInterval(() => {
        console.log('Polling for new bounties...');
        loadBountiesRef.current();
      }, POLLING_INTERVAL);

      return () => clearInterval(intervalId);
    } else {
      setIsLoading(false);
      setError("Please connect your wallet to the Mantle Sepolia network to view bounties.");
      setBounties([]);
    }
  }, [isWalletReady, isConnected, isCorrectNetwork]);

  useEffect(() => {
    const active = bounties.filter(b => b.status === 'active');
    const claimed = bounties.filter(b => b.status === 'claimed');
    const totalReward = bounties.reduce((sum, b) => sum + parseFloat(b.amount), 0);
    setStats({ totalBounties: bounties.length, totalReward, activeBounties: active.length, claimedBounties: claimed.length });
  }, [bounties]);

  const refreshBounties = useCallback(() => {
    if (isWalletReady()) {
      loadBountiesRef.current(true);
    }
  }, [isWalletReady]);

  return {
    bounties,
    stats,
    isLoading,
    error,
    refreshBounties,
  };
};
