import React, { useState, useEffect, useCallback } from 'react';
import { locationService, Coordinates } from '../../services/locationService';
import { api } from '../../services/api';
import { realtimeService } from '../../services/realtimeService';
import './ConnectionHub.css';

interface Venue {
  id: string;
  name: string;
  address: string;
  distance: number;
  confidence: number;
  currentEvents: Event[];
  attendeeCount: number;
  hasLiveEvent: boolean;
}

interface Event {
  id: string;
  name: string;
  startTime: Date;
  endTime: Date;
  speakers: Speaker[];
  description: string;
  type: string;
}

interface Speaker {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatar: string;
  expertise: string[];
  socialProof: {
    reputation: number;
    pastEvents: number;
    followers: number;
  };
}

interface Attendee {
  id: string;
  displayName: string;
  avatar: string;
  status: string;
  activity: string;
  expertise: string[];
  interests: string[];
  reputation: {
    level: string;
    score: number;
    badges: string[];
  };
  distance: number;
  isVisible: boolean;
}

interface ConnectionHubProps {
  userId: string;
  onVenueDetected?: (venue: Venue) => void;
  onConnectionMade?: (attendee: Attendee) => void;
}

export const ConnectionHub: React.FC<ConnectionHubProps> = ({
  userId,
  onVenueDetected,
  onConnectionMade
}) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [currentVenue, setCurrentVenue] = useState<Venue | null>(null);
  const [detectionTime, setDetectionTime] = useState<number>(0);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [currentSpeakers, setCurrentSpeakers] = useState<Speaker[]>([]);
  const [sessionContext, setSessionContext] = useState<any>(null);
  const [expertiseMatches, setExpertiseMatches] = useState<Attendee[]>([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'detecting' | 'connected' | 'error' | 'idle'>('idle');

  // Enhanced venue detection with <3 second target
  const detectVenue = useCallback(async () => {
    if (isDetecting) return;
    
    setIsDetecting(true);
    setConnectionStatus('detecting');
    const startTime = Date.now();

    try {
      // Get high-accuracy GPS position
      const coordinates = await locationService.getCurrentPosition();
      
      // Call enhanced detection API
      const response = await api.post('/api/connection/detect-venue', {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        accuracy: 10, // Request high accuracy
        userId
      });

      const detectionTime = Date.now() - startTime;
      setDetectionTime(detectionTime);

      if (response.data.venue) {
        const venue = response.data.venue;
        setCurrentVenue(venue);
        setConnectionStatus('connected');
        
        // Auto check-in if confidence is high
        if (response.data.canAutoConnect && response.data.confidence > 0.8) {
          await autoCheckIn(venue, coordinates);
        }

        onVenueDetected?.(venue);
        
        // Load session context immediately
        await loadSessionContext(venue.id);
      } else {
        setConnectionStatus('error');
      }

    } catch (error) {
      console.error('Venue detection failed:', error);
      setConnectionStatus('error');
    } finally {
      setIsDetecting(false);
    }
  }, [isDetecting, userId, onVenueDetected]);

  // Auto check-in for seamless experience
  const autoCheckIn = async (venue: Venue, coordinates: Coordinates) => {
    try {
      const response = await api.post('/api/connection/checkin', {
        userId,
        venueId: venue.id,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        discoveryProfile: {
          displayName: 'Anonymous User', // Will be updated from user profile
          isVisible: true,
          status: 'Available',
          interests: [],
          expertise: []
        }
      });

      if (response.data.attendee) {
        setIsCheckedIn(true);
        
        // Load attendees and start real-time updates
        await discoverAttendees(venue.id);
        subscribeToVenueUpdates(venue.id);
      }

    } catch (error) {
      console.error('Auto check-in failed:', error);
    }
  };

  // Discover attendees with expertise matching
  const discoverAttendees = async (venueId: string) => {
    try {
      const response = await api.get('/api/connection/discover-attendees', {
        params: { venueId, userId }
      });

      const allAttendees = response.data.attendees.all || [];
      setAttendees(allAttendees);

      // Find expertise matches
      const matches = findExpertiseMatches(allAttendees);
      setExpertiseMatches(matches);

    } catch (error) {
      console.error('Failed to discover attendees:', error);
    }
  };

  // Load session context (speakers, events, etc.)
  const loadSessionContext = async (venueId: string) => {
    try {
      const response = await api.get('/api/connection/session-context', {
        params: { venueId }
      });

      const context = response.data.context;
      setSessionContext(context);
      
      // Extract current speakers
      const speakers: Speaker[] = [];
      context.currentEvents?.forEach((event: Event) => {
        if (event.speakers) {
          speakers.push(...event.speakers);
        }
      });
      setCurrentSpeakers(speakers);

    } catch (error) {
      console.error('Failed to load session context:', error);
    }
  };

  // Find expertise matches among attendees
  const findExpertiseMatches = (attendees: Attendee[]): Attendee[] => {
    // This would use user's interests/expertise to find matches
    // For now, return top-rated attendees
    return attendees
      .filter(a => a.reputation.score > 50)
      .sort((a, b) => b.reputation.score - a.reputation.score)
      .slice(0, 5);
  };

  // Subscribe to real-time venue updates
  const subscribeToVenueUpdates = (venueId: string) => {
    realtimeService.joinVenue(venueId);
    
    realtimeService.on('USER_CHECKED_IN', (data) => {
      // Add new attendee to list
      discoverAttendees(venueId);
    });

    realtimeService.on('USER_CHECKED_OUT', (data) => {
      // Remove attendee from list
      setAttendees(prev => prev.filter(a => a.id !== data.userId));
    });

    realtimeService.on('ACTIVITY_UPDATE', (data) => {
      // Update attendee activity
      setAttendees(prev => prev.map(a => 
        a.id === data.userId ? { ...a, activity: data.activity } : a
      ));
    });
  };

  // Connect with another attendee
  const connectWithAttendee = async (targetAttendee: Attendee) => {
    if (!currentVenue) return;

    try {
      const response = await api.post('/api/connection/connect', {
        userId,
        targetUserId: targetAttendee.id,
        venueId: currentVenue.id,
        connectionType: 'Met',
        notes: `Connected at ${currentVenue.name}`
      });

      if (response.data.connection) {
        onConnectionMade?.(targetAttendee);
        
        // Show success feedback
        setAttendees(prev => prev.map(a => 
          a.id === targetAttendee.id 
            ? { ...a, status: 'Connected' }
            : a
        ));
      }

    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  // Auto-detect venue on component mount
  useEffect(() => {
    detectVenue();
  }, [detectVenue]);

  return (
    <div className="connection-hub">
      {/* Venue Detection Status */}
      <div className="detection-status">
        <div className={`status-indicator ${connectionStatus}`}>
          <div className="status-icon">
            {connectionStatus === 'detecting' && <div className="spinner" />}
            {connectionStatus === 'connected' && '📍'}
            {connectionStatus === 'error' && '❌'}
            {connectionStatus === 'idle' && '🔍'}
          </div>
          <div className="status-text">
            {connectionStatus === 'detecting' && 'Detecting venue...'}
            {connectionStatus === 'connected' && `Connected to ${currentVenue?.name}`}
            {connectionStatus === 'error' && 'Detection failed'}
            {connectionStatus === 'idle' && 'Tap to detect venue'}
          </div>
        </div>
        
        {detectionTime > 0 && (
          <div className="detection-time">
            Detected in {detectionTime}ms
            {detectionTime < 3000 && <span className="fast-badge">⚡ Fast</span>}
          </div>
        )}
      </div>

      {/* Current Venue Info */}
      {currentVenue && (
        <div className="venue-info">
          <h2>{currentVenue.name}</h2>
          <p className="venue-address">{currentVenue.address}</p>
          <div className="venue-stats">
            <span className="attendee-count">👥 {currentVenue.attendeeCount} here</span>
            <span className="confidence">🎯 {Math.round(currentVenue.confidence * 100)}% match</span>
          </div>
        </div>
      )}

      {/* Current Speakers/Performers */}
      {currentSpeakers.length > 0 && (
        <div className="current-speakers">
          <h3>🎤 Current Speakers</h3>
          <div className="speakers-grid">
            {currentSpeakers.map(speaker => (
              <div key={speaker.id} className="speaker-card">
                <img src={speaker.avatar} alt={speaker.name} className="speaker-avatar" />
                <div className="speaker-info">
                  <h4>{speaker.name}</h4>
                  <p className="speaker-title">{speaker.title}</p>
                  <div className="speaker-expertise">
                    {speaker.expertise.slice(0, 3).map(skill => (
                      <span key={skill} className="expertise-tag">{skill}</span>
                    ))}
                  </div>
                  <div className="social-proof">
                    <span>⭐ {speaker.socialProof.reputation}</span>
                    <span>🎪 {speaker.socialProof.pastEvents} events</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session Context */}
      {sessionContext && (
        <div className="session-context">
          <h3>📅 What's Happening</h3>
          {sessionContext.currentEvents?.map((event: Event) => (
            <div key={event.id} className="current-event">
              <h4>{event.name}</h4>
              <p>{event.description}</p>
              <div className="event-time">
                {new Date(event.startTime).toLocaleTimeString()} - 
                {new Date(event.endTime).toLocaleTimeString()}
              </div>
            </div>
          ))}
          
          {sessionContext.upcomingEvents?.length > 0 && (
            <div className="upcoming-events">
              <h4>Coming Up:</h4>
              {sessionContext.upcomingEvents.slice(0, 2).map((event: Event) => (
                <div key={event.id} className="upcoming-event">
                  <span className="event-name">{event.name}</span>
                  <span className="event-time">
                    {new Date(event.startTime).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Expertise Matches */}
      {expertiseMatches.length > 0 && (
        <div className="expertise-matches">
          <h3>🎯 People You Should Meet</h3>
          <div className="matches-grid">
            {expertiseMatches.map(attendee => (
              <div key={attendee.id} className="match-card">
                <img src={attendee.avatar} alt={attendee.displayName} className="attendee-avatar" />
                <div className="match-info">
                  <h4>{attendee.displayName}</h4>
                  <p className="match-activity">{attendee.activity}</p>
                  <div className="match-expertise">
                    {attendee.expertise.slice(0, 2).map(skill => (
                      <span key={skill} className="expertise-tag">{skill}</span>
                    ))}
                  </div>
                  <div className="reputation-badge">
                    {attendee.reputation.level} • ⭐ {attendee.reputation.score}
                  </div>
                  <button 
                    className="connect-btn"
                    onClick={() => connectWithAttendee(attendee)}
                  >
                    Connect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Attendees */}
      {attendees.length > 0 && (
        <div className="all-attendees">
          <h3>👥 Everyone Here ({attendees.length})</h3>
          <div className="attendees-list">
            {attendees.map(attendee => (
              <div key={attendee.id} className="attendee-item">
                <img src={attendee.avatar} alt={attendee.displayName} className="attendee-avatar-small" />
                <div className="attendee-details">
                  <span className="attendee-name">{attendee.displayName}</span>
                  <span className="attendee-activity">{attendee.activity}</span>
                </div>
                <div className="attendee-reputation">
                  {attendee.reputation.level}
                </div>
                <button 
                  className="connect-btn-small"
                  onClick={() => connectWithAttendee(attendee)}
                >
                  Connect
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Detection Button */}
      <button 
        className="detect-btn"
        onClick={detectVenue}
        disabled={isDetecting}
      >
        {isDetecting ? 'Detecting...' : 'Refresh Location'}
      </button>
    </div>
  );
};

export default ConnectionHub;