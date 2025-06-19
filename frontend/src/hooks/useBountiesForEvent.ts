import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { io, Socket } from 'socket.io-client';

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

      const response = await api.get(`/api/bounties/event/${eventId}`);
      const { bounties: eventBounties, stats: bountyStats } = response.data;

      setBounties(eventBounties || []);
      setStats(bountyStats || {
        totalBounties: 0,
        totalReward: 0,
        activeBounties: 0,
        claimedBounties: 0
      });

    } catch (err) {
      console.error('Failed to load bounties:', err);
      setError('Failed to load bounties');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  // Refresh bounties manually
  const refreshBounties = useCallback(async () => {
    await loadBounties();
  }, [loadBounties]);

  // Create new bounty
  const createBounty = useCallback(async (bountyData: any) => {
    try {
      const response = await api.post('/api/bounties/create', {
        ...bountyData,
        eventId
      });

      // Refresh bounties list
      await loadBounties();

      return response.data;
    } catch (err) {
      console.error('Failed to create bounty:', err);
      throw err;
    }
  }, [eventId, loadBounties]);

  // Setup WebSocket connection for real-time updates
  useEffect(() => {
    if (!eventId) return;

    // Connect to WebSocket
    const socketConnection = io(process.env.VITE_API_URL || 'http://localhost:3000', {
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
