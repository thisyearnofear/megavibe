import React, { useState, useEffect } from 'react';
import { useWallet } from '../../contexts/WalletContext';
import { PageLayout } from '../Layout/PageLayout';
import { CrossChainReputationDashboard } from './CrossChainReputationDashboard';
import './ReputationDashboard.css';

interface ReputationStats {
  totalScore: number;
  level: string;
  rank: number;
  totalUsers: number;
  badges: string[];
  recentActivity: Array<{
    type: string;
    description: string;
    points: number;
    timestamp: Date;
  }>;
}

export const ReputationDashboard: React.FC = () => {
  const { address, isConnected } = useWallet();
  const [stats, setStats] = useState<ReputationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isConnected && address) {
      loadReputationStats();
    } else {
      setIsLoading(false);
    }
  }, [isConnected, address]);

  const loadReputationStats = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would fetch from your API
      // For demo purposes, we'll use mock data
      const mockStats: ReputationStats = {
        totalScore: 1250,
        level: 'Rising Star',
        rank: 42,
        totalUsers: 1337,
        badges: ['Early Adopter', 'Cross-Chain Explorer', 'Generous Tipper'],
        recentActivity: [
          {
            type: 'tip',
            description: 'Tipped 10 USDC to speaker at DevCon',
            points: 100,
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
          },
          {
            type: 'cross-chain',
            description: 'Cross-chain tip from Ethereum to Arbitrum',
            points: 50,
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000)
          },
          {
            type: 'attendance',
            description: 'Attended Web3 Summit 2024',
            points: 200,
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        ]
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to load reputation stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <PageLayout
        title="Reputation Dashboard"
        subtitle="Track your onchain reputation and achievements"
      >
        <div className="reputation-connect-prompt">
          <div className="connect-card">
            <h2>🏆 Track Your Reputation</h2>
            <p>Connect your wallet to view your onchain reputation, badges, and achievements.</p>
            <div className="reputation-benefits">
              <div className="benefit-item">
                <span className="benefit-icon">📊</span>
                <span>Track reputation across multiple chains</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🎖️</span>
                <span>Earn badges for event participation</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🎁</span>
                <span>Unlock exclusive perks and opportunities</span>
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (isLoading) {
    return (
      <PageLayout
        title="Reputation Dashboard"
        subtitle="Track your onchain reputation and achievements"
      >
        <div className="reputation-loading">
          <div className="loading-spinner"></div>
          <p>Loading your reputation data...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Reputation Dashboard"
      subtitle="Track your onchain reputation and achievements"
    >
      <div className="reputation-dashboard">
        {stats && (
          <>
            {/* Overview Cards */}
            <div className="reputation-overview">
              <div className="stat-card primary">
                <div className="stat-icon">🏆</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.totalScore.toLocaleString()}</div>
                  <div className="stat-label">Reputation Score</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">⭐</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.level}</div>
                  <div className="stat-label">Current Level</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📈</div>
                <div className="stat-content">
                  <div className="stat-value">#{stats.rank}</div>
                  <div className="stat-label">Global Rank</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <div className="stat-value">{stats.totalUsers.toLocaleString()}</div>
                  <div className="stat-label">Total Users</div>
                </div>
              </div>
            </div>

            {/* Badges Section */}
            <div className="reputation-section">
              <h3>🎖️ Your Badges</h3>
              <div className="badges-grid">
                {stats.badges.map((badge, index) => (
                  <div key={index} className="badge-card">
                    <div className="badge-icon">🏅</div>
                    <div className="badge-name">{badge}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="reputation-section">
              <h3>📊 Recent Activity</h3>
              <div className="activity-list">
                {stats.recentActivity.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">
                      {activity.type === 'tip' && '💰'}
                      {activity.type === 'cross-chain' && '🌉'}
                      {activity.type === 'attendance' && '🎭'}
                    </div>
                    <div className="activity-content">
                      <div className="activity-description">{activity.description}</div>
                      <div className="activity-time">
                        {activity.timestamp.toLocaleDateString()} at {activity.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="activity-points">+{activity.points}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cross-Chain Reputation */}
            <div className="reputation-section">
              <CrossChainReputationDashboard userAddress={address!} />
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
};
