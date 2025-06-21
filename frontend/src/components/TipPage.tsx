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
import { useToast } from '../contexts/ToastContext';
import { LoadingSpinner } from './Loading/LoadingSpinner';
import { useProfile } from '../contexts/ProfileContext';
import { Web3SpeakerProfile } from '../services/web3SocialService';

const VenuePicker = lazy(() =>
  import('./LiveMusic/VenuePicker').then(module => ({
    default: module.VenuePicker,
  }))
);

export const TipPage: React.FC = () => {
  const { allEvents, isLoading: loading, error, loadEvent } = useEvent();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedSpeaker, setSelectedSpeaker] = useState<Web3SpeakerProfile | null>(null);
  const [speakerProfiles, setSpeakerProfiles] = useState<Record<string, Web3SpeakerProfile>>({});
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [showVenuePicker, setShowVenuePicker] = useState(false);
  const [showTippingModal, setShowTippingModal] = useState(false);
  const [showBountyModal, setShowBountyModal] = useState(false);

  const { isConnected, isCorrectNetwork } = useWallet();
  const { showSuccess, showError, showWarning } = useToast();
  const { getProfile, profiles } = useProfile();

  const handleEventSelect = async (event: Event) => {
    setSelectedEvent(event);
    setLoadingProfiles(true);
    // In a real app, you'd get speaker addresses from the event object.
    // For now, we'll use the addresses from the old KNOWN_SPEAKERS array.
    const speakerAddresses = [
      '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', // vitalik.eth
      '0x55A5705453Ee82c742274154136Fce8149597058', // papajams.eth
      '0x49a2c363347935451343a53b7f82b5d1482f8a5c', // greg.eth
      '0x45556447e159BA214A462549E034E5737552903A', // brianjck.eth
    ];

    const fetchedProfiles: Record<string, Web3SpeakerProfile> = {};
    for (const address of speakerAddresses) {
      const profile = await getProfile(address);
      if (profile) {
        fetchedProfiles[address] = profile;
      }
    }
    setSpeakerProfiles(fetchedProfiles);
    setLoadingProfiles(false);
  };

  useEffect(() => {
    loadEvent('');
  }, [loadEvent]);

  const handleSpeakerTip = (speaker: Web3SpeakerProfile) => {
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

  const handleSpeakerBounty = (speaker: Web3SpeakerProfile) => {
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
                  {loadingProfiles ? (
                    <LoadingSpinner text="Loading speaker profiles..." />
                  ) : (
                    <div className="speakers-grid">
                      {Object.values(speakerProfiles).map(profile => (
                        <div
                          key={profile.address}
                          className="speaker-card"
                        >
                          <div className="speaker-info">
                            <div className="speaker-header">
                              <h5>{profile.farcaster?.displayName || profile.ensName || profile.address}</h5>
                            </div>
                            <p className="speaker-bio">{profile.farcaster?.bio}</p>
                          </div>
                          <div className="speaker-actions">
                            <button
                              className={`btn btn-primary ${!isConnected || !isCorrectNetwork ? 'btn-disabled' : ''}`}
                              onClick={() => handleSpeakerTip(profile)}
                              disabled={!isConnected || !isCorrectNetwork}
                            >
                              💰 Tip Speaker
                            </button>
                            <button
                              className={`btn btn-secondary ${!isConnected || !isCorrectNetwork ? 'btn-disabled' : ''}`}
                              onClick={() => handleSpeakerBounty(profile)}
                              disabled={!isConnected || !isCorrectNetwork}
                            >
                              🎯 Bounty
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="live-feed-section">
                  <LiveTipFeed eventId={selectedEvent.id} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showTippingModal && selectedSpeaker && selectedEvent && (
        <TippingModal
          speaker={{
            id: selectedSpeaker.address,
            name: selectedSpeaker.farcaster?.displayName || selectedSpeaker.ensName || selectedSpeaker.address,
            walletAddress: selectedSpeaker.address,
            avatar: selectedSpeaker.farcaster?.pfpUrl,
          }}
          event={selectedEvent}
          onClose={() => setShowTippingModal(false)}
          onSuccess={handleTipSuccess}
          isOpen={showTippingModal}
        />
      )}

      {showBountyModal && selectedSpeaker && selectedEvent && (
        <BountyModal
          speakerId={selectedSpeaker.address}
          speakerName={selectedSpeaker.farcaster?.displayName || selectedSpeaker.ensName || selectedSpeaker.address}
          eventId={selectedEvent.id}
          onClose={() => setShowBountyModal(false)}
          onSuccess={handleBountySuccess}
          isOpen={showBountyModal}
        />
      )}
    </PageLayout>
  );
};
