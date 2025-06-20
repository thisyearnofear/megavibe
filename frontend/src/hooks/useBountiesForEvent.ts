import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { io, Socket } from 'socket.io-client';
import { MOCK_ACTIVE_BOUNTIES } from '../services/mockDataService';
import contractService from '../services/contractService';
import { useWallet } from '../contexts/WalletContext';

interface Bounty {
  id: string;
  contractBountyId: number;
  sponsor: {
    username: string;
    avatar?: string;
  };
  speaker: {
    username: string;
    avatar?: string;
  };
  description: string;
  rewardAmount: number;
  deadline: string;
  status: 'active' | 'claimed' | 'expired' | 'cancelled';
  claimant?: {
    username: string;
    avatar?: string;
  };
  submissionHash?: string;
  createdAt: string;
  timeRemaining: number;
}

interface BountyStats {
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
  refreshBounties: () => Promise<void>;
  createBounty: (bountyData: any) => Promise<void>;
}

export const useBountiesForEvent = (eventId: string): UseBountiesForEventReturn => {
  const { isWalletReady, isConnected, isCorrectNetwork } = useWallet();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [stats, setStats] = useState<BountyStats>({
    totalBounties: 0,
    totalReward: 0,
    activeBounties: 0,
    claimedBounties: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Load bounties for event
  const loadBounties = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      let eventBounties = [];
      let bountyStats = {
        totalBounties: 0,
        totalReward: 0,
        activeBounties: 0,
        claimedBounties: 0
      };

      // Check if user is connected to the correct network
      if (isConnected && isCorrectNetwork && isWalletReady()) {
        try {
          // Use real contract data when wallet is connected
          console.log('Loading bounties from contract for event:', eventId);
          const contractBounties = await contractService.getBountiesForEvent(eventId);

          // Transform contract data to match expected interface
          eventBounties = contractBounties.map((bounty, index) => ({
            id: `contract-${index}`,
            contractBountyId: index,
            sponsor: {
              username: bounty.creator.slice(0, 8) + '...',
              avatar: '/api/placeholder/40/40'
            },
            speaker: {
              username: 'Speaker',
              avatar: '/api/placeholder/40/40'
            },
            description: bounty.description,
            rewardAmount: parseFloat(bounty.amount),
            deadline: new Date(bounty.deadline * 1000).toISOString(),
            status: bounty.status === 'open' ? 'active' as const :
                   bounty.status === 'claimed' ? 'claimed' as const : 'expired' as const,
            claimant: bounty.claimer ? {
              username: bounty.claimer.slice(0, 8) + '...',
              avatar: '/api/placeholder/40/40'
            } : undefined,
            submissionHash: bounty.contentUrl,
            createdAt: new Date().toISOString(),
            timeRemaining: Math.max(0, bounty.deadline * 1000 - Date.now())
          }));

          bountyStats = {
            totalBounties: contractBounties.length,
            totalReward: contractBounties.reduce((sum, b) => sum + parseFloat(b.amount), 0),
            activeBounties: contractBounties.filter(b => b.status === 'open').length,
            claimedBounties: contractBounties.filter(b => b.status === 'claimed').length
          };

          console.log('Loaded bounties from contract:', eventBounties.length);
        } catch (contractError) {
          console.warn('Contract call failed, falling back to API:', contractError);
          // Fallback to API if contract fails
          try {
            const response = await api.get(`/api/bounties/event/${eventId}`);
            eventBounties = response.data.bounties || [];
            bountyStats = response.data.stats || bountyStats;
          } catch (apiError) {
            console.warn('API also failed, using mock data:', apiError);
            throw apiError; // This will trigger the mock data fallback below
          }
        }
      } else {
        // User not connected or on wrong network - try API first, then fallback to mock
        console.log('Wallet not connected or wrong network, trying API then mock data');
        try {
          const response = await api.get(`/api/bounties/event/${eventId}`);
          eventBounties = response.data.bounties || [];
          bountyStats = response.data.stats || bountyStats;
        } catch (apiError) {
          console.warn('API failed, using mock data for demo:', apiError);
          // Fallback to mock data for demo/landing
          eventBounties = MOCK_ACTIVE_BOUNTIES.map(mockBounty => ({
            ...mockBounty,
            rewardAmount: mockBounty.reward,
            timeRemaining: Math.max(0, new Date(mockBounty.deadline).getTime() - Date.now())
          }));
          bountyStats = {
            totalBounties: MOCK_ACTIVE_BOUNTIES.length,
            totalReward: MOCK_ACTIVE_BOUNTIES.reduce((sum, b) => sum + (b.reward || 0), 0),
            activeBounties: MOCK_ACTIVE_BOUNTIES.filter(b => b.status === 'active').length,
            claimedBounties: MOCK_ACTIVE_BOUNTIES.filter(b => b.status === 'claimed').length
          };
        }
      }

      setBounties(eventBounties);
      setStats(bountyStats);
    } catch (err) {
      console.error('Failed to load bounties:', err);
      setError('Failed to load bounties');
    } finally {
      setIsLoading(false);
    }
  }, [eventId, isConnected, isCorrectNetwork, isWalletReady]);

  // Refresh bounties manually
  const refreshBounties = useCallback(async () => {
    await loadBounties();
  }, [loadBounties]);

  // Create new bounty
  const createBounty = useCallback(async (bountyData: any) => {
    try {
      // If wallet is connected and on correct network, use contract
      if (isConnected && isCorrectNetwork && isWalletReady()) {
        console.log('Creating bounty via contract:', bountyData);
        const txHash = await contractService.createBounty(
          eventId,
          bountyData.speakerId || 'default-speaker',
          bountyData.description,
          bountyData.amount.toString(),
          Math.floor(Date.now() / 1000) + (bountyData.durationDays * 24 * 60 * 60)
        );

        // Refresh bounties list after successful transaction
        setTimeout(() => {
          loadBounties();
        }, 2000); // Give some time for the transaction to be mined

        return { txHash, success: true };
      } else {
        // Fallback to API for non-connected users
        const response = await api.post('/api/bounties/create', {
          ...bountyData,
          eventId
        });

        // Refresh bounties list
        await loadBounties();

        return response.data;
      }
    } catch (err) {
      console.error('Failed to create bounty:', err);
      throw err;
    }
  }, [eventId, loadBounties, isConnected, isCorrectNetwork, isWalletReady]);

  // Setup WebSocket connection for real-time updates
  useEffect(() => {
    if (!eventId) return;

    // Connect to WebSocket
    const socketConnection = io(process.env.VITE_API_URL || 'https://megavibe.onrender.com', {
      transports: ['websocket', 'polling']
    });

    socketConnection.on('connect', () => {
      console.log('Connected to bounty feed');
      socketConnection.emit('joinEvent', eventId);
    });

    // Listen for new bounties
    socketConnection.on('bountyCreated', (bountyData: any) => {
      if (bountyData.eventId === eventId) {
        setBounties(prev => [bountyData, ...prev]);

        // Update stats
        setStats(prev => ({
          ...prev,
          totalBounties: prev.totalBounties + 1,
          totalReward: prev.totalReward + bountyData.rewardAmount,
          activeBounties: prev.activeBounties + 1
        }));
      }
    });

    // Listen for bounty claims
    socketConnection.on('bountyClaimed', (claimData: any) => {
      setBounties(prev => prev.map(bounty =>
        bounty.id === claimData.bountyId
          ? {
              ...bounty,
              status: 'claimed' as const,
              claimant: { username: claimData.claimant },
              submissionHash: claimData.submissionHash
            }
          : bounty
      ));

      // Update stats
      setStats(prev => ({
        ...prev,
        activeBounties: Math.max(0, prev.activeBounties - 1),
        claimedBounties: prev.claimedBounties + 1
      }));
    });

    socketConnection.on('disconnect', () => {
      console.log('Disconnected from bounty feed');
    });

    socketConnection.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Real-time connection failed');
    });

    setSocket(socketConnection);

    // Load initial data
    loadBounties();

    // Cleanup on unmount
    return () => {
      socketConnection.disconnect();
    };
  }, [eventId, loadBounties]);

  // Update time remaining for active bounties
  useEffect(() => {
    const interval = setInterval(() => {
      setBounties(prev => prev.map(bounty => {
        if (bounty.status === 'active') {
          const timeRemaining = new Date(bounty.deadline).getTime() - Date.now();
          return {
            ...bounty,
            timeRemaining: Math.max(0, timeRemaining),
            status: timeRemaining <= 0 ? 'expired' as const : bounty.status
          };
        }
        return bounty;
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    bounties,
    stats,
    isLoading,
    error,
    refreshBounties,
    createBounty
  };
};
