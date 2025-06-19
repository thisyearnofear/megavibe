import React, { useState, useEffect } from 'react';
import { BountyModal } from '../LiveMusic/BountyModal';
import { TippingModal } from '../LiveMusic/TippingModal';
import { useEvent } from '../../contexts/EventContext';
import { useWallet } from '../../contexts/WalletContext';
import { useBountiesForEvent } from '../../hooks/useBountiesForEvent';
// import { BountyFeed } from './BountyFeed';
// import { BountyFilters } from './BountyFilters';
// import { MarketplaceHeader } from './MarketplaceHeader';
import './BountyMarketplacePage.css';

interface BountyMarketplacePageProps {
  onBack?: () => void;
}

interface FilterState {
  priceRange: [number, number];
  status: 'all' | 'active' | 'claimed' | 'expired';
  speakerId: string | null;
  sortBy: 'newest' | 'highest' | 'ending-soon' | 'most-popular';
}

export const BountyMarketplacePage: React.FC<BountyMarketplacePageProps> = ({ onBack }) => {
  console.log('🎯 BountyMarketplacePage component rendered!');

  const [showCreateBounty, setShowCreateBounty] = useState(false);
  const [showTipping, setShowTipping] = useState(false);
  const [selectedSpeaker, setSelectedSpeaker] = useState<any>(null);
  const [hasLoadingTimeout, setHasLoadingTimeout] = useState(false);
  // const [selectedBounty, setSelectedBounty] = useState<any>(null);
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [25, 500],
    status: 'active',
    speakerId: null,
    sortBy: 'newest'
  });

  const { currentEvent, speakers, isLoading } = useEvent();
  const { isConnected } = useWallet();
  const { bounties, stats, isLoading: bountiesLoading, refreshBounties } = useBountiesForEvent(currentEvent?.id || '');

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasLoadingTimeout(true);
    }, 3000); // 3 second timeout
    return () => clearTimeout(timer);
  }, []);

  // Filter bounties based on current filters
  const filteredBounties = bounties.filter(bounty => {
    // Price range filter
    if (bounty.rewardAmount < filters.priceRange[0] || bounty.rewardAmount > filters.priceRange[1]) {
      return false;
    }

    // Status filter
    if (filters.status !== 'all' && bounty.status !== filters.status) {
      return false;
    }

    // Speaker filter
    if (filters.speakerId && bounty.speaker.username !== filters.speakerId) {
      return false;
    }

    return true;
  });

  // Sort bounties
  const sortedBounties = [...filteredBounties].sort((a, b) => {
    switch (filters.sortBy) {
      case 'highest':
        return b.rewardAmount - a.rewardAmount;
      case 'ending-soon':
        return a.timeRemaining - b.timeRemaining;
      case 'most-popular':
        return b.rewardAmount - a.rewardAmount; // Placeholder for engagement metric
      default: // newest
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const handleCreateBounty = () => {
    if (!isConnected) {
      return;
    }

    const activeSpeaker = speakers.find(s => s.isActive) || speakers[0];
    if (activeSpeaker) {
      setSelectedSpeaker(activeSpeaker);
      setShowCreateBounty(true);
    }
  };

  const handleTipSpeaker = (speaker: any) => {
    if (!isConnected) {
      return;
    }

    setSelectedSpeaker(speaker);
    setShowTipping(true);
  };

  const handleBountySuccess = () => {
    setShowCreateBounty(false);
    refreshBounties();
  };

  const handleTipSuccess = () => {
    setShowTipping(false);
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Don't show loading if we have timeout or have basic data
  if (!hasLoadingTimeout && ((isLoading && !currentEvent) || (bountiesLoading && bounties.length === 0 && !stats.totalBounties))) {
    return (
      <div className="bounty-marketplace-page loading">
        <div className="loading-spinner"></div>
        <p>Loading Bounty Marketplace...</p>
      </div>
    );
  }

  return (
    <div className="bounty-marketplace-page">
      {/* Header */}
      <header className="marketplace-header-section">
        <button className="back-button" onClick={() => window.location.href = '/'}>
          ← Back to Features
        </button>
        <div className="header-content">
          <h1>🎯 Bounty Marketplace</h1>
          <p className="header-subtitle">
            Commission specific content from speakers. Browse active bounties and create your own requests.
          </p>
        </div>
      </header>

      {/* Marketplace Stats */}
      {/* <MarketplaceHeader stats={stats} /> */}
      <div style={{padding: '20px', background: 'white', borderRadius: '8px', marginBottom: '20px'}}>
        <h3>Marketplace Stats (Placeholder)</h3>
        <p>Active Bounties: {stats.activeBounties}</p>
        <p>Total Reward: ${stats.totalReward}</p>
      </div>

      {/* Main Content */}
      <div className="marketplace-content">
        {/* Sidebar - Filters & Actions */}
        <aside className="marketplace-sidebar">
          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleCreateBounty}
              disabled={!isConnected}
            >
              🎯 Create Bounty
            </button>
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => window.location.href = '/tip'}
            >
              💰 Browse Speakers
            </button>
          </div>

          {/* <BountyFilters
            filters={filters}
            speakers={speakers}
            onFilterChange={handleFilterChange}
          /> */}
          <div style={{padding: '20px', background: 'white', borderRadius: '8px', marginBottom: '20px'}}>
            <h4>Filters (Placeholder)</h4>
            <p>Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}</p>
            <p>Status: {filters.status}</p>
          </div>

          {!isConnected && (
            <div className="connection-notice">
              <h4>Connect Wallet</h4>
              <p>Connect your wallet to create bounties and participate in the marketplace</p>
            </div>
          )}

          {/* Marketplace Insights */}
          <div className="marketplace-insights">
            <h4>💡 Marketplace Insights</h4>
            <div className="insights-list">
              <div className="insight-item">
                <span className="insight-icon">⚡</span>
                <div className="insight-content">
                  <span className="insight-title">Fast Delivery</span>
                  <span className="insight-description">95% completed within 48h</span>
                </div>
              </div>
              <div className="insight-item">
                <span className="insight-icon">🏆</span>
                <div className="insight-content">
                  <span className="insight-title">High Quality</span>
                  <span className="insight-description">4.8/5 average rating</span>
                </div>
              </div>
              <div className="insight-item">
                <span className="insight-icon">💎</span>
                <div className="insight-content">
                  <span className="insight-title">Fair Pricing</span>
                  <span className="insight-description">$25-500 typical range</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Feed */}
        <main className="marketplace-main">
          <div className="feed-header">
            <div className="feed-title">
              <h2>Active Bounties ({sortedBounties.length})</h2>
              <p>Commission content from top speakers in the crypto community</p>
            </div>

            <div className="feed-controls">
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange({ sortBy: e.target.value as FilterState['sortBy'] })}
                className="sort-select"
              >
                <option value="newest">Newest First</option>
                <option value="highest">Highest Reward</option>
                <option value="ending-soon">Ending Soon</option>
                <option value="most-popular">Most Popular</option>
              </select>
            </div>
          </div>

          {/* <BountyFeed
            bounties={sortedBounties}
            onTipSpeaker={handleTipSpeaker}
            onCreateBounty={handleCreateBounty}
            speakers={speakers}
          /> */}
          <div style={{padding: '20px', background: 'white', borderRadius: '8px'}}>
            <h3>🎯 Bounty Marketplace</h3>
            <p><strong>Commission specific content from speakers</strong></p>
            <p>Found {sortedBounties.length} bounties • Status: {filters.status}</p>

            <div style={{margin: '20px 0', padding: '15px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #0ea5e9'}}>
              <h4 style={{margin: '0 0 10px 0', color: '#0369a1'}}>💡 How Bounty Marketplace Works</h4>
              <p style={{margin: '5px 0', fontSize: '14px'}}>• Commission content: $25-500 bounties</p>
              <p style={{margin: '5px 0', fontSize: '14px'}}>• 24-48h delivery window</p>
              <p style={{margin: '5px 0', fontSize: '14px'}}>• 95% completion rate</p>
              <p style={{margin: '5px 0', fontSize: '14px'}}>• Direct payment to speakers</p>
            </div>

            <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px'}}>
              <button
                style={{padding: '12px 24px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600}}
                onClick={handleCreateBounty}
                disabled={!isConnected}
              >
                🎯 Create Bounty
              </button>
              <button
                style={{padding: '12px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600}}
                onClick={() => window.location.href = '/tip'}
              >
                💰 Live Tipping
              </button>
              <button
                style={{padding: '12px 24px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600}}
                onClick={() => window.location.href = '/infonomy'}
              >
                🧠 Knowledge Economy
              </button>
            </div>

            {!isConnected && (
              <div style={{padding: '15px', background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', marginBottom: '20px'}}>
                <p style={{margin: 0, color: '#92400e'}}><strong>Connect your wallet</strong> to create bounties and tip speakers</p>
              </div>
            )}

            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px'}}>
              <div style={{padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
                <h5 style={{margin: '0 0 10px 0', color: '#1e40af'}}>🧠 ZK-Proofs Tutorial</h5>
                <p style={{margin: '0 0 10px 0', fontSize: '14px', color: '#64748b'}}>Advanced zero-knowledge proof concepts</p>
                <p style={{margin: '0', fontWeight: 600, color: '#059669'}}>$450 • 24h delivery</p>
              </div>
              <div style={{padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
                <h5 style={{margin: '0 0 10px 0', color: '#1e40af'}}>🏦 DeFi Strategy Guide</h5>
                <p style={{margin: '0 0 10px 0', fontSize: '14px', color: '#64748b'}}>Yield farming with risk analysis</p>
                <p style={{margin: '0', fontWeight: 600, color: '#059669'}}>$300 • 48h delivery</p>
              </div>
              <div style={{padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
                <h5 style={{margin: '0 0 10px 0', color: '#1e40af'}}>🔒 Security Audit</h5>
                <p style={{margin: '0 0 10px 0', fontSize: '14px', color: '#64748b'}}>Smart contract security checklist</p>
                <p style={{margin: '0', fontWeight: 600, color: '#059669'}}>$500 • 36h delivery</p>
              </div>
            </div>
          </div>

          {sortedBounties.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🎯</div>
              <h3>No bounties match your filters</h3>
              <p>Try adjusting your filters or create the first bounty for this event!</p>
              <button
                className="btn btn-primary"
                onClick={handleCreateBounty}
                disabled={!isConnected}
              >
                Create First Bounty
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Success Stories Section */}
      <div className="marketplace-success-stories">
        <h2>🏆 Bounty Success Stories</h2>
        <div className="success-grid">
          <div className="success-story">
            <div className="story-header">
              <span className="story-avatar">🧠</span>
              <div className="story-info">
                <h4>Advanced ZK-Proofs Tutorial</h4>
                <p className="story-bounty">$450 bounty • Completed in 36h</p>
              </div>
            </div>
            <p className="story-description">
              "Detailed 45-minute tutorial covering advanced zero-knowledge proof concepts with practical examples."
            </p>
            <div className="story-metrics">
              <span className="metric">1.2K views</span>
              <span className="metric">4.9/5 rating</span>
              <span className="metric">12 comments</span>
            </div>
          </div>

          <div className="success-story">
            <div className="story-header">
              <span className="story-avatar">🚀</span>
              <div className="story-info">
                <h4>DeFi Yield Strategies Guide</h4>
                <p className="story-bounty">$300 bounty • Completed in 24h</p>
              </div>
            </div>
            <p className="story-description">
              "Comprehensive guide to yield farming strategies with risk analysis and portfolio recommendations."
            </p>
            <div className="story-metrics">
              <span className="metric">850 views</span>
              <span className="metric">4.7/5 rating</span>
              <span className="metric">8 comments</span>
            </div>
          </div>

          <div className="success-story">
            <div className="story-header">
              <span className="story-avatar">💡</span>
              <div className="story-info">
                <h4>Smart Contract Security Audit</h4>
                <p className="story-bounty">$500 bounty • Completed in 48h</p>
              </div>
            </div>
            <p className="story-description">
              "Professional security audit checklist with automated tools and manual review processes."
            </p>
            <div className="story-metrics">
              <span className="metric">2.1K views</span>
              <span className="metric">5.0/5 rating</span>
              <span className="metric">18 comments</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cross-Navigation */}
      <div className="cross-navigation">
        <h3>Explore More MegaVibe Features</h3>
        <div className="nav-cards">
          <div className="nav-card" onClick={() => window.location.href = '/tip'}>
            <span className="nav-icon">💰</span>
            <h4>Live Tipping</h4>
            <p>Tip speakers in real-time during talks</p>
          </div>
          <div className="nav-card" onClick={() => window.location.href = '/infonomy'}>
            <span className="nav-icon">🧠</span>
            <h4>Knowledge Economy</h4>
            <p>See how the flywheel creates value</p>
          </div>
          <div className="nav-card" onClick={() => {/* Navigate to earnings dashboard */}}>
            <span className="nav-icon">⚡</span>
            <h4>Live Earnings</h4>
            <p>Watch real-time speaker earnings</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateBounty && selectedSpeaker && currentEvent && (
        <BountyModal
          eventId={currentEvent.id}
          speakerId={selectedSpeaker.id}
          speakerName={selectedSpeaker.name}
          onClose={() => setShowCreateBounty(false)}
          onSuccess={handleBountySuccess}
          isOpen={showCreateBounty}
        />
      )}

      {showTipping && selectedSpeaker && currentEvent && (
        <TippingModal
          speaker={selectedSpeaker}
          event={currentEvent}
          onClose={() => setShowTipping(false)}
          onSuccess={handleTipSuccess}
          isOpen={showTipping}
        />
      )}
    </div>
  );
};
