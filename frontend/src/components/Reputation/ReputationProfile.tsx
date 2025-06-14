import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import '../../styles/ReputationProfile.css';

interface ReputationCategory {
  score: number;
  level: string;
  badges: string[];
}

interface PresenceNFT {
  tokenId: string;
  contractAddress: string;
  eventName: string;
  venueName: string;
  attendanceDate: string;
  verificationMethod: string;
  metadata: {
    duration: number;
    interactions: number;
    socialShares: number;
  };
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  unlockedAt: string;
  rarity: string;
  nftTokenId?: string;
}

interface UserReputation {
  userId: string;
  walletAddress: string;
  overallScore: number;
  reputationLevel: string;
  percentile: number;
  categories: {
    curator: ReputationCategory;
    supporter: ReputationCategory;
    attendee: ReputationCategory;
    influencer: ReputationCategory;
  };
  presenceNFTs: PresenceNFT[];
  achievements: Achievement[];
  crossEventMetrics: {
    uniqueVenues: number;
    uniqueEvents: number;
    totalAttendance: number;
    averageEngagement: number;
  };
  marketplaceAccess: {
    tier: string;
    earlyAccess: boolean;
    specialPerks: string[];
  };
}

interface ReputationProfileProps {
  userId: string;
  isOwnProfile?: boolean;
  compact?: boolean;
  onClose?: () => void;
}

