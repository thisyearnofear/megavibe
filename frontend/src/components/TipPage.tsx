import React, { useState, useEffect, useCallback } from 'react';
import { VenuePicker } from './LiveMusic/VenuePicker';
import { TippingModal } from './LiveMusic/TippingModal';
import { BountyModal } from './LiveMusic/BountyModal';
import { LiveTipFeed } from './LiveMusic/LiveTipFeed';
import { HeaderWalletStatus } from './WalletConnection/HeaderWalletStatus';
import { useWallet } from '../contexts/WalletContext';
import { useLiveTipFeed } from '../hooks/useLiveTipFeed';
import { useBountiesForEvent } from '../hooks/useBountiesForEvent';
import { api } from '../services/api';
import '../styles/TipPage.css';
import { PageLayout } from './Layout/PageLayout';
import { Button } from './UI/Button';
import { Card } from './UI/Card';
import { SkeletonCard } from './Loading/SkeletonCard';
import { PERFORMERS, Performer } from '../data/performers';

interface Venue {
  _id: string;
  name: string;
  address: string;
  description: string;
  isActive: boolean;
  capacity: number;
  preferredGenres: string[];
  currentEvent?: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    speakers: string[];
  };
}

interface Event {
  id: string;
  name: string;
  venue: string;
  startTime: string;
  endTime: string;
  speakers: Performer[];
  description: string;
}

export const TipPage: React.FC = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedSpeaker, setSelectedSpeaker] = useState<Performer | null>(null);
  const [showVenuePicker, setShowVenuePicker] = useState(false);
  const [showTippingModal, setShowTippingModal] = useState(false);
  const [showBountyModal, setShowBountyModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wallet context
  const { isConnected, isCorrectNetwork } = useWallet();

  // Helper to get speakers for a venue (for now, just filter by type)
  const getSpeakersForVenue = (venueName: string): Performer[] => {
    // In the future, filter by events: p.events.includes(venueName)
    return PERFORMERS.filter(p => p.type === 'speaker');
  };

  const loadExperiences = useCallback(async () => {
    try {
      setLoading(true);

      // Load venues from the search endpoint since we have seeded data
      const venuesResponse = await api.get('/api/venues/search');
      const rawVenues = venuesResponse.data.slice(0, 10);

      // Create realistic events based on venue descriptions and add dates
      const venuesWithEvents = rawVenues.map((venue: any, index: number) => {
        // Extract event name from description
        const eventMatch = venue.description.match(/hosting (.+?) -/);
        const eventName = eventMatch ? eventMatch[1] : `${venue.preferredGenres[0]} Conference`;

        // Create realistic dates - some events are happening now, some upcoming
        const isLive = index < 3; // First 3 venues have live events
        const startTime = isLive
          ? new Date(Date.now() - 2 * 60 * 60 * 1000) // Started 2 hours ago
          : new Date(Date.now() + (index * 7 + 1) * 24 * 60 * 60 * 1000); // Future events
        const endTime = new Date(startTime.getTime() + (isLive ? 6 : 3) * 60 * 60 * 1000);

        return {
          ...venue,
          id: venue._id,
          currentEvent: {
            id: `event-${venue._id}`,
            name: eventName,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            speakers: isLive ? ['Live Speaker'] : []
          }
        };
      });

      setVenues(venuesWithEvents);

      // Create detailed events for selected venues
      const detailedEvents: Event[] = venuesWithEvents.map((venue: any) => ({
        id: venue.currentEvent.id,
        name: venue.currentEvent.name,
        venue: venue.name,
        startTime: venue.currentEvent.startTime,
        endTime: venue.currentEvent.endTime,
        description: venue.description.split(' - ')[1] || venue.description,
        speakers: getSpeakersForVenue(venue.name)
      }));

      setEvents(detailedEvents);
    } catch (err) {
      setError('Failed to load experiences');
      console.error('Error loading experiences:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExperiences();
  }, [loadExperiences]);

  const handleVenueSelect = (venue: Venue) => {
    setSelectedVenue(venue);
    setShowVenuePicker(false);

    // Find events for this venue
    const venueEvents = events.filter(event =>
      event.venue.toLowerCase().includes(venue.name.toLowerCase())
    );
    if (venueEvents.length > 0) {
      setSelectedEvent(venueEvents[0]);
    }
  };

  const handleSpeakerTip = (speaker: Performer) => {
    if (!isConnected) {
      // Show wallet connection hint
      setError('Please connect your wallet to send tips');
      return;
    }

    if (!isCorrectNetwork) {
      setError('Please switch to Mantle Sepolia network to send tips');
      return;
    }

    setSelectedSpeaker(speaker);
    setShowTippingModal(true);
  };

  const handleTipSuccess = () => {
    setShowTippingModal(false);
    setSelectedSpeaker(null);
    // Show success message or update UI
  };

  const handleSpeakerBounty = (speaker: Performer) => {
    if (!isConnected) {
      setError('Please connect your wallet to create bounties');
      return;
    }

    if (!isCorrectNetwork) {
      setError('Please switch to Mantle Sepolia network to create bounties');
      return;
    }

    setSelectedSpeaker(speaker);
    setShowBountyModal(true);
  };

  const handleBountySuccess = () => {
    setShowBountyModal(false);
    setSelectedSpeaker(null);
    // Show success message or update UI
  };

  if (loading) {
    return (
      <PageLayout
        title="Live Tipping"
        subtitle="Tip speakers in real-time and support your favorite events."
        
      >
        <div className="tip-content grid">
          {/* Example: Venue picker and live tip feed */}
          <div>
            <Button variant="primary" size="md" onClick={() => setShowVenuePicker(true)}>
              Choose Venue
            </Button>
          </div>
          {/* ...other tip page content, use Card for speaker/event blocks... */}
          {/* Example loading state */}
          {venues.length === 0 && (
            <>
              {[...Array(3)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </>
          )}
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <div className="tip-page">
        <div className="error-container">
          <h2>⚠️ Error Loading Experiences</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadExperiences}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageLayout
      title="Live Tipping"
      subtitle="Tip speakers in real-time and support your favorite events."
      
    >
      <div className="tip-content grid">
        {!selectedVenue ? (
          <div className="venue-selection">
            <div className="selection-card">
              <h2>🏢 Choose an Experience Venue</h2>
              <p>Select a venue to see live experiences and speakers you can tip</p>

                {/* Wallet Connection Prompt for Venue Selection */}
                {!isConnected && (
                  <div className="wallet-connection-prompt">
                    <div className="prompt-content">
                      <span className="prompt-icon">💡</span>
                      <div className="prompt-text">
                        <h4>Connect Your Wallet First</h4>
                        <p>Connect your wallet to send tips to speakers during live experiences</p>
                      </div>
                    </div>
                  </div>
                )}

                {isConnected && !isCorrectNetwork && (
                  <div className="network-switch-prompt">
                    <div className="prompt-content">
                      <span className="prompt-icon">⚠️</span>
                      <div className="prompt-text">
                        <h4>Switch to Mantle Sepolia</h4>
                        <p>You need to be on Mantle Sepolia network to send tips with ultra-low fees</p>
                      </div>
                    </div>
                  </div>
                )}

              <div className="venues-grid">
                {venues.slice(0, 6).map(venue => {
                  const isLive = venue.currentEvent && new Date(venue.currentEvent.startTime) <= new Date() && new Date() <= new Date(venue.currentEvent.endTime);
                  const isUpcoming = venue.currentEvent && new Date(venue.currentEvent.startTime) > new Date();

                  return (
                    <div
                      key={venue._id}
                      className={`venue-card ${isLive ? 'active' : ''}`}
                      onClick={() => handleVenueSelect(venue)}
                    >
                      <div className="venue-header">
                        <h3>{venue.name}</h3>
                        {isLive && (
                          <span className="live-badge">🔴 LIVE</span>
                        )}
                        {isUpcoming && (
                          <span className="upcoming-badge">📅 UPCOMING</span>
                        )}
                      </div>
                      <p className="venue-address">{venue.address}</p>
                      {venue.currentEvent && (
                        <div className="current-event">
                          <strong>{venue.currentEvent.name}</strong>
                          <div className="event-date">
                            {isLive ? (
                              <span className="live-text">Live until {new Date(venue.currentEvent.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            ) : (
                              <span className="upcoming-text">
                                {new Date(venue.currentEvent.startTime).toLocaleDateString()} at {new Date(venue.currentEvent.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                className="btn btn-outline btn-lg"
                onClick={() => setShowVenuePicker(true)}
              >
                📍 Find Venues Near Me
              </button>
            </div>
          </div>
        ) : (
          <div className="event-view">
            <div className="venue-info">
              <h2>📍 {selectedVenue.name}</h2>
              <p>{selectedVenue.address}</p>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setSelectedVenue(null)}
              >
                Change Venue
              </button>
            </div>

            {selectedEvent ? (
              <div className="event-details">
                <div className="event-header">
                  <h3>{selectedEvent.name}</h3>
                  <p>{selectedEvent.description}</p>
                  <div className="event-time">
                    {new Date(selectedEvent.startTime).toLocaleDateString()} -
                    {new Date(selectedEvent.endTime).toLocaleDateString()}
                  </div>
                </div>

                {/* Live Features Section */}
                <div className="live-features-grid">
                  <div className="speakers-section">
                    <h4>🎤 Speakers You Can Tip</h4>
                    <div className="speakers-grid">
                      {selectedEvent.speakers.map(speaker => (
                        <div
                          key={speaker.id}
                          className={`speaker-card ${speaker.isLive ? 'live' : ''}`}
                        >
                          <div className="speaker-info">
                            <div className="speaker-header">
                              <h5>{speaker.name}</h5>
                              {speaker.isLive && (
                                <span className="live-indicator">🔴 LIVE NOW</span>
                              )}
                            </div>
                            <p className="speaker-bio">{speaker.bio}</p>
                          </div>
                          <div className="speaker-actions">
                            <button
                              className={`btn ${speaker.isLive ? 'btn-primary' : 'btn-outline'} ${!isConnected || !isCorrectNetwork ? 'btn-disabled' : ''}`}
                              onClick={() => handleSpeakerTip(speaker)}
                              disabled={!isConnected || !isCorrectNetwork}
                              title={
                                !isConnected
                                  ? 'Connect wallet to tip'
                                  : !isCorrectNetwork
                                  ? 'Switch to Mantle Sepolia to tip'
                                  : ''
                              }
                            >
                              💰 Tip {speaker.isLive ? 'Now' : 'Speaker'}
                            </button>
                            <button
                              className={`btn btn-secondary ${!isConnected || !isCorrectNetwork ? 'btn-disabled' : ''}`}
                              onClick={() => handleSpeakerBounty(speaker)}
                              disabled={!isConnected || !isCorrectNetwork}
                              title={
                                !isConnected
                                  ? 'Connect wallet to create bounty'
                                  : !isCorrectNetwork
                                  ? 'Switch to Mantle Sepolia to create bounty'
                                  : 'Create content bounty'
                              }
                            >
                              🎯 Bounty
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Live Tip Feed */}
                  <div className="live-feed-section">
                    <LiveTipFeed eventId={selectedEvent.id} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-events">
                <h3>No Live Experiences</h3>
                <p>This venue doesn't have any live experiences right now.</p>

                {/* Show wallet status for better UX */}
                {!isConnected && (
                  <div className="wallet-prompt">
                    <p>💡 Connect your wallet to be ready for when experiences go live!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showVenuePicker && (
        <VenuePicker
          onVenueSelect={(pickedVenue) => {
            const venue: Venue = {
              _id: pickedVenue.id,
              name: pickedVenue.name,
              address: pickedVenue.address,
              description: '',
              isActive: pickedVenue.isActive,
              capacity: 1000,
              preferredGenres: ['conference']
            };
            handleVenueSelect(venue);
          }}
          onClose={() => setShowVenuePicker(false)}
        />
      )}

      {showTippingModal && selectedSpeaker && selectedEvent && (
        <TippingModal
          speaker={{
            id: selectedSpeaker.id,
            name: selectedSpeaker.name,
            avatar: selectedSpeaker.avatar,
            walletAddress: selectedSpeaker.wallet, // map wallet to walletAddress
            title: selectedSpeaker.bio // use bio as title for now
          }}
          event={{
            id: selectedEvent.id,
            name: selectedEvent.name
          }}
          isOpen={showTippingModal}
          onClose={() => setShowTippingModal(false)}
          onSuccess={handleTipSuccess}
        />
      )}

      {showBountyModal && selectedSpeaker && selectedEvent && (
        <BountyModal
          eventId={selectedEvent.id}
          speakerId={selectedSpeaker.id}
          speakerName={selectedSpeaker.name}
          isOpen={showBountyModal}
          onClose={() => setShowBountyModal(false)}
          onSuccess={handleBountySuccess}
        />
      )}
    </PageLayout>
  );
};
