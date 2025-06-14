import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import '../../styles/SocialSharingIncentives.css';

interface SharingIncentivesProps {
  performanceId?: string;
  snippetId?: string;
  onShare?: (platform: string, reward: number) => void;
  onClose?: () => void;
}

interface ShareReward {
  platform: string;
  baseReward: number;
  viralBonus: number;
  icon: string;
  color: string;
}

const SHARE_PLATFORMS: ShareReward[] = [
  {
    platform: 'twitter',
    baseReward: 10,
    viralBonus: 50,
    icon: '🐦',
    color: '#1DA1F2'
  },
  {
    platform: 'instagram',
    baseReward: 15,
    viralBonus: 75,
    icon: '📸',
    color: '#E4405F'
  },
  {
    platform: 'tiktok',
    baseReward: 20,
    viralBonus: 100,
    icon: '🎵',
    color: '#000000'
  },
  {
    platform: 'linkedin',
    baseReward: 25,
    viralBonus: 60,
    icon: '💼',
    color: '#0077B5'
  },
  {
    platform: 'discord',
    baseReward: 12,
    viralBonus: 40,
    icon: '🎮',
    color: '#5865F2'
  },
  {
    platform: 'telegram',
    baseReward: 8,
    viralBonus: 30,
    icon: '✈️',
    color: '#0088CC'
  }
];

export const SocialSharingIncentives: React.FC<SharingIncentivesProps> = ({
  performanceId,
  snippetId,
  onShare,
  onClose,
}) => {
  const [userRewards, setUserRewards] = useState(0);
  const [totalShares, setTotalShares] = useState(0);
  const [recentShares, setRecentShares] = useState<Array<{
    platform: string;
    reward: number;
    timestamp: Date;
  }>>([]);
  const [isSharing, setIsSharing] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [shareText, setShareText] = useState('');

  useEffect(() => {
    // Generate share URL and text based on content type
    const baseUrl = window.location.origin;
    if (performanceId) {
      setShareUrl(`${baseUrl}/performance/${performanceId}`);
      setShareText('🎭 Check out this amazing live performance on MegaVibe! Real-time audience interaction with crypto tips and bounties. #LivePerformance #Web3 #MegaVibe');
    } else if (snippetId) {
      setShareUrl(`${baseUrl}/snippet/${snippetId}`);
      setShareText('🎵 Amazing moment captured on MegaVibe! This clip is part of our tokenized content pool. #MomentNFT #Web3Content #MegaVibe');
    }

    // Load user's sharing history and rewards
    loadUserRewards();
  }, [performanceId, snippetId]);

  const loadUserRewards = async () => {
    try {
      // This would typically fetch from user's profile or rewards API
      // For now, using mock data
      setUserRewards(250);
      setTotalShares(12);
      setRecentShares([
        { platform: 'twitter', reward: 10, timestamp: new Date(Date.now() - 3600000) },
        { platform: 'instagram', reward: 15, timestamp: new Date(Date.now() - 7200000) },
      ]);
    } catch (error) {
      console.error('Error loading user rewards:', error);
    }
  };

  const handleShare = async (platform: string) => {
    if (isSharing) return;

    setIsSharing(platform);

    try {
      // Record the share attempt
      const response = await api.post('/live-influence/social-share', {
        performanceId,
        snippetId,
        platform,
      });

      const reward = response.data.reward || SHARE_PLATFORMS.find(p => p.platform === platform)?.baseReward || 10;

      // Update local state
      setUserRewards(prev => prev + reward);
      setTotalShares(prev => prev + 1);
      setRecentShares(prev => [
        { platform, reward, timestamp: new Date() },
        ...prev.slice(0, 4)
      ]);

      // Open sharing window/modal based on platform
      openSharingWindow(platform);

      // Notify parent component
      if (onShare) {
        onShare(platform, reward);
      }

      // Show success feedback
      showShareSuccess(platform, reward);

    } catch (error) {
      console.error('Error recording share:', error);
      showShareError(platform);
    } finally {
      setIsSharing(null);
    }
  };

  const openSharingWindow = (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);

    let shareLink = '';

    switch (platform) {
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'telegram':
        shareLink = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        break;
      default:
        // For platforms without direct share URLs, copy to clipboard
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        return;
    }

    if (shareLink) {
      window.open(shareLink, '_blank', 'width=600,height=400');
    }
  };

  const showShareSuccess = (platform: string, reward: number) => {
    // This would typically show a toast notification
    console.log(`Successfully shared on ${platform}! Earned ${reward} points.`);
  };

  const showShareError = (platform: string) => {
    // This would typically show an error toast
    console.error(`Failed to record share on ${platform}`);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    // Show copied feedback
  };

  const getViralPotential = (): string => {
    // Mock viral potential calculation
    const hour = new Date().getHours();
    if (hour >= 18 && hour <= 22) return 'High';
    if (hour >= 12 && hour <= 17) return 'Medium';
    return 'Low';
  };

  const getViralMultiplier = (): number => {
    const potential = getViralPotential();
    switch (potential) {
      case 'High': return 2.0;
      case 'Medium': return 1.5;
      default: return 1.0;
    }
  };

  return (
    <div className="social-sharing-incentives">
      <div className="sharing-header">
        <div className="header-content">
          <h2>📱 Share & Earn</h2>
          {onClose && (
            <button className="close-button" onClick={onClose}>
              ×
            </button>
          )}
        </div>
        <p className="sharing-description">
          Share this {performanceId ? 'performance' : 'moment'} and earn rewards! 
          Higher engagement = bigger bonuses.
        </p>
      </div>

      <div className="rewards-overview">
        <div className="reward-stat">
          <div className="stat-value">{userRewards}</div>
          <div className="stat-label">Total Points</div>
        </div>
        <div className="reward-stat">
          <div className="stat-value">{totalShares}</div>
          <div className="stat-label">Shares Made</div>
        </div>
        <div className="reward-stat">
          <div className="stat-value">{getViralPotential()}</div>
          <div className="stat-label">Viral Potential</div>
        </div>
      </div>

      <div className="viral-bonus-info">
        <div className="bonus-header">
          <span className="bonus-icon">🚀</span>
          <span className="bonus-text">
            Viral Bonus Active: {getViralMultiplier()}x multiplier
          </span>
        </div>
        <div className="bonus-description">
          Shares that go viral earn up to {Math.max(...SHARE_PLATFORMS.map(p => p.viralBonus))} bonus points!
        </div>
      </div>

      <div className="sharing-platforms">
        <h3>Choose Platform</h3>
        <div className="platforms-grid">
          {SHARE_PLATFORMS.map((platform) => (
            <button
              key={platform.platform}
              className={`platform-button ${isSharing === platform.platform ? 'sharing' : ''}`}
              onClick={() => handleShare(platform.platform)}
              disabled={isSharing !== null}
              style={{ '--platform-color': platform.color } as React.CSSProperties}
            >
              <div className="platform-icon">{platform.icon}</div>
              <div className="platform-info">
                <div className="platform-name">
                  {platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1)}
                </div>
                <div className="platform-reward">
                  +{Math.floor(platform.baseReward * getViralMultiplier())} points
                </div>
              </div>
              <div className="platform-bonus">
                <span className="bonus-label">Viral:</span>
                <span className="bonus-amount">+{platform.viralBonus}</span>
              </div>
              {isSharing === platform.platform && (
                <div className="sharing-spinner"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="share-tools">
        <div className="share-url-section">
          <label>Share URL:</label>
          <div className="url-input-group">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="share-url-input"
            />
            <button
              className="copy-button"
              onClick={copyShareLink}
              title="Copy to clipboard"
            >
              📋
            </button>
          </div>
        </div>

        <div className="share-text-section">
          <label>Share Text:</label>
          <textarea
            value={shareText}
            onChange={(e) => setShareText(e.target.value)}
            className="share-text-input"
            rows={3}
          />
        </div>
      </div>

      {recentShares.length > 0 && (
        <div className="recent-shares">
          <h4>Recent Shares</h4>
          <div className="shares-list">
            {recentShares.map((share, index) => (
              <div key={index} className="share-item">
                <div className="share-platform">
                  {SHARE_PLATFORMS.find(p => p.platform === share.platform)?.icon}
                  {share.platform}
                </div>
                <div className="share-reward">+{share.reward} points</div>
                <div className="share-time">
                  {share.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="sharing-tips">
        <h4>💡 Sharing Tips</h4>
        <ul>
          <li>Share during peak hours (6-10 PM) for higher viral potential</li>
          <li>Add your own commentary to increase engagement</li>
          <li>Tag relevant communities and friends</li>
          <li>Use trending hashtags related to the content</li>
          <li>Engage with comments on your shares for bonus points</li>
        </ul>
      </div>

      <div className="rewards-info">
        <div className="info-section">
          <h5>How Rewards Work</h5>
          <p>
            • Base rewards for each share<br/>
            • Viral bonuses for high-engagement shares<br/>
            • Time-based multipliers during peak hours<br/>
            • Extra points for authentic engagement
          </p>
        </div>
      </div>
    </div>
  );
};