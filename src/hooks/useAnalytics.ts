import { useState, useEffect, useCallback, useMemo } from 'react';

interface AnalyticsParams {
  userType: 'performer' | 'audience' | 'venue';
  userId?: string;
  venueId?: string;
  timeRange: '1h' | '24h' | '7d' | '30d';
}

interface AnalyticsData {
  earnings?: {
    total: number;
    timeline: Array<{ timestamp: Date; value: number }>;
    change: number;
  };
  tips?: {
    count: number;
    timeline: Array<{ timestamp: Date; count: number }>;
    change: number;
  };
  requests?: {
    count: number;
    timeline: Array<{ timestamp: Date; count: number }>;
    change: number;
  };
  audience?: {
    average: number;
    peak: number;
    timeline: Array<{ timestamp: Date; count: number }>;
  };
  performance?: {
    duration: number;
    breakdown: Record<string, number>;
    trends: Array<{ date: string; value: number }>;
  };
  engagement?: {
    rate: number;
    timeline: Array<{ timestamp: Date; rate: number }>;
    peak: number;
  };
  trends?: {
    '1h': Array<{ label: string; value: number }>;
    '24h': Array<{ label: string; value: number }>;
    '7d': Array<{ label: string; value: number }>;
    '30d': Array<{ label: string; value: number }>;
    direction: 'up' | 'down' | 'neutral';
  };
}

interface UseAnalyticsReturn {
  data: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Custom hook for analytics data (Clean, reusable, performant)
export function useAnalytics(params: AnalyticsParams): UseAnalyticsReturn {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Call the analytics API
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status}`);
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, [params.userType, params.userId, params.venueId, params.timeRange]);

  // Fetch data when parameters change
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Memoize the return value for performance
  return useMemo(() => ({
    data,
    loading,
    error,
    refetch: fetchAnalytics
  }), [data, loading, error, fetchAnalytics]);
}

// Utility functions (Clean, reusable)
function getTimeRangeMs(timeRange: string): number {
  switch (timeRange) {
    case '1h': return 60 * 60 * 1000;
    case '24h': return 24 * 60 * 60 * 1000;
    case '7d': return 7 * 24 * 60 * 60 * 1000;
    case '30d': return 30 * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
}

function getBaseValue(type: string, timeRange: string): number {
  const multipliers = {
    '1h': 1,
    '24h': 24,
    '7d': 168,
    '30d': 720
  };

  const baseValues = {
    earnings: 10,
    tips: 3,
    requests: 2,
    spent: 15,
    revenue: 100,
    performers: 5
  };

  return (baseValues[type as keyof typeof baseValues] || 10) * (multipliers[timeRange as keyof typeof multipliers] || 1);
}

function generateTimeline(startTime: Date, endTime: Date, valueGenerator: () => number, type: 'value' | 'count' | 'rate' = 'value') {
  const timeline = [];
  const duration = endTime.getTime() - startTime.getTime();
  const points = Math.min(50, Math.max(10, Math.floor(duration / (60 * 60 * 1000)))); // Max 50 points

  for (let i = 0; i < points; i++) {
    const timestamp = new Date(startTime.getTime() + (duration * i) / (points - 1));
    const dataPoint: any = { timestamp };

    if (type === 'value') {
      dataPoint.value = valueGenerator();
    } else if (type === 'count') {
      dataPoint.count = valueGenerator();
    } else if (type === 'rate') {
      dataPoint.rate = valueGenerator();
    }

    timeline.push(dataPoint);
  }

  return timeline;
}

function generateTrends(timeRange: string) {
  const points = timeRange === '1h' ? 12 : timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;
  const trends = [];

  for (let i = 0; i < points; i++) {
    trends.push({
      date: `Point ${i + 1}`,
      value: Math.random() * 100 + 20
    });
  }

  return trends;
}

function generateAllTrends() {
  return {
    '1h': Array.from({ length: 12 }, (_, i) => ({
      label: `${i * 5}min`,
      value: Math.random() * 50 + 10
    })),
    '24h': Array.from({ length: 24 }, (_, i) => ({
      label: `${i}h`,
      value: Math.random() * 100 + 20
    })),
    '7d': Array.from({ length: 7 }, (_, i) => ({
      label: `Day ${i + 1}`,
      value: Math.random() * 200 + 50
    })),
    '30d': Array.from({ length: 30 }, (_, i) => ({
      label: `Day ${i + 1}`,
      value: Math.random() * 500 + 100
    })),
    direction: (['up', 'down', 'neutral'] as const)[Math.floor(Math.random() * 3)]
  };
}

// Real-time analytics hook for live updates
export function useRealTimeAnalytics(params: AnalyticsParams) {
  const [liveData, setLiveData] = useState<Partial<AnalyticsData>>({});

  useEffect(() => {
    if (params.userType !== 'performer') return;

    // Simulate real-time updates for performers
    const interval = setInterval(() => {
      setLiveData(prev => ({
        ...prev,
        earnings: prev.earnings ? {
          ...prev.earnings,
          total: (prev.earnings.total || 0) + Math.random() * 10
        } : undefined,
        tips: prev.tips ? {
          ...prev.tips,
          count: (prev.tips.count || 0) + (Math.random() > 0.8 ? 1 : 0)
        } : undefined
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [params.userType]);

  return liveData;
}