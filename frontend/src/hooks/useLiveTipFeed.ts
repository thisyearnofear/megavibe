import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import realtimeService, { TipReceivedEvent } from '../services/realtimeService';

// The Tip interface should match the TipReceivedEvent for consistency
export type Tip = TipReceivedEvent;

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
  isConnected: boolean;
  refreshFeed: () => Promise<void>;
}

export const useLiveTipFeed = (eventId: string): UseLiveTipFeedReturn => {
  const [tips, setTips] = useState<Tip[]>([]);
  const [stats, setStats] = useState<TipFeedStats>({
    totalAmount: 0,
    tipCount: 0,
    activeTippers: 0,
    tipsPerMinute: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(realtimeService.isConnected());

  // Load initial tip feed via REST API
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
        tipsPerMinute: 0,
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

  // Setup WebSocket connection and listeners
  useEffect(() => {
    if (!eventId) return;

    // Use the centralized realtime service
    realtimeService.connect();
    realtimeService.joinEvent(eventId);

    const handleNewTip = (tipData: TipReceivedEvent) => {
      // Ensure the tip is for the current event, though the backend room should handle this
      if (tipData.eventId === eventId) {
        setTips(prev => [tipData, ...prev.slice(0, 49)]); // Keep last 50 tips

        // Update stats based on the new tip
        setStats(prev => ({
          ...prev,
          totalAmount: prev.totalAmount + tipData.amount,
          tipCount: prev.tipCount + 1,
        }));
      }
    };

    const handleConnect = () => {
      console.log('LiveTipFeed: Realtime service connected.');
      setIsConnected(true);
      setError(null); // Clear previous connection errors
      // Re-join event room on successful reconnect
      realtimeService.joinEvent(eventId);
    };

    const handleDisconnect = () => {
      console.warn('LiveTipFeed: Realtime service disconnected.');
      setIsConnected(false);
      setError('Real-time connection lost. Attempting to reconnect...');
    };

    const handleConnectError = (errorMessage: string) => {
      console.error('LiveTipFeed: Realtime connection error:', errorMessage);
      setIsConnected(false);
      setError('Real-time connection failed');
    };

    // Subscribe to events
    const unsubscribeTipConfirmed = realtimeService.onTipConfirmed(handleNewTip);
    const unsubscribeConnect = realtimeService.on('connect', handleConnect);
    const unsubscribeDisconnect = realtimeService.on('disconnect', handleDisconnect);
    const unsubscribeConnectError = realtimeService.on('connect_error', handleConnectError);

    // Load initial data
    loadTipFeed();

    // Cleanup on component unmount or when eventId changes
    return () => {
      console.log(`Cleaning up live tip feed for event ${eventId}`);
      unsubscribeTipConfirmed();
      unsubscribeConnect();
      unsubscribeDisconnect();
      unsubscribeConnectError();
      // The service itself is not disconnected, just the listeners are removed.
      // The service can be disconnected globally if needed elsewhere.
    };
  }, [eventId, loadTipFeed]);

  // Calculate tips per minute locally
  useEffect(() => {
    const interval = setInterval(() => {
      const oneMinuteAgo = Date.now() - 60000;
      const recentTips = tips.filter(tip =>
        new Date(tip.timestamp).getTime() > oneMinuteAgo
      );

      setStats(prev => ({
        ...prev,
        tipsPerMinute: recentTips.length,
      }));
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [tips]);

  return {
    tips,
    stats,
    isLoading,
    error,
    isConnected,
    refreshFeed,
  };
};
