import React, { useState, useEffect } from 'react';
import { VenuePicker } from './LiveMusic/VenuePicker';
import { TippingModal } from './LiveMusic/TippingModal';
import { api } from '../services/api';
import '../styles/TipPage.css';

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
  speakers: Speaker[];
  description: string;
}

interface Speaker {
  id: string;
  name: string;
  bio: string;
  profilePicture?: string;
  currentTalk?: string;
  isLive: boolean;
}

export const TipPage: React.FC = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);
  const [showVenuePicker, setShowVenuePicker] = useState(false);
  const [showTippingModal, setShowTippingModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadExperiences();
  }, []);

  const createSpeakersForEvent = (venueName: string, genres: string[]): Speaker[] => {
    // Speaker pool that can be expanded for different event types
    const speakerPool = [
      // Web3/Blockchain speakers
      { name: 'Vitalik Buterin', bio: 'Ethereum Co-founder', talks: ['The Future of Ethereum Scaling', 'Ethereum Roadmap 2025'], categories: ['Web3', 'Blockchain', 'Ethereum'] },
      { name: 'Hayden Adams', bio: 'Uniswap Founder', talks: ['DeFi Innovation', 'Automated Market Makers'], categories: ['DeFi', 'Web3'] },
      { name: 'Changpeng Zhao', bio: 'Former Binance CEO', talks: ['Building Global Infrastructure', 'Exchange Evolution'], categories: ['Web3', 'Global Adoption'] },
      { name: 'Brian Armstrong', bio: 'Coinbase CEO', talks: ['Digital Asset Adoption', 'Regulatory Landscape'], categories: ['Global Adoption', 'Innovation'] },
      { name: 'Andre Cronje', bio: 'DeFi Architect', talks: ['Yield Farming Revolution', 'Protocol Design'], categories: ['DeFi', 'Developers'] },
      { name: 'Stani Kulechov', bio: 'Aave Founder', talks: ['Lending Protocols', 'DeFi Composability'], categories: ['DeFi', 'Innovation'] },
      { name: 'Sergey Nazarov', bio: 'Chainlink Co-founder', talks: ['Oracle Networks', 'Smart Contract Connectivity'], categories: ['Developers', 'Innovation'] },
      { name: 'Balaji Srinivasan', bio: 'Former Coinbase CTO', talks: ['Network States', 'Digital Cities'], categories: ['Innovation', 'Future Tech'] }
    ];

    // Select 2-3 speakers randomly
    const selectedSpeakers = speakerPool.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 2) + 2);

    return selectedSpeakers.map((speaker, index) => ({
      id: `${speaker.name.toLowerCase().replace(/\s+/g, '-')}-${venueName}`,
      name: speaker.name,
      bio: speaker.bio,
      isLive: index === 0, // First speaker is live
      currentTalk: speaker.talks[Math.floor(Math.random() * speaker.talks.length)]
    }));
  };

  const loadExperiences = async () => {
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
        speakers: createSpeakersForEvent(venue.name, venue.preferredGenres)
      }));

      setEvents(detailedEvents);
    } catch (err) {
      setError('Failed to load experiences');
      console.error('Error loading experiences:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSpeakerTip = (speaker: Speaker) => {
    setSelectedSpeaker(speaker);
    setShowTippingModal(true);
  };

  const handleTipSuccess = () => {
    setShowTippingModal(false);
    setSelectedSpeaker(null);
    // Show success message or update UI
  };

  if (loading) {
    return (
      <div className="tip-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading experiences...</p>
        </div>
      </div>
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
    <div className="tip-page">
      <header className="tip-header">
        <div className="header-content">
          <button 
            className="back-btn"
            onClick={() => window.location.href = '/'}
          >
            ← Back to MegaVibe
          </button>
          <div className="header-title">
            <h1>💰 Live Event Tipping</h1>
            <p>Tip speakers in real-time during experiences</p>
          </div>
        </div>
      </header>

      <main className="tip-main">
        {!selectedVenue ? (
          <div className="venue-selection">
            <div className="selection-card">
              <h2>🏢 Choose an Experience Venue</h2>
              <p>Select a venue to see live experiences and speakers you can tip</p>
              
              <div className="venues-grid">
                {venues.slice(0, 6).map(venue => {
                  const isLive = venue.currentEvent && new Date(venue.currentEvent.startTime) <= new Date() && new Date() <= new Date(venue.currentEvent.endTime);
                  const isUpcoming = venue.currentEvent && new Date(venue.currentEvent.startTime) > new Date();

                  return (
                    <div
                      key={venue.id}
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
                          {speaker.currentTalk && (
                            <p className="current-talk">
                              <strong>Current Talk:</strong> {speaker.currentTalk}
                            </p>
                          )}
                        </div>
                        <button 
                          className={`btn ${speaker.isLive ? 'btn-primary' : 'btn-outline'}`}
                          onClick={() => handleSpeakerTip(speaker)}
                        >
                          💰 Tip {speaker.isLive ? 'Now' : 'Speaker'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-events">
                <h3>No Live Experiences</h3>
                <p>This venue doesn't have any live experiences right now.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {showVenuePicker && (
        <VenuePicker
          onVenueSelect={handleVenueSelect}
          onClose={() => setShowVenuePicker(false)}
        />
      )}

      {showTippingModal && selectedSpeaker && selectedEvent && (
        <TippingModal
          song={{
            id: selectedSpeaker.id,
            title: selectedSpeaker.currentTalk || 'Speaker Tip',
            artistId: selectedSpeaker.id,
            artistName: selectedSpeaker.name
          }}
          venueId={selectedVenue?.id || ''}
          onClose={() => setShowTippingModal(false)}
          onSuccess={handleTipSuccess}
        />
      )}
    </div>
  );
};
