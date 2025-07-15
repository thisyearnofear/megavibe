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
      // In production, this would be a real API call
      // For now, we'll simulate with realistic data
      const mockData = await simulateAnalyticsAPI(params);
      setData(mockData);
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

// Simulated API function (would be replaced with real API calls)
async function simulateAnalyticsAPI(params: AnalyticsParams): Promise<AnalyticsData> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const now = new Date();
  const timeRangeMs = getTimeRangeMs(params.timeRange);
  const startTime = new Date(now.getTime() - timeRangeMs);

  // Generate realistic mock data based on user type and time range
  switch (params.userType) {
    case 'performer':
      return generatePerformerAnalytics(startTime, now, params.timeRange);
    case 'audience':
      return generateAudienceAnalytics(startTime, now, params.timeRange);
    case 'venue':
      return generateVenueAnalytics(startTime, now, params.timeRange);
    default:
      throw new Error('Invalid user type');
  }
}

// Clean data generation functions (DRY principle)
function generatePerformerAnalytics(startTime: Date, endTime: Date, timeRange: string): AnalyticsData {
  const baseEarnings = getBaseValue('earnings', timeRange);
  const baseTips = getBaseValue('tips', timeRange);
  const baseRequests = getBaseValue('requests', timeRange);

  return {
    earnings: {
      total: baseEarnings,
      timeline: generateTimeline(startTime, endTime, () => Math.random() * 50 + 10, 'value'),
      change: (Math.random() - 0.5) * 40 // -20% to +20%
    },
    tips: {
      count: baseTips,
      timeline: generateTimeline(startTime, endTime, () => Math.floor(Math.random() * 5), 'count'),
      change: (Math.random() - 0.5) * 30
    },
    requests: {
      count: baseRequests,
      timeline: generateTimeline(startTime, endTime, () => Math.floor(Math.random() * 3), 'count'),
      change: (Math.random() - 0.5) * 25
    },
    audience: {
      average: Math.floor(Math.random() * 20) + 5,
      peak: Math.floor(Math.random() * 50) + 20,
      timeline: generateTimeline(startTime, endTime, () => Math.floor(Math.random() * 30) + 5, 'count')
    },
    performance: {
      duration: Math.floor(Math.random() * 7200) + 1800, // 30min to 2.5h
      breakdown: {
        'Tips': baseTips * 0.6,
        'Requests': baseRequests * 0.3,
        'Other': baseTips * 0.1
      },
      trends: generateTrends(timeRange)
    },
    engagement: {
      rate: Math.random() * 0.4 + 0.6, // 60-100%
      timeline: generateTimeline(startTime, endTime, () => Math.random() * 0.4 + 0.6, 'rate'),
      peak: Math.random() * 0.2 + 0.8 // 80-100%
    },
    trends: generateAllTrends()
  };
}

function generateAudienceAnalytics(startTime: Date, endTime: Date, timeRange: string): AnalyticsData {
  const baseSpent = getBaseValue('spent', timeRange);
  const baseTips = getBaseValue('tips', timeRange) * 0.3; // Audience sends fewer tips

  return {
    earnings: {
      total: baseSpent,
      timeline: generateTimeline(startTime, endTime, () => Math.random() * 20 + 5, 'value'),
      change: (Math.random() - 0.5) * 30
    },
    tips: {
      count: baseTips,
      timeline: generateTimeline(startTime, endTime, () => Math.floor(Math.random() * 2), 'count'),
      change: (Math.random() - 0.5) * 25
    },
    requests: {
      count: Math.floor(baseTips * 0.4),
      timeline: generateTimeline(startTime, endTime, () => Math.floor(Math.random() * 1.5), 'count'),
      change: (Math.random() - 0.5) * 20
    },
    engagement: {
      rate: Math.random() * 0.3 + 0.4, // 40-70%
      timeline: generateTimeline(startTime, endTime, () => Math.random() * 0.3 + 0.4, 'rate'),
      peak: Math.random() * 0.2 + 0.6
    },
    trends: generateAllTrends()
  };
}

function generateVenueAnalytics(startTime: Date, endTime: Date, timeRange: string): AnalyticsData {
  const baseRevenue = getBaseValue('revenue', timeRange);
  const basePerformers = getBaseValue('performers', timeRange);

  return {
    earnings: {
      total: baseRevenue,
      timeline: generateTimeline(startTime, endTime, () => Math.random() * 200 + 50, 'value'),
      change: (Math.random() - 0.5) * 35
    },
    performance: {
      duration: 0, // Not applicable for venues
      breakdown: {
        'Tips': baseRevenue * 0.4,
        'Requests': baseRevenue * 0.3,
        'Venue Fee': baseRevenue * 0.2,
        'Other': baseRevenue * 0.1
      },
      trends: generateTrends(timeRange)
    },
    audience: {
      average: Math.floor(Math.random() * 100) + 50,
      peak: Math.floor(Math.random() * 200) + 100,
      timeline: generateTimeline(startTime, endTime, () => Math.floor(Math.random() * 150) + 25, 'count')
    },
    trends: generateAllTrends()
  };
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