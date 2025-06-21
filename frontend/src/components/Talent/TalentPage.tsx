import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Web3SpeakerCard } from './Web3SpeakerCard';
import { CrossPlatformNav } from '../Navigation/CrossPlatformNav';
import { PageLayout } from '../Layout/PageLayout';
import { Button } from '../UI/Button';
import { Card } from '../UI/Card';
import { LoadingSpinner } from '../Loading/LoadingSpinner';
import { useWallet } from '../../contexts/WalletContext';
import { useToast } from '../../contexts/ToastContext';
import contractService from '../../services/contractService';
import { web3SocialService } from '../../services/web3SocialService';
import { hybridSpeakerService } from '../../services/hybridSpeakerService';
import './TalentPage.css';

// Known speaker addresses with verified Farcaster profiles
const KNOWN_SPEAKERS = [
  '0xd7029bdea1c17493893aafe29aad69ef892b8ff2', // dwr.eth (Dan Romero)
  '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', // vitalik.eth
  '0x55A5705453Ee82c742274154136Fce8149597058', // papajams.eth (user)
  '0x8f86b3a73D38af0c6700b3bEeCE7b7487222b949', // kellykim.eth
];

interface TalentPageProps {
  onNavigateToTip?: (speakerAddress: string) => void;
  onNavigateToBounty?: (speakerAddress: string) => void;
}

