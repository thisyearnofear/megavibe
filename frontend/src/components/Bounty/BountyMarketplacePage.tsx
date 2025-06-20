import React, { useState, useEffect } from 'react';
import { BountyModal } from '../LiveMusic/BountyModal';
import { TippingModal } from '../LiveMusic/TippingModal';
import { useEvent } from '../../contexts/EventContext';
import { useWallet } from '../../contexts/WalletContext';
import { useBountiesForEvent } from '../../hooks/useBountiesForEvent';
import { useBountyFilter } from '../../hooks/useBountyFilter';
import '../../styles/design-system.css';
import './BountyMarketplacePage.css';
import { PageLayout } from '../Layout/PageLayout';
import { Button } from '../UI/Button';
import { Card } from '../UI/Card';
import { SkeletonCard } from '../Loading/SkeletonCard';
import { MOCK_EVENTS } from '../../services/mockDataService';

interface BountyMarketplacePageProps {
  onBack?: () => void;
}

export const BountyMarketplacePage: React.FC<BountyMarketplacePageProps> = ({ onBack }) => {
  console.log('🎯 BountyMarketplacePage component rendered!');

  const [showCreateBounty, setShowCreateBounty] = useState(false);
  const [showTipping, setShowTipping] = useState(false);
  const [selectedSpeaker, setSelectedSpeaker] = useState<any>(null);
  const [hasLoadingTimeout, setHasLoadingTimeout] = useState(false);

  const { currentEvent, speakers, isLoading } = useEvent();

  // Ensure we always have an event (for demo/mock)
  useEffect(() => {
    if (!currentEvent) {
      // Use the first mock event if none is loaded
      // @ts-ignore
      if (MOCK_EVENTS && MOCK_EVENTS[0] && typeof window !== 'undefined') {
        // @ts-ignore
        window.__eventContext?.loadEvent?.(MOCK_EVENTS[0].id);
      }
    }
  }, [currentEvent]);

  const eventId = currentEvent?.id || (MOCK_EVENTS[0]?.id ?? '');
  const { isConnected } = useWallet();
  const { bounties, stats, isLoading: bountiesLoading, refreshBounties } = useBountiesForEvent(eventId);
  const {
    status, setStatus,
    sort, setSort,
    speakerId, setSpeakerId,
    priceRange, setPriceRange,
    filtered: filteredBounties
  } = useBountyFilter(bounties);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasLoadingTimeout(true);
    }, 3000); // 3 second timeout
    return () => clearTimeout(timer);
  }, []);

  const handleCreateBounty = () => {
    if (!isConnected) {
      return;
    }

    const activeSpeaker = Array.isArray(speakers) ? speakers.find(s => s.isActive) : undefined;
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
    <PageLayout
      title="Bounty Marketplace"
      subtitle="Discover, create, and claim bounties for live events."
      
    >
      <div className="marketplace-content grid">
        {onBack && (
          <Button variant="secondary" size="md" onClick={onBack} style={{ marginBottom: 'var(--space-lg)' }}>
            &larr; Back
          </Button>
        )}
        {(isLoading || bountiesLoading) ? (
          <>
            {[...Array(3)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </>
        ) : (
          filteredBounties.map(bounty => (
            <Card key={bounty.id} className="bounty-card">
              <div className="bounty-header">
                <div className="bounty-reward">
                  <span className="reward-amount">${bounty.rewardAmount}</span>
                  <span className={`bounty-status badge badge-${bounty.status}`}>{bounty.status.toUpperCase()}</span>
                </div>
                <div className="bounty-deadline">
                  <span>Deadline: {new Date(bounty.deadline).toLocaleString()}</span>
                </div>
              </div>
              <div className="bounty-description">
                <p>{bounty.description}</p>
              </div>
              <div className="bounty-meta">
                <div className="bounty-speaker">
                  <span className="avatar">
                    {bounty.speaker.avatar ? (
                      <img src={bounty.speaker.avatar} alt={bounty.speaker.username} />
                    ) : (
                      bounty.speaker.username[0]?.toUpperCase() || 'S'
                    )}
                  </span>
                  <span className="username">{bounty.speaker.username}</span>
                  <span className="role">Speaker</span>
                </div>
                <div className="bounty-sponsor">
                  <span className="avatar">
                    {bounty.sponsor.avatar ? (
                      <img src={bounty.sponsor.avatar} alt={bounty.sponsor.username} />
                    ) : (
                      bounty.sponsor.username[0]?.toUpperCase() || 'U'
                    )}
                  </span>
                  <span className="username">{bounty.sponsor.username}</span>
                  <span className="role">Sponsor</span>
                </div>
                {bounty.claimant && (
                  <div className="bounty-claimant">
                    <span className="avatar">
                      {bounty.claimant.avatar ? (
                        <img src={bounty.claimant.avatar} alt={bounty.claimant.username} />
                      ) : (
                        bounty.claimant.username[0]?.toUpperCase() || 'C'
                      )}
                    </span>
                    <span className="username">{bounty.claimant.username}</span>
                    <span className="role">Claimant</span>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
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
    </PageLayout>
  );
};
