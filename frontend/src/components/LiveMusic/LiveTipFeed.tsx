import React, { useState } from 'react';
import { useLiveTipFeed } from '../../hooks/useLiveTipFeed';
import './LiveTipFeed.css';

interface LiveTipFeedProps {
  eventId: string;
  className?: string;
}

export const LiveTipFeed: React.FC<LiveTipFeedProps> = ({
  eventId,
  className = '',
}) => {
  const { tips, stats, isLoading, error, isConnected, refreshFeed } = useLiveTipFeed(eventId);
  const [showAllTips, setShowAllTips] = useState(false);

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const tipTime = new Date(timestamp);
    const diffMs = now.getTime() - tipTime.getTime();
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const formatAmount = (amount: number): string => {
    return amount >= 1000 ? `$${(amount / 1000).toFixed(1)}k` : `$${amount}`;
  };

  const displayedTips = showAllTips ? tips : tips.slice(0, 10);

  const renderLoadingState = () => (
    <div className={`live-tip-feed loading ${className}`}>
      <div className="feed-header">
        <h3>🔴 Live Tip Feed</h3>
        <div className="loading-spinner"></div>
      </div>
      <div className="tip-skeleton">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="tip-item skeleton">
            <div className="skeleton-avatar"></div>
            <div className="skeleton-content">
              <div className="skeleton-line"></div>
              <div className="skeleton-line short"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className={`live-tip-feed error ${className}`}>
      <div className="feed-header">
        <h3>🔴 Live Tip Feed</h3>
        <button onClick={refreshFeed} className="refresh-btn" title="Retry connection">
          🔄 Retry
        </button>
      </div>
      <div className="error-message">
        <span>⚠️ {error}</span>
      </div>
    </div>
  );

  if (isLoading) {
    return renderLoadingState();
  }

  if (error && !isConnected) {
    return renderErrorState();
  }

  return (
    <div className={`live-tip-feed ${className}`}>
      {/* Feed Header with Stats */}
      <div className="feed-header">
        <h3>🔴 Live Tip Feed</h3>
        <button onClick={refreshFeed} className="refresh-btn" title="Refresh feed">
          🔄
        </button>
      </div>

      {/* Live Stats Bar */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-value">${stats.totalAmount.toFixed(0)}</span>
          <span className="stat-label">Total Tips</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.activeTippers}</span>
          <span className="stat-label">Active Tippers</span>
        </div>
        <div className="stat-item pulse">
          <span className="stat-value">{stats.tipsPerMinute}</span>
          <span className="stat-label">Tips/min</span>
        </div>
      </div>

      {/* Tips List */}
      <div className="tips-container">
        {tips.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💰</div>
            <p>No tips yet</p>
            <span>Be the first to tip a speaker!</span>
          </div>
        ) : (
          <>
            <div className="tips-list">
              {displayedTips.map((tip, index) => (
                <div
                  key={tip.id}
                  className={`tip-item ${index < 3 ? 'recent' : ''}`}
                  style={{
                    animationDelay: `${index * 0.1}s`,
                  }}
                >
                  <div className="tip-avatar">
                    {tip.tipper.avatar ? (
                      <img src={tip.tipper.avatar} alt={tip.tipper.username} />
                    ) : (
                      <div className="avatar-placeholder">
                        {tip.tipper.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="tip-content">
                    <div className="tip-header">
                      <span className="tipper-name">@{tip.tipper.username}</span>
                      <span className="tip-amount">{formatAmount(tip.amount)}</span>
                      <span className="tip-time">{formatTimeAgo(tip.timestamp)}</span>
                    </div>

                    {tip.message && (
                      <div className="tip-message">"{tip.message}"</div>
                    )}

                    <div className="tip-recipient">
                      → {tip.recipient.username}
                    </div>
                  </div>

                  {tip.txHash && (
                    <div className="tip-actions">
                      <a
                        href={`https://explorer.sepolia.mantle.xyz/tx/${tip.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tx-link"
                        title="View transaction"
                      >
                        🔗
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {tips.length > 10 && (
              <div className="feed-footer">
                <button
                  className="show-more-btn"
                  onClick={() => setShowAllTips(!showAllTips)}
                >
                  {showAllTips ? 'Show Less' : `Show All ${tips.length} Tips`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Live Indicator */}
      <div className={`live-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
        <span className="live-dot"></span>
        <span>{isConnected ? 'Live' : 'Offline'}</span>
      </div>
    </div>
  );
};

export default LiveTipFeed;