export const ReputationProfile: React.FC<ReputationProfileProps> = ({
  userId,
  isOwnProfile = false,
  compact = false,
  onClose,
}) => {
  const [reputation, setReputation] = useState<UserReputation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'nfts' | 'achievements' | 'analytics'>('overview');

  useEffect(() => {
    loadReputation();
  }, [userId]);

  const loadReputation = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/reputation/user/${userId}`);
      setReputation(response.data.reputation);
    } catch (err) {
      console.error('Error loading reputation:', err);
      setError('Failed to load reputation data');
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string): string => {
    switch (level) {
      case 'Legend': return '#FFD700';
      case 'Master': return '#C0C0C0';
      case 'Expert': return '#CD7F32';
      case 'Apprentice': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'Legendary': return '#FF6B35';
      case 'Epic': return '#9B59B6';
      case 'Rare': return '#3498DB';
      default: return '#95A5A6';
    }
  };

  const getTierColor = (tier: string): string => {
    switch (tier) {
      case 'Diamond': return '#B9F2FF';
      case 'Platinum': return '#E5E4E2';
      case 'Gold': return '#FFD700';
      case 'Silver': return '#C0C0C0';
      default: return '#CD7F32';
    }
  };

  if (loading) {
    return (
      <div className={`reputation-profile ${compact ? 'compact' : ''}`}>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading reputation...</p>
        </div>
      </div>
    );
  }

  if (error || !reputation) {
    return (
      <div className={`reputation-profile ${compact ? 'compact' : ''}`}>
        <div className="error-state">
          <h3>Unable to load reputation</h3>
          <p>{error}</p>
          <button onClick={loadReputation} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="reputation-profile compact">
        <div className="compact-header">
          <div className="reputation-badge">
            <div 
              className="level-indicator"
              style={{ backgroundColor: getLevelColor(reputation.reputationLevel) }}
            >
              {reputation.reputationLevel}
            </div>
            <div className="score-display">{reputation.overallScore}</div>
          </div>
          <div className="tier-badge" style={{ color: getTierColor(reputation.marketplaceAccess.tier) }}>
            {reputation.marketplaceAccess.tier}
          </div>
        </div>
        <div className="compact-stats">
          <span>{reputation.crossEventMetrics.uniqueVenues} venues</span>
          <span>{reputation.achievements.length} achievements</span>
          <span>{reputation.presenceNFTs.length} NFTs</span>
        </div>
      </div>
    );
  }

  return (
    <div className="reputation-profile">
      <div className="profile-header">
        <div className="header-content">
          <h2>🏆 Reputation Profile</h2>
          {onClose && (
            <button className="close-button" onClick={onClose}>
              ×
            </button>
          )}
        </div>

        <div className="reputation-overview">
          <div className="main-score">
            <div className="score-circle">
              <div className="score-value">{reputation.overallScore}</div>
              <div className="score-max">/1000</div>
            </div>
            <div className="level-info">
              <div 
                className="level-badge"
                style={{ backgroundColor: getLevelColor(reputation.reputationLevel) }}
              >
                {reputation.reputationLevel}
              </div>
              <div className="percentile">Top {100 - reputation.percentile}%</div>
            </div>
          </div>

          <div className="tier-display">
            <div 
              className="tier-badge large"
              style={{ 
                backgroundColor: getTierColor(reputation.marketplaceAccess.tier),
                color: reputation.marketplaceAccess.tier === 'Gold' || reputation.marketplaceAccess.tier === 'Diamond' ? '#000' : '#fff'
              }}
            >
              {reputation.marketplaceAccess.tier} Tier
            </div>
            {reputation.marketplaceAccess.earlyAccess && (
              <div className="early-access-badge">⚡ Early Access</div>
            )}
          </div>
        </div>

        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`tab-button ${activeTab === 'nfts' ? 'active' : ''}`}
            onClick={() => setActiveTab('nfts')}
          >
            NFTs ({reputation.presenceNFTs.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            Achievements ({reputation.achievements.length})
          </button>
          {isOwnProfile && (
            <button
              className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              Analytics
            </button>
          )}
        </div>
      </div>

      <div className="profile-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="categories-grid">
              {Object.entries(reputation.categories).map(([key, category]) => (
                <div key={key} className="category-card">
                  <div className="category-header">
                    <h4>{key.charAt(0).toUpperCase() + key.slice(1)}</h4>
                    <div 
                      className="category-level"
                      style={{ backgroundColor: getLevelColor(category.level) }}
                    >
                      {category.level}
                    </div>
                  </div>
                  <div className="category-score">
                    <div className="score-bar">
                      <div 
                        className="score-fill"
                        style={{ width: `${category.score}%` }}
                      ></div>
                    </div>
                    <span className="score-text">{category.score}/100</span>
                  </div>
                  {category.badges.length > 0 && (
                    <div className="category-badges">
                      {category.badges.slice(0, 3).map((badge, index) => (
                        <span key={index} className="badge">{badge}</span>
                      ))}
                      {category.badges.length > 3 && (
                        <span className="badge-more">+{category.badges.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="cross-event-metrics">
              <h3>Cross-Event Activity</h3>
              <div className="metrics-grid">
                <div className="metric-item">
                  <div className="metric-value">{reputation.crossEventMetrics.uniqueVenues}</div>
                  <div className="metric-label">Unique Venues</div>
                </div>
                <div className="metric-item">
                  <div className="metric-value">{reputation.crossEventMetrics.uniqueEvents}</div>
                  <div className="metric-label">Events Attended</div>
                </div>
                <div className="metric-item">
                  <div className="metric-value">{reputation.crossEventMetrics.totalAttendance}</div>
                  <div className="metric-label">Total Attendance</div>
                </div>
                <div className="metric-item">
                  <div className="metric-value">{reputation.crossEventMetrics.averageEngagement.toFixed(1)}</div>
                  <div className="metric-label">Avg Engagement</div>
                </div>
              </div>
            </div>

            <div className="marketplace-perks">
              <h3>Marketplace Benefits</h3>
              <div className="perks-list">
                {reputation.marketplaceAccess.specialPerks.map((perk, index) => (
                  <div key={index} className="perk-item">
                    <span className="perk-icon">✨</span>
                    <span className="perk-text">{perk}</span>
                  </div>
                ))}
                {reputation.marketplaceAccess.specialPerks.length === 0 && (
                  <div className="no-perks">
                    <p>Increase your reputation to unlock special perks!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'nfts' && (
          <div className="nfts-tab">
            <div className="nfts-grid">
              {reputation.presenceNFTs.map((nft, index) => (
                <div key={index} className="nft-card">
                  <div className="nft-header">
                    <h4>{nft.eventName}</h4>
                    <div className="verification-badge">
                      {nft.verificationMethod}
                    </div>
                  </div>
                  <div className="nft-details">
                    <p className="venue-name">📍 {nft.venueName}</p>
                    <p className="attendance-date">
                      📅 {new Date(nft.attendanceDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="nft-metadata">
                    <div className="metadata-item">
                      <span className="metadata-label">Duration:</span>
                      <span className="metadata-value">{nft.metadata.duration}min</span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-label">Interactions:</span>
                      <span className="metadata-value">{nft.metadata.interactions}</span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-label">Shares:</span>
                      <span className="metadata-value">{nft.metadata.socialShares}</span>
                    </div>
                  </div>
                  <div className="nft-footer">
                    <span className="token-id">#{nft.tokenId}</span>
                    <button className="view-nft-button">View on Chain</button>
                  </div>
                </div>
              ))}
            </div>
            {reputation.presenceNFTs.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🎫</div>
                <h3>No Presence NFTs Yet</h3>
                <p>Attend events to earn proof-of-presence NFT badges!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="achievements-tab">
            <div className="achievements-grid">
              {reputation.achievements.map((achievement, index) => (
                <div 
                  key={index} 
                  className={`achievement-card ${achievement.rarity.toLowerCase()}`}
                >
                  <div className="achievement-header">
                    <h4>{achievement.name}</h4>
                    <div 
                      className="rarity-badge"
                      style={{ backgroundColor: getRarityColor(achievement.rarity) }}
                    >
                      {achievement.rarity}
                    </div>
                  </div>
                  <p className="achievement-description">{achievement.description}</p>
                  <div className="achievement-footer">
                    <span className="category-tag">{achievement.category}</span>
                    <span className="unlock-date">
                      {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {achievement.nftTokenId && (
                    <div className="nft-indicator">
                      <span className="nft-badge">NFT</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {reputation.achievements.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🏆</div>
                <h3>No Achievements Yet</h3>
                <p>Start engaging with events to unlock achievements!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && isOwnProfile && (
          <div className="analytics-tab">
            <div className="analytics-placeholder">
              <h3>📊 Reputation Analytics</h3>
              <p>Detailed analytics coming soon...</p>
              <div className="analytics-preview">
                <div className="preview-item">
                  <span className="preview-label">Recent Activity:</span>
                  <span className="preview-value">High</span>
                </div>
                <div className="preview-item">
                  <span className="preview-label">Growth Rate:</span>
                  <span className="preview-value">+15% this month</span>
                </div>
                <div className="preview-item">
                  <span className="preview-label">Next Level:</span>
                  <span className="preview-value">
                    {1000 - reputation.overallScore} points needed
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};