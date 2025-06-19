import React from 'react';
import './MarketplaceHeader.css';

interface BountyStats {
  totalBounties: number;
  totalReward: number;
  activeBounties: number;
  claimedBounties: number;
}

interface MarketplaceHeaderProps {
  stats: BountyStats;
}

export const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({ stats }) => {
  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount}`;
  };

  const completionRate = stats.totalBounties > 0
    ? Math.round((stats.claimedBounties / stats.totalBounties) * 100)
    : 0;

  return (
    <div className="marketplace-header">
      <div className="header-stats">
        <div className="stat-card primary">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <span className="stat-value">{stats.activeBounties}</span>
            <span className="stat-label">Active Bounties</span>
          </div>
          <div className="stat-trend positive">
            <span className="trend-icon">↗</span>
            <span className="trend-text">+12% this week</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <span className="stat-value">{formatCurrency(stats.totalReward)}</span>
            <span className="stat-label">Total Rewards</span>
          </div>
          <div className="stat-trend positive">
            <span className="trend-icon">↗</span>
            <span className="trend-text">+25% this month</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <span className="stat-value">{completionRate}%</span>
            <span className="stat-label">Completion Rate</span>
          </div>
          <div className="stat-trend positive">
            <span className="trend-icon">↗</span>
            <span className="trend-text">Industry leading</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <span className="stat-value">36h</span>
            <span className="stat-label">Avg Delivery</span>
          </div>
          <div className="stat-trend positive">
            <span className="trend-icon">↗</span>
            <span className="trend-text">Under 48h target</span>
          </div>
        </div>
      </div>

      <div className="marketplace-activity">
        <div className="activity-indicator">
          <span className="activity-dot pulsing"></span>
          <span className="activity-text">
            <strong>Live Activity:</strong> {stats.activeBounties} bounties available,
            {Math.floor(Math.random() * 15) + 5} speakers online
          </span>
        </div>

        <div className="market-health">
          <div className="health-indicator">
            <span className="health-icon">💚</span>
            <span className="health-text">Market Health: Excellent</span>
          </div>
          <div className="health-metrics">
            <span className="metric">Fast delivery</span>
            <span className="metric-separator">•</span>
            <span className="metric">High quality</span>
            <span className="metric-separator">•</span>
            <span className="metric">Fair pricing</span>
          </div>
        </div>
      </div>

      <div className="trending-categories">
        <h4>🔥 Trending Categories</h4>
        <div className="category-tags">
          <span className="category-tag hot">
            <span className="tag-icon">🧠</span>
            <span className="tag-text">ZK-Proofs</span>
            <span className="tag-count">12</span>
          </span>
          <span className="category-tag">
            <span className="tag-icon">🏦</span>
            <span className="tag-text">DeFi</span>
            <span className="tag-count">8</span>
          </span>
          <span className="category-tag">
            <span className="tag-icon">🔒</span>
            <span className="tag-text">Security</span>
            <span className="tag-count">6</span>
          </span>
          <span className="category-tag">
            <span className="tag-icon">🌐</span>
            <span className="tag-text">Web3</span>
            <span className="tag-count">15</span>
          </span>
          <span className="category-tag">
            <span className="tag-icon">⚡</span>
            <span className="tag-text">Layer 2</span>
            <span className="tag-count">4</span>
          </span>
        </div>
      </div>

      <div className="recent-highlights">
        <div className="highlight-item">
          <span className="highlight-icon">🏆</span>
          <span className="highlight-text">
            <strong>$500 bounty</strong> completed in 24h for "Advanced Smart Contract Audit Guide"
          </span>
          <span className="highlight-time">2h ago</span>
        </div>
        <div className="highlight-item">
          <span className="highlight-icon">💡</span>
          <span className="highlight-text">
            <strong>New speaker</strong> Vitalik B. joined with expertise in Ethereum scaling
          </span>
          <span className="highlight-time">4h ago</span>
        </div>
        <div className="highlight-item">
          <span className="highlight-icon">🎯</span>
          <span className="highlight-text">
            <strong>High-value bounty</strong> $750 posted for "Comprehensive DeFi Strategy Guide"
          </span>
          <span className="highlight-time">6h ago</span>
        </div>
      </div>
    </div>
  );
};
