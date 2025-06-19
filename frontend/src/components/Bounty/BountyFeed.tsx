import React, { useState } from 'react';
import './BountyFeed.css';

interface Bounty {
  id: string;
  contractBountyId: number;
  sponsor: {
    username: string;
    avatar?: string;
  };
  speaker: {
    username: string;
    avatar?: string;
  };
  description: string;
  rewardAmount: number;
  deadline: string;
  status: 'active' | 'claimed' | 'expired' | 'cancelled';
  claimant?: {
    username: string;
    avatar?: string;
  };
  submissionHash?: string;
  createdAt: string;
  timeRemaining: number;
}

interface Speaker {
  id: string;
  name: string;
  title?: string;
  avatar?: string;
  walletAddress?: string;
  currentTalk?: string;
  todayEarnings?: number;
  tipCount?: number;
  reputation?: number;
  isActive?: boolean;
}

interface BountyFeedProps {
  bounties: Bounty[];
  onTipSpeaker: (speaker: Speaker) => void;
  onCreateBounty: () => void;
  speakers: Speaker[];
}

export const BountyFeed: React.FC<BountyFeedProps> = ({
  bounties,
  onTipSpeaker,
  onCreateBounty,
  speakers
}) => {
  const [expandedBounty, setExpandedBounty] = useState<string | null>(null);

  const formatTimeRemaining = (timeRemaining: number): string => {
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
  };

  const formatAmount = (amount: number): string => {
    return amount >= 1000 ? `$${(amount / 1000).toFixed(1)}k` : `$${amount}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'claimed':
        return '#3B82F6';
      case 'expired':
        return '#EF4444';
      case 'cancelled':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'active':
        return '🎯';
      case 'claimed':
        return '✅';
      case 'expired':
        return '⏰';
      case 'cancelled':
        return '❌';
      default:
        return '🎯';
    }
  };

  const getSpeakerFromBounty = (bounty: Bounty): Speaker | undefined => {
    return speakers.find(s => s.name === bounty.speaker.username);
  };

  const handleTipSpeaker = (bounty: Bounty) => {
    const speaker = getSpeakerFromBounty(bounty);
    if (speaker) {
      onTipSpeaker(speaker);
    }
  };

  const toggleBountyExpansion = (bountyId: string) => {
    setExpandedBounty(expandedBounty === bountyId ? null : bountyId);
  };

  return (
    <div className="bounty-feed">
      {bounties.map((bounty) => (
        <div key={bounty.id} className={`bounty-card ${bounty.status}`}>
          {/* Bounty Header */}
          <div className="bounty-header">
            <div className="bounty-status">
              <span className="status-icon">{getStatusIcon(bounty.status)}</span>
              <span
                className="status-badge"
                style={{ backgroundColor: getStatusColor(bounty.status) }}
              >
                {bounty.status.toUpperCase()}
              </span>
            </div>

            <div className="bounty-reward">
              <span className="reward-amount">{formatAmount(bounty.rewardAmount)}</span>
              <span className="reward-label">Reward</span>
            </div>
          </div>

          {/* Bounty Content */}
          <div className="bounty-content">
            <div className="bounty-participants">
              {/* Sponsor */}
              <div className="participant sponsor">
                <div className="participant-avatar">
                  {bounty.sponsor.avatar ? (
                    <img src={bounty.sponsor.avatar} alt={bounty.sponsor.username} />
                  ) : (
                    <div className="avatar-placeholder">💰</div>
                  )}
                </div>
                <div className="participant-info">
                  <span className="participant-name">{bounty.sponsor.username}</span>
                  <span className="participant-role">Sponsor</span>
                </div>
              </div>

              <div className="participant-arrow">→</div>

              {/* Speaker */}
              <div className="participant speaker">
                <div className="participant-avatar">
                  {bounty.speaker.avatar ? (
                    <img src={bounty.speaker.avatar} alt={bounty.speaker.username} />
                  ) : (
                    <div className="avatar-placeholder">🎤</div>
                  )}
                </div>
                <div className="participant-info">
                  <span className="participant-name">{bounty.speaker.username}</span>
                  <span className="participant-role">Speaker</span>
                </div>
              </div>
            </div>

            {/* Bounty Description */}
            <div className="bounty-description">
              <p className={`description-text ${expandedBounty === bounty.id ? 'expanded' : ''}`}>
                {bounty.description}
              </p>
              {bounty.description.length > 150 && (
                <button
                  className="expand-button"
                  onClick={() => toggleBountyExpansion(bounty.id)}
                >
                  {expandedBounty === bounty.id ? 'Show Less' : 'Show More'}
                </button>
              )}
            </div>

            {/* Bounty Meta */}
            <div className="bounty-meta">
              <div className="meta-item">
                <span className="meta-icon">⏰</span>
                <span className="meta-text">
                  {bounty.status === 'active' ?
                    `${formatTimeRemaining(bounty.timeRemaining)} left` :
                    `Deadline: ${new Date(bounty.deadline).toLocaleDateString()}`
                  }
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">📅</span>
                <span className="meta-text">
                  Created {new Date(bounty.createdAt).toLocaleDateString()}
                </span>
              </div>
              {bounty.claimant && (
                <div className="meta-item">
                  <span className="meta-icon">👤</span>
                  <span className="meta-text">
                    Claimed by {bounty.claimant.username}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bounty Actions */}
          <div className="bounty-actions">
            {bounty.status === 'active' && (
              <>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleTipSpeaker(bounty)}
                >
                  💰 Tip Speaker
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {/* Handle claim bounty */}}
                >
                  🎯 Claim Bounty
                </button>
              </>
            )}

            {bounty.status === 'claimed' && bounty.submissionHash && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => window.open(`https://ipfs.io/ipfs/${bounty.submissionHash}`, '_blank')}
              >
                📖 View Submission
              </button>
            )}

            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {/* Handle share bounty */}}
            >
              📤 Share
            </button>
          </div>

          {/* Progress Indicator for Active Bounties */}
          {bounty.status === 'active' && (
            <div className="bounty-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.max(0, Math.min(100, (1 - bounty.timeRemaining / (7 * 24 * 3600)) * 100))}%`
                  }}
                ></div>
              </div>
              <span className="progress-text">
                {bounty.timeRemaining < 3600 ? 'Urgent' :
                 bounty.timeRemaining < 24 * 3600 ? 'Due Soon' : 'Active'}
              </span>
            </div>
          )}
        </div>
      ))}

      {/* Create Bounty CTA */}
      <div className="create-bounty-cta">
        <div className="cta-content">
          <h3>Don't see what you're looking for?</h3>
          <p>Create a custom bounty and commission exactly the content you need</p>
          <button
            className="btn btn-primary btn-lg"
            onClick={onCreateBounty}
          >
            🎯 Create Custom Bounty
          </button>
        </div>
        <div className="cta-benefits">
          <div className="benefit">
            <span className="benefit-icon">⚡</span>
            <span className="benefit-text">24-48h delivery</span>
          </div>
          <div className="benefit">
            <span className="benefit-icon">🏆</span>
            <span className="benefit-text">95% completion rate</span>
          </div>
          <div className="benefit">
            <span className="benefit-icon">💎</span>
            <span className="benefit-text">High-quality content</span>
          </div>
        </div>
      </div>
    </div>
  );
};
