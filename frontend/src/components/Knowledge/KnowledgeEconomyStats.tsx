import React, { useState, useEffect } from 'react';
import { useEvent } from '../../contexts/EventContext';
import { useLiveTipFeed } from '../../hooks/useLiveTipFeed';
import { useBountiesForEvent } from '../../hooks/useBountiesForEvent';
import './KnowledgeEconomyStats.css';

interface StatCardProps {
  icon: string;
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  description: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, change, changeType, description }) => (
  <div className="stat-card">
    <div className="stat-header">
      <span className="stat-icon">{icon}</span>
      <div className="stat-info">
        <h4 className="stat-title">{title}</h4>
        <p className="stat-value">{value}</p>
      </div>
    </div>
    <div className="stat-footer">
      <span className={`stat-change ${changeType}`}>{change}</span>
      <p className="stat-description">{description}</p>
    </div>
  </div>
);

export const KnowledgeEconomyStats: React.FC = () => {
  const [liveStats, setLiveStats] = useState({
    totalValue: 127845,
    activeSpeakers: 47,
    dailyTips: 1247,
    completedBounties: 89,
    contentPieces: 156,
    avgEarningsPerTalk: 2840
  });

  const { currentEvent } = useEvent();
  const { stats: tipStats } = useLiveTipFeed(currentEvent?.id || '');
  const { stats: bountyStats } = useBountiesForEvent(currentEvent?.id || '');

  // Simulate real-time stats updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        ...prev,
        totalValue: prev.totalValue + Math.floor(Math.random() * 100) + 25,
        dailyTips: prev.dailyTips + (Math.random() > 0.8 ? 1 : 0),
        completedBounties: prev.completedBounties + (Math.random() > 0.95 ? 1 : 0)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount}`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="knowledge-economy-stats">
      <div className="stats-header">
        <h3>📊 Knowledge Economy Metrics</h3>
        <div className="live-indicator">
          <span className="pulse-dot"></span>
          <span>Live Data</span>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          icon="💰"
          title="Total Platform Value"
          value={formatCurrency(liveStats.totalValue)}
          change="+12.4%"
          changeType="positive"
          description="24h growth"
        />

        <StatCard
          icon="🎯"
          title="Active Speakers"
          value={liveStats.activeSpeakers.toString()}
          change="+3"
          changeType="positive"
          description="This week"
        />

        <StatCard
          icon="⚡"
          title="Daily Tips"
          value={formatNumber(liveStats.dailyTips)}
          change="+18.2%"
          changeType="positive"
          description="vs yesterday"
        />

        <StatCard
          icon="🏆"
          title="Bounties Completed"
          value={liveStats.completedBounties.toString()}
          change="+7"
          changeType="positive"
          description="This month"
        />
      </div>

      {/* Flywheel Efficiency Metrics */}
      <div className="efficiency-metrics">
        <h4>🔄 Flywheel Performance</h4>
        <div className="metrics-row">
          <div className="metric-item">
            <span className="metric-label">Tip → Bounty Rate</span>
            <div className="metric-bar">
              <div className="metric-fill" style={{ width: '73%' }}></div>
            </div>
            <span className="metric-value">73%</span>
          </div>

          <div className="metric-item">
            <span className="metric-label">Content Completion</span>
            <div className="metric-bar">
              <div className="metric-fill" style={{ width: '95%' }}></div>
            </div>
            <span className="metric-value">95%</span>
          </div>

          <div className="metric-item">
            <span className="metric-label">Revenue Multiplier</span>
            <div className="metric-bar">
              <div className="metric-fill" style={{ width: '84%' }}></div>
            </div>
            <span className="metric-value">3.4x</span>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="top-performers">
        <h4>🌟 Top Knowledge Workers Today</h4>
        <div className="performers-list">
          <div className="performer-item">
            <div className="performer-avatar">🧠</div>
            <div className="performer-info">
              <span className="performer-name">Vitalik B.</span>
              <span className="performer-earnings">$2,847</span>
            </div>
            <div className="performer-stats">
              <span className="tips-count">23 tips</span>
            </div>
          </div>

          <div className="performer-item">
            <div className="performer-avatar">🚀</div>
            <div className="performer-info">
              <span className="performer-name">Andrew C.</span>
              <span className="performer-earnings">$1,956</span>
            </div>
            <div className="performer-stats">
              <span className="tips-count">18 tips</span>
            </div>
          </div>

          <div className="performer-item">
            <div className="performer-avatar">💡</div>
            <div className="performer-info">
              <span className="performer-name">Balaji S.</span>
              <span className="performer-earnings">$1,634</span>
            </div>
            <div className="performer-stats">
              <span className="tips-count">15 tips</span>
            </div>
          </div>
        </div>
      </div>

      {/* Market Insights */}
      <div className="market-insights">
        <h4>📈 Market Insights</h4>
        <div className="insights-grid">
          <div className="insight-item">
            <span className="insight-metric">{formatCurrency(liveStats.avgEarningsPerTalk)}</span>
            <span className="insight-label">Avg per Talk</span>
          </div>
          <div className="insight-item">
            <span className="insight-metric">24-48h</span>
            <span className="insight-label">Bounty Delivery</span>
          </div>
          <div className="insight-item">
            <span className="insight-metric">$25-500</span>
            <span className="insight-label">Bounty Range</span>
          </div>
        </div>
      </div>
    </div>
  );
};
