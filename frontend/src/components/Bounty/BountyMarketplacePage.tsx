import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import { useBountiesForEvent } from '../../hooks/useBountiesForEvent';
import { useBountyFilter } from '../../hooks/useBountyFilter';
import { PageLayout } from '../Layout/PageLayout';
import { Button } from '../UI/Button';
import { Card } from '../UI/Card';
import { SkeletonCard } from '../Loading/SkeletonCard';
import { BountyModal } from '../LiveMusic/BountyModal';
import { ClaimBountyModal } from './ClaimBountyModal';
import { useWallet } from '../../contexts/WalletContext';
import { useEvent } from '../../contexts/EventContext';
import './BountyMarketplacePage.css';

export const BountyMarketplacePage: React.FC = () => {
  const { currentEvent, speakers, loadEvent } = useEvent();
  const { isConnected } = useWallet();
  
  const eventId = currentEvent?.id || 'devcon-7-bangkok';

  const { bounties, stats, isLoading, error, refreshBounties } = useBountiesForEvent(eventId);
  const { filtered: filteredBounties } = useBountyFilter(bounties);

  const [showCreateBounty, setShowCreateBounty] = useState(false);
  const [showClaimBounty, setShowClaimBounty] = useState(false);
  const [selectedBountyId, setSelectedBountyId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentEvent || currentEvent.id !== eventId) {
      loadEvent(eventId);
    }
  }, [eventId, currentEvent, loadEvent]);

  const handleCreateBountySuccess = () => {
    setShowCreateBounty(false);
    refreshBounties();
  };

  const handleClaimBountySuccess = () => {
    setShowClaimBounty(false);
    refreshBounties();
  };

  const openClaimModal = (bountyId: string) => {
    setSelectedBountyId(bountyId);
    setShowClaimBounty(true);
  };

  const renderLoadingState = () => (
    <div className="bounty-list">
      {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );

  const renderErrorState = () => (
    <div className="error-container">
      <h2>⚠️ Error Loading Bounties</h2>
      <p>{error}</p>
      <Button onClick={refreshBounties}>Retry</Button>
    </div>
  );

  const renderBountyCard = (bounty: any) => (
    <Card key={bounty.id} className="bounty-card">
      <div className="bounty-header">
        <div className="bounty-reward">
          <span className="reward-amount">{bounty.amount} MNT</span>
        </div>
        <span className={`bounty-status badge-${bounty.status}`}>{bounty.status}</span>
      </div>
      <div className="bounty-description">
        <p>{bounty.description}</p>
      </div>
      <div className="bounty-meta">
        <div className="bounty-sponsor">
          <span className="role">Sponsor</span>
          <span className="username">{`${bounty.creator.slice(0, 6)}...${bounty.creator.slice(-4)}`}</span>
        </div>
        {bounty.claimer && bounty.claimer !== '0x0000000000000000000000000000000000000000' && (
          <div className="bounty-claimant">
            <span className="role">Claimant</span>
            <span className="username">{`${bounty.claimer.slice(0, 6)}...${bounty.claimer.slice(-4)}`}</span>
          </div>
        )}
         <div className="bounty-deadline">
          <span>Expires: {new Date(bounty.deadline).toLocaleString()}</span>
        </div>
      </div>
      <div className="bounty-actions">
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => openClaimModal(bounty.id)}
          disabled={!isConnected}
        >
          Submit for Bounty
        </Button>
        <Link to={`/bounties/${bounty.id}/submissions`}>
          <Button variant="primary" size="sm">
            View Submissions
          </Button>
        </Link>
      </div>
    </Card>
  );

  return (
    <PageLayout
      title="On-Chain Bounty Marketplace"
      subtitle="Discover, create, and claim bounties."
    >
      <div className="marketplace-header">
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-value">{stats.activeBounties}</span>
            <span className="stat-label">Active Bounties</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.totalReward.toFixed(2)} MNT</span>
            <span className="stat-label">Total Rewards</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.claimedBounties}</span>
            <span className="stat-label">Claimed</span>
          </div>
        </div>
        <div className="header-actions">
          <Button onClick={() => setShowCreateBounty(true)} disabled={!isConnected}>
            Create Bounty
          </Button>
        </div>
      </div>

      {isLoading && renderLoadingState()}
      {!isLoading && error && renderErrorState()}
      {!isLoading && !error && (
        <div className="bounty-list">
          {filteredBounties.length > 0 ? (
            filteredBounties.map(renderBountyCard)
          ) : (
            <div className="empty-state">
              <h3>No Bounties Found</h3>
              <p>Be the first to create a bounty for this event!</p>
            </div>
          )}
        </div>
      )}

      {showCreateBounty && currentEvent && (
        <BountyModal
          eventId={currentEvent.id}
          speakerId={speakers?.[0]?.id || 'general'}
          speakerName={speakers?.[0]?.name || 'General'}
          onClose={() => setShowCreateBounty(false)}
          onSuccess={handleCreateBountySuccess}
          isOpen={showCreateBounty}
        />
      )}

      {showClaimBounty && selectedBountyId && (
        <ClaimBountyModal
          bountyId={selectedBountyId}
          onClose={() => setShowClaimBounty(false)}
          onSuccess={handleClaimBountySuccess}
          isOpen={showClaimBounty}
        />
      )}
    </PageLayout>
  );
};
