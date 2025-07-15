// Analytics component exports - Clean, organized barrel exports
export { default as AnalyticsDashboard } from './AnalyticsDashboard';
export { 
  MetricCard, 
  ChartContainer, 
  TimeRangeSelector 
} from './AnalyticsComponents';

// Re-export hooks
export { useAnalytics, useRealTimeAnalytics } from '../../hooks/useAnalytics';

// Analytics utility functions
export const analyticsUtils = {
  formatMetricValue: (value: number, format: 'currency' | 'number' | 'percentage' | 'duration') => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        }).format(value);
      
      case 'percentage':
        return `${(value * 100).toFixed(1)}%`;
      
      case 'duration':
        const hours = Math.floor(value / 3600);
        const minutes = Math.floor((value % 3600) / 60);
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      
      default:
        return new Intl.NumberFormat('en-US').format(value);
    }
  },
  
  calculateGrowthRate: (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  },
  
  getTrendDirection: (data: number[]) => {
    if (data.length < 2) return 'neutral';
    const recent = data.slice(-3);
    const avg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const earlier = data.slice(-6, -3);
    const earlierAvg = earlier.reduce((sum, val) => sum + val, 0) / earlier.length;
    
    if (avg > earlierAvg * 1.05) return 'up';
    if (avg < earlierAvg * 0.95) return 'down';
    return 'neutral';
  }
};