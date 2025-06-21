import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { TippingModal } from './LiveMusic/TippingModal';
import { BountyModal } from './LiveMusic/BountyModal';
import { LiveTipFeed } from './LiveMusic/LiveTipFeed';
import { useWallet } from '../contexts/WalletContext';
import { useEvent, Event, Speaker } from '../contexts/EventContext';
import '../styles/TipPage.css';
import { PageLayout } from './Layout/PageLayout';
import { Button } from './UI/Button';
import { SkeletonGrid } from './Loading/SkeletonCard';
import { PERFORMERS, Performer } from '../data/performers';
import { useToast } from '../contexts/ToastContext';
import { LoadingSpinner } from './Loading/LoadingSpinner';

const VenuePicker = lazy(() =>
  import('./LiveMusic/VenuePicker').then(module => ({
    default: module.VenuePicker,
  }))
);

export const TipPage: React.FC = () => {
  const { allEvents, isLoading: loading, error, loadEvent } = useEvent();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedSpeaker, setSelectedSpeaker] = useState<Performer | null>(null);
  const [showVenuePicker, setShowVenuePicker] = useState(false);
  const [showTippingModal, setShowTippingModal] = useState(false);
  const [showBountyModal, setShowBountyModal] = useState(false);

  const { isConnected, isCorrectNetwork } = useWallet();
  const { showSuccess, showError, showWarning } = useToast();

  const getSpeakersForEvent = (event: Event): Performer[] => {
    // This is a placeholder. In a real app, you'd fetch speakers for the event.
    return PERFORMERS.filter(p => p.type === 'speaker');
  };

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
    const speakers = getSpeakersForEvent(event);
    event.speakers = speakers;
  };

  useEffect(() => {
    loadEvent('');
  }, [loadEvent]);

  const handleSpeakerTip = (speaker: Performer) => {
    if (!isConnected) {
      showWarning('Wallet Required', 'Please connect your wallet to send tips');
      return;
    }

    if (!isCorrectNetwork) {
      showWarning('Wrong Network', 'Please switch to Mantle Sepolia network to send tips');
      return;
    }

    setSelectedSpeaker(speaker);
    setShowTippingModal(true);
  };

  const handleTipSuccess = () => {
    setShowTippingModal(false);
    setSelectedSpeaker(null);
    showSuccess('Tip Sent!', 'Your tip has been successfully sent to the speaker');
  };

  const handleSpeakerBounty = (speaker: Performer) => {
    if (!isConnected) {
      showWarning('Wallet Required', 'Please connect your wallet to create bounties');
      return;
    }

    if (!isCorrectNetwork) {
      showWarning('Wrong Network', 'Please switch to Mantle Sepolia network to create bounties');
      return;
    }

    setSelectedSpeaker(speaker);
    setShowBountyModal(true);
  };

  const handleBountySuccess = () => {
    setShowBountyModal(false);
    setSelectedSpeaker(null);
    showSuccess('Bounty Created!', 'Your bounty has been successfully created');
  };

  if (loading) {
    return (
      <PageLayout
        title="Live Tipping"
        subtitle="Tip in real-time, shape your experience, support incredible talent."
      >
        <div className="tip-content grid">
          <SkeletonGrid count={6} variant="venue" />
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
        </div>
      </div>
    );
  }

  return (
    <PageLayout
      title="Live Tipping"
      subtitle="Tip in real-time, shape your experience, support incredible talent."
    >
      <div className="tip-content grid">
        {!selectedEvent ? (
          <div className="venue-selection">
            <div className="selection-card">
              <h2>🎤 Choose an Event</h2>
              <p>Select an event to see the speakers you can tip.</p>
              <div className="venues-grid">
                {allEvents.map(event => (
                  <div
                    key={event.id}
                    className={`venue-card ${event.status === 'live' ? 'active' : ''}`}
                    onClick={() => handleEventSelect(event)}
                  >
                    <div className="venue-header">
                      <h3>{event.name}</h3>
                      {event.status === 'live' && (
                        <span className="live-badge">🔴 LIVE</span>
                      )}
                    </div>
                    <p className="venue-address">{event.venue}</p>
                    <div className="current-event">
                      <strong>{event.name}</strong>
                      <div className="event-date">
                        <span className="upcoming-text">{event.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="event-view">
            <div className="venue-info">
              <h2>📍 {selectedEvent.name}</h2>
              <p>{selectedEvent.venue}</p>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setSelectedEvent(null)}
              >
                Change Event
              </button>
            </div>
            <div className="event-details">
              <div className="event-header">
                <h3>{selectedEvent.name}</h3>
                <p>{selectedEvent.description}</p>
                <div className="event-time">{selectedEvent.date}</div>
              </div>
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
                          >
                            💰 Tip {speaker.isLive ? 'Now' : 'Speaker'}
                          </button>
                          <button
                            className={`btn btn-secondary ${!isConnected || !isCorrectNetwork ? 'btn-disabled' : ''}`}
                            onClick={() => handleSpeakerBounty(speaker)}
                            disabled={!isConnected || !isCorrectNetwork}
                          >
                            🎯 Bounty
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="live-feed-section">
                  <LiveTipFeed eventId={selectedEvent.id} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};
