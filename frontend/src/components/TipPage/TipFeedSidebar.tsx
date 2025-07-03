import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from '../Loading/LoadingSpinner';
import './TipFeedSidebar.css';

interface TipFeedSidebarProps {
  eventId: string;
  compact?: boolean;
}

interface TipActivity {
  id: string;
  tipper: string;
  speaker: string;
  amount: number;
  message?: string;
  timestamp: Date;
  txHash?: string;
}

export const TipFeedSidebar: React.FC<TipFeedSidebarProps> = ({
  eventId,
  compact = false
}) => {
  const [tips, setTips] = useState<TipActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'recent' | 'top'>('recent');

  // Mock data for demo - replace with real API call
  useEffect(() => {
    const loadTips = async () => {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock tip data
      const mockTips: TipActivity[] = [
        {
          id: '1',
          tipper: 'vitalik.eth',
          speaker: 'Satoshi N.',
          amount: 50,
          message: 'Great insights on scaling! 🚀',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          txHash: '0x123...'
        },
        {
          id: '2',
          tipper: 'papa.eth',
          speaker: 'Alice Chen',
          amount: 25,
          message: 'Love the DeFi perspective 💡',
          timestamp: new Date(Date.now() - 12 * 60 * 1000),
          txHash: '0x456...'
        },
        {
          id: '3',
          tipper: 'anon_123',
          speaker: 'Bob Wilson',
          amount: 100,
          timestamp: new Date(Date.now() - 18 * 60 * 1000),
          txHash: '0x789...'
        },
        {
          id: '4',
          tipper: 'crypto_dev',
          speaker: 'Satoshi N.',
          amount: 10,
          message: 'Thanks for the demo! 👏',
          timestamp: new Date(Date.now() - 25 * 60 * 1000),
          txHash: '0xabc...'
        },
        {
          id: '5',
          tipper: 'defi_lover',
          speaker: 'Alice Chen',
          amount: 75,
          message: 'Mind-blowing presentation! 🤯',
          timestamp: new Date(Date.now() - 35 * 60 * 1000),
          txHash: '0xdef...'
        }
      ];
      
      setTips(mockTips);
      setIsLoading(false);
    };

    loadTips();
  }, [eventId]);

  // Filter tips based on selected filter
  const filteredTips = React.useMemo(() => {
    switch (filter) {
      case 'recent':
        return tips.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      case 'top':
        return tips.sort((a, b) => b.amount - a.amount);
      case 'all':
      default:
        return tips;
    }
  }, [tips, filter]);

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const formatTipper = (tipper: string) => {
    if (tipper.endsWith('.eth')) return tipper;
    if (tipper.startsWith('0x')) return `${tipper.slice(0, 6)}...${tipper.slice(-4)}`;
    return tipper;
  };

  const TipItem: React.FC<{ tip: TipActivity }> = ({ tip }) => (
    <div className="tip-item">
      <div className="tip-header">
        <div className="tip-amount">${tip.amount}</div>
        <div className="tip-time">{formatTimeAgo(tip.timestamp)}</div>
      </div>
      
      <div className="tip-details">
        <div className="tip-flow">
          <span className="tipper">{formatTipper(tip.tipper)}</span>
          <span className="arrow">→</span>
          <span className="speaker">{tip.speaker}</span>
        </div>
        
        {tip.message && (
          <div className="tip-message">
            "{tip.message}"
          </div>
        )}
      </div>

      {tip.txHash && (
        <div className="tip-tx">
          <a
            href={`https://explorer.sepolia.mantle.xyz/tx/${tip.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="tx-link"
          >
            View TX
          </a>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className={`tip-feed-sidebar ${compact ? 'compact' : ''}`}>
        <div className="sidebar-header">
          <h3>💰 Live Tips</h3>
        </div>
        <div className="sidebar-content">
          <LoadingSpinner size="md" text="Loading tip feed..." />
        </div>
      </div>
    );
  }

  return (
    <div className={`tip-feed-sidebar ${compact ? 'compact' : ''}`}>
      
      {/* Header */}
      <div className="sidebar-header">
        <h3>💰 Live Tips</h3>
        <div className="tip-stats">
          <span className="stat">
            {tips.length} tips
          </span>
          <span className="stat">
            ${tips.reduce((sum, tip) => sum + tip.amount, 0)} total
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="tip-filters">
        <button
          className={`filter-btn ${filter === 'recent' ? 'active' : ''}`}
          onClick={() => setFilter('recent')}
        >
          Recent
        </button>
        <button
          className={`filter-btn ${filter === 'top' ? 'active' : ''}`}
          onClick={() => setFilter('top')}
        >
          Top Tips
        </button>
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
      </div>

      {/* Tip Feed */}
      <div className="tip-feed">
        {filteredTips.length > 0 ? (
          filteredTips.map(tip => (
            <TipItem key={tip.id} tip={tip} />
          ))
        ) : (
          <div className="empty-feed">
            <div className="empty-content">
              <h4>🎤 No tips yet</h4>
              <p>Be the first to tip a speaker!</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="footer-info">
          <div className="info-item">
            <span className="info-icon">⚡</span>
            <span>Ultra-low fees</span>
          </div>
          <div className="info-item">
            <span className="info-icon">🔒</span>
            <span>Secure & instant</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TipFeedSidebar;