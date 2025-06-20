import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { io, Socket } from 'socket.io-client';

interface Tip {
  id: string;
  tipper: {
    username: string;
    avatar?: string;
  };
  recipient: {
    username: string;
    avatar?: string;
  };
  amount: number;
  message?: string;
  timestamp: string;
  txHash?: string;
}

interface TipFeedStats {
  totalAmount: number;
  tipCount: number;
  activeTippers: number;
  tipsPerMinute: number;
}

interface UseLiveTipFeedReturn {
  tips: Tip[];
  stats: TipFeedStats;
  isLoading: boolean;
  error: string | null;
  refreshFeed: () => Promise<void>;
}

export const useLiveTipFeed = (eventId: string): UseLiveTipFeedReturn => {
  const [tips, setTips] = useState<Tip[]>([]);
  const [stats, setStats] = useState<TipFeedStats>({
    totalAmount: 0,
    tipCount: 0,
    activeTippers: 0,
    tipsPerMinute: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Load initial tip feed
  const loadTipFeed = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.get(`/api/tips/event/${eventId}/live`);
      const { tips: initialTips, stats: initialStats } = response.data;

      setTips(initialTips || []);
      setStats(initialStats || {
        totalAmount: 0,
        tipCount: 0,
        activeTippers: 0,
        tipsPerMinute: 0
      });

    } catch (err) {
      console.error('Failed to load tip feed:', err);
      setError('Failed to load live tip feed');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  // Refresh feed manually
  const refreshFeed = useCallback(async () => {
    await loadTipFeed();
  }, [loadTipFeed]);

  // Setup WebSocket connection for real-time updates
  useEffect(() => {
    if (!eventId) return;

    // Connect to WebSocket
    const socketConnection = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling']
    });

    socketConnection.on('connect', () => {
      console.log('Connected to live tip feed');
      socketConnection.emit('joinEvent', eventId);
    });

    // Listen for new tips
    socketConnection.on('tipConfirmed', (tipData: any) => {
      if (tipData.eventId === eventId) {
        setTips(prev => [tipData, ...prev.slice(0, 19)]); // Keep last 20 tips
        
        // Update stats
        setStats(prev => ({
          ...prev,
          totalAmount: prev.totalAmount + tipData.amount,
          tipCount: prev.tipCount + 1,
          activeTippers: prev.activeTippers + (prev.activeTippers < 50 ? 1 : 0) // Cap for demo
        }));
      }
    });

    // Listen for tip acknowledgments
    socketConnection.on('tipAcknowledged', (ackData: any) => {
      if (ackData.eventId === eventId) {
        setTips(prev => prev.map(tip => 
          tip.id === ackData.tipId 
            ? { ...tip, acknowledged: true, response: ackData.response }
            : tip
        ));
      }
    });

    socketConnection.on('disconnect', () => {
      console.log('Disconnected from live tip feed');
    });

    socketConnection.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Real-time connection failed');
    });

    setSocket(socketConnection);

    // Load initial data
    loadTipFeed();

    // Cleanup on unmount
    return () => {
      socketConnection.disconnect();
    };
  }, [eventId, loadTipFeed]);

  // Calculate tips per minute
  useEffect(() => {
    const interval = setInterval(() => {
      const oneMinuteAgo = new Date(Date.now() - 60000);
      const recentTips = tips.filter(tip => 
        new Date(tip.timestamp) > oneMinuteAgo
      );
      
      setStats(prev => ({
        ...prev,
        tipsPerMinute: recentTips.length
      }));
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [tips]);

  return {
    tips,
    stats,
    isLoading,
    error,
    refreshFeed
  };
};