export const TalentPage: React.FC<TalentPageProps> = ({
  onNavigateToTip,
  onNavigateToBounty
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isConnected, isCorrectNetwork } = useWallet();
  const { showSuccess, showError, showWarning } = useToast();

  const [speakers, setSpeakers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'reputation' | 'tips' | 'social' | 'recent'>('reputation');
  const [filterBy, setFilterBy] = useState<'all' | 'farcaster' | 'verified'>('all');

  // Get context from URL params
  const eventId = searchParams.get('event');
  const focusedSpeaker = searchParams.get('speaker');

  useEffect(() => {
    loadSpeakers();
  }, [eventId, isConnected, isCorrectNetwork]);

  const loadSpeakers = async () => {
    try {
      setLoading(true);

      let speakerAddresses: string[] = [];

      if (isConnected && isCorrectNetwork && eventId) {
        // Try to get speakers from event contract (if we have this functionality)
        try {
          // const eventSpeakers = await contractService.getSpeakersForEvent(eventId);
          // speakerAddresses = eventSpeakers;

          // For now, use known speakers
          speakerAddresses = KNOWN_SPEAKERS;
        } catch (error) {
          console.warn('Failed to load speakers from contract, using defaults');
          speakerAddresses = KNOWN_SPEAKERS;
        }
      } else {
        // Use known speakers for demo
        speakerAddresses = KNOWN_SPEAKERS;
      }

      setSpeakers(speakerAddresses);
    } catch (error) {
      console.error('Failed to load speakers:', error);
      showError('Loading Error', 'Failed to load speaker profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleTipSpeaker = (speakerAddress: string) => {
    if (!isConnected) {
      showWarning('Wallet Required', 'Please connect your wallet to send tips');
      return;
    }

    if (!isCorrectNetwork) {
      showWarning('Wrong Network', 'Please switch to Mantle Sepolia network to send tips');
      return;
    }

    // Navigate to tip page with context
    const params = new URLSearchParams();
    params.set('speaker', speakerAddress);
    if (eventId) params.set('event', eventId);

    navigate(`/tip?${params.toString()}`);
    onNavigateToTip?.(speakerAddress);
  };

  const handleCreateBounty = (speakerAddress: string) => {
    if (!isConnected) {
      showWarning('Wallet Required', 'Please connect your wallet to create bounties');
      return;
    }

    if (!isCorrectNetwork) {
      showWarning('Wrong Network', 'Please switch to Mantle Sepolia network to create bounties');
      return;
    }

    // Navigate to bounties page with creation mode
    const params = new URLSearchParams();
    params.set('speaker', speakerAddress);
    params.set('create', 'true');
    if (eventId) params.set('event', eventId);

    navigate(`/bounties?${params.toString()}`);
    onNavigateToBounty?.(speakerAddress);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      // Search for speakers using hybrid system (Farcaster + curated)
      const searchResults = await hybridSpeakerService.searchSpeakers(searchQuery);

      if (searchResults.length > 0) {
        // Extract addresses from search results
        const addresses = searchResults.map(result => result.address);
        setSpeakers(addresses);
        showSuccess('Search Results', `Found ${searchResults.length} matching profiles`);
      } else {
        showWarning('No Results', 'No Farcaster profiles found matching your search');
      }
    } catch (error) {
      console.error('Search failed:', error);
      showError('Search Error', 'Failed to search for profiles');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageLayout
        title="Talent Network"
        subtitle="Discover speakers, creators, and thought leaders with verified Web3 identities"
      >
        <div className="talent-page">
          <div className="talent-layout">
            <div className="talent-sidebar">
              <CrossPlatformNav eventId={eventId || undefined} />
            </div>
            <div className="talent-main">
              <LoadingSpinner text="Loading Web3 profiles..." />
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Talent Network"
      subtitle="Discover speakers, creators, and thought leaders with verified Web3 identities"
    >
      <div className="talent-page">
        <div className="talent-layout">
          {/* Sidebar Navigation */}
          <div className="talent-sidebar">
            <CrossPlatformNav
              eventId={eventId || undefined}
              speakerAddress={focusedSpeaker || undefined}
            />
          </div>

          {/* Main Content */}
          <div className="talent-main">
            {/* Header Controls */}
            <div className="talent-header">
              <div className="talent-controls">
                {/* Search */}
                <form onSubmit={handleSearchSubmit} className="search-form">
                  <input
                    type="text"
                    placeholder="Search by ENS, @username, or address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                  <Button type="submit" variant="outline" size="sm">
                    🔍
                  </Button>
                </form>

                {/* Filters */}
                <div className="filter-controls">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="filter-select"
                  >
                    <option value="reputation">Sort: Reputation</option>
                    <option value="tips">Sort: Tips Received</option>
                    <option value="social">Sort: Social Following</option>
                    <option value="recent">Sort: Recent Activity</option>
                  </select>

                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value as any)}
                    className="filter-select"
                  >
                    <option value="all">All Profiles</option>
                    <option value="farcaster">Farcaster Users</option>
                    <option value="verified">Verified Only</option>
                  </select>
                </div>
              </div>

              {/* Event Context */}
              {eventId && (
                <div className="event-context">
                  <h3>🎪 Event Speakers</h3>
                  <p>Speakers participating in this event</p>
                </div>
              )}

              {/* On-Chain Status */}
              {!isConnected && (
                <Card className="connection-prompt">
                  <div className="prompt-content">
                    <span className="prompt-icon">💡</span>
                    <div className="prompt-text">
                      <h4>Connect Wallet for Full Experience</h4>
                      <p>See real on-chain data, reputation scores, and tip speakers directly</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Speakers Grid */}
            <div className="speakers-grid">
              {speakers.map((speakerAddress, index) => (
                <Web3SpeakerCard
                  key={speakerAddress}
                  address={speakerAddress}
                  eventId={eventId || undefined}
                  onTip={handleTipSpeaker}
                  onBounty={handleCreateBounty}
                  layout="card"
                />
              ))}
            </div>

            {/* Empty State */}
            {speakers.length === 0 && (
              <div className="empty-state">
                <h3>🔍 No Speakers Found</h3>
                <p>Try adjusting your search or filters</p>
                <Button
                  variant="primary"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterBy('all');
                    loadSpeakers();
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            )}

            {/* Integration CTA */}
            <Card className="integration-cta">
              <h3>🌐 Complete Web3 Integration</h3>
              <p>This talent network seamlessly connects to:</p>
              <div className="integration-features">
                <div className="feature">
                  <span className="feature-icon">💰</span>
                  <strong>Live Tipping:</strong> Send real-time tips on Mantle
                </div>
                <div className="feature">
                  <span className="feature-icon">🎯</span>
                  <strong>Bounty Creation:</strong> Incentivize content creation
                </div>
                <div className="feature">
                  <span className="feature-icon">🧠</span>
                  <strong>Knowledge Graph:</strong> Track knowledge creation impact
                </div>
                <div className="feature">
                  <span className="feature-icon">📱</span>
                  <strong>Social Verification:</strong> Farcaster integration
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default TalentPage;
