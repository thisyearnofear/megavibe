import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet } from '../../contexts/WalletContext';
import { useEvent } from '../../contexts/EventContext';
import { useToast } from '../../contexts/ToastContext';
import { PageLayout } from '../Layout/PageLayout';
import { LoadingSpinner } from '../Loading/LoadingSpinner';
import { EventSelector } from './EventSelector';
import { SpeakerGrid } from './SpeakerGrid';
import { QuickTipModal } from './QuickTipModal';
import { EventStates } from './EventStates';
import { TipFeedSidebar } from './TipFeedSidebar';
import './OptimizedTipPage.css';

interface OptimizedTipPageProps {
  // Optional props for customization
  showFeed?: boolean;
  compact?: boolean;
}

export const OptimizedTipPage: React.FC<OptimizedTipPageProps> = ({
  showFeed = true,
  compact = false
}) => {
  // Core state
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string | null>(null);
  const [showTipModal, setShowTipModal] = useState(false);
  const [quickTipAmount, setQuickTipAmount] = useState<number>(10);

  // Contexts
  const { isConnected, isCorrectNetwork, chainId } = useWallet();
  const { allEvents, isLoading, error, getEventById, getSpeakersByEvent } = useEvent();
  const { showSuccess, showError, showWarning } = useToast();

  // Memoized data
  const selectedEvent = useMemo(() => 
    selectedEventId ? getEventById(selectedEventId) : null,
    [selectedEventId, getEventById]
  );

  const speakers = useMemo(() => 
    selectedEventId ? getSpeakersByEvent(selectedEventId) : [],
    [selectedEventId, getSpeakersByEvent]
  );

  const selectedSpeaker = useMemo(() => 
    selectedSpeakerId ? speakers.find(s => s.id === selectedSpeakerId) : null,
    [selectedSpeakerId, speakers]
  );

  // Event state detection
  const eventState = useMemo(() => {
    if (!selectedEvent) return 'no-event';
    
    const now = new Date();
    const eventStart = new Date(selectedEvent.startTime);
    const eventEnd = new Date(selectedEvent.endTime);
    
    if (now < eventStart) return 'pre-event';
    if (now > eventEnd) return 'post-event';
    return 'live';
  }, [selectedEvent]);

  // Handlers
  const handleEventSelect = useCallback((eventId: string) => {
    setSelectedEventId(eventId);
    setSelectedSpeakerId(null); // Reset speaker selection
  }, []);

  const handleSpeakerSelect = useCallback((speakerId: string) => {
    if (!isConnected) {
      showWarning('Connect Wallet', 'Please connect your wallet to tip speakers');
      return;
    }

    if (!isCorrectNetwork) {
      showWarning('Wrong Network', 'Please switch to the correct network');
      return;
    }

    setSelectedSpeakerId(speakerId);
    setShowTipModal(true);
  }, [isConnected, isCorrectNetwork, showWarning]);

  const handleQuickTip = useCallback((speakerId: string, amount: number) => {
    setSelectedSpeakerId(speakerId);
    setQuickTipAmount(amount);
    setShowTipModal(true);
  }, []);

  const handleTipSuccess = useCallback(() => {
    setShowTipModal(false);
    setSelectedSpeakerId(null);
    showSuccess('Tip Sent!', 'Your tip has been successfully sent');
  }, [showSuccess]);

  const handleTipError = useCallback((error: string) => {
    showError('Tip Failed', error);
  }, [showError]);

  // Loading state
  if (isLoading) {
    return (
      <PageLayout
        title="Live Tipping"
        subtitle="Loading events..."
        compact={compact}
      >
        <div className="tip-page-loading">
          <LoadingSpinner size="lg" text="Loading events and speakers..." />
        </div>
      </PageLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <PageLayout
        title="Live Tipping"
        subtitle="Something went wrong"
        compact={compact}
      >
        <div className="tip-page-error">
          <div className="error-content">
            <h3>⚠️ Unable to Load Events</h3>
            <p>{error}</p>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Live Tipping"
      subtitle="Support speakers in real-time with crypto tips"
      compact={compact}
    >
      <div className={`optimized-tip-page ${compact ? 'compact' : ''}`}>
        
        {/* Event Selection */}
        {!selectedEventId && (
          <EventSelector
            events={allEvents}
            onEventSelect={handleEventSelect}
            isConnected={isConnected}
          />
        )}

        {/* Selected Event View */}
        {selectedEventId && selectedEvent && (
          <div className="event-view">
            
            {/* Event Header */}
            <div className="event-header">
              <div className="event-info">
                <h2>{selectedEvent.name}</h2>
                <p className="event-venue">{selectedEvent.venue}</p>
                <div className="event-meta">
                  <span className={`event-status ${eventState}`}>
                    {eventState === 'live' && '🔴 LIVE NOW'}
                    {eventState === 'pre-event' && '⏰ Upcoming'}
                    {eventState === 'post-event' && '✅ Completed'}
                  </span>
                  <span className="event-date">{selectedEvent.date}</span>
                </div>
              </div>
              <button
                className="btn btn-outline btn-sm change-event-btn"
                onClick={() => setSelectedEventId(null)}
              >
                Change Event
              </button>
            </div>

            {/* Main Content */}
            <div className={`event-content ${showFeed ? 'with-sidebar' : ''}`}>
              
              {/* Primary Content */}
              <div className="primary-content">
                {eventState === 'live' && (
                  <SpeakerGrid
                    speakers={speakers}
                    onSpeakerSelect={handleSpeakerSelect}
                    onQuickTip={handleQuickTip}
                    isConnected={isConnected}
                    isCorrectNetwork={isCorrectNetwork}
                    eventState={eventState}
                  />
                )}

                {eventState !== 'live' && (
                  <EventStates
                    eventState={eventState}
                    event={selectedEvent}
                    speakers={speakers}
                    onNotifyMe={() => {
                      showSuccess('Notifications Set', 'We\'ll notify you when the event starts');
                    }}
                    onViewRecording={() => {
                      // Handle recording view
                    }}
                  />
                )}
              </div>

              {/* Sidebar */}
              {showFeed && selectedEventId && (
                <TipFeedSidebar
                  eventId={selectedEventId}
                  compact={compact}
                />
              )}
            </div>
          </div>
        )}

        {/* Quick Tip Modal */}
        {showTipModal && selectedSpeaker && selectedEvent && (
          <QuickTipModal
            speaker={selectedSpeaker}
            event={selectedEvent}
            initialAmount={quickTipAmount}
            isOpen={showTipModal}
            onClose={() => setShowTipModal(false)}
            onSuccess={handleTipSuccess}
            onError={handleTipError}
          />
        )}
      </div>
    </PageLayout>
  );
};

export default OptimizedTipPage;