import React, { useMemo } from 'react';
import { Event } from '../../contexts/EventContext';
import './EventSelector.css';

interface EventSelectorProps {
  events: Event[];
  onEventSelect: (eventId: string) => void;
  isConnected: boolean;
}

export const EventSelector: React.FC<EventSelectorProps> = ({
  events,
  onEventSelect,
  isConnected
}) => {
  // Categorize events by status
  const categorizedEvents = useMemo(() => {
    const now = new Date();
    
    return {
      live: events.filter(event => {
        const start = new Date(event.startTime);
        const end = new Date(event.endTime);
        return now >= start && now <= end;
      }),
      upcoming: events.filter(event => {
        const start = new Date(event.startTime);
        return now < start;
      }),
      completed: events.filter(event => {
        const end = new Date(event.endTime);
        return now > end;
      })
    };
  }, [events]);

  const getEventStatus = (event: Event) => {
    const now = new Date();
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    
    if (now >= start && now <= end) return 'live';
    if (now < start) return 'upcoming';
    return 'completed';
  };

  const formatEventTime = (event: Event) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const now = new Date();
    
    if (now >= start && now <= end) {
      // Live event - show end time
      return `Ends ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (now < start) {
      // Upcoming event - show start time
      return `Starts ${start.toLocaleString([], { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    } else {
      // Completed event - show completion
      return `Ended ${end.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
    }
  };

  const EventCard: React.FC<{ event: Event }> = ({ event }) => {
    const status = getEventStatus(event);
    const isClickable = status === 'live' || (status === 'completed' && isConnected);
    
    return (
      <div
        className={`event-card ${status} ${isClickable ? 'clickable' : 'disabled'}`}
        onClick={() => isClickable && onEventSelect(event.id)}
      >
        <div className="event-card-header">
          <h3 className="event-name">{event.name}</h3>
          <div className={`status-badge ${status}`}>
            {status === 'live' && '🔴 LIVE'}
            {status === 'upcoming' && '⏰ Soon'}
            {status === 'completed' && '✅ Done'}
          </div>
        </div>
        
        <p className="event-venue">{event.venue}</p>
        <p className="event-description">{event.description}</p>
        
        <div className="event-meta">
          <div className="event-time">{formatEventTime(event)}</div>
          {event.speakerCount && (
            <div className="speaker-count">
              {event.speakerCount} speaker{event.speakerCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {status === 'upcoming' && (
          <div className="upcoming-notice">
            <span>🔔 Set reminder to tip when live</span>
          </div>
        )}

        {status === 'completed' && !isConnected && (
          <div className="connect-notice">
            <span>Connect wallet to view recordings & tips</span>
          </div>
        )}

        {status === 'live' && (
          <div className="live-actions">
            <span className="tip-count">
              💰 {event.tipCount || 0} tips sent
            </span>
            <span className="live-indicator">
              <span className="pulse-dot"></span>
              Join now
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="event-selector">
      <div className="selector-header">
        <h2>🎤 Choose an Event</h2>
        <p>Select an event to tip speakers and join the live experience</p>
      </div>

      {/* Live Events - Priority */}
      {categorizedEvents.live.length > 0 && (
        <div className="event-category">
          <h3 className="category-title">
            <span className="live-dot"></span>
            Live Now
          </h3>
          <div className="events-grid">
            {categorizedEvents.live.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      {categorizedEvents.upcoming.length > 0 && (
        <div className="event-category">
          <h3 className="category-title">
            ⏰ Upcoming Events
          </h3>
          <div className="events-grid">
            {categorizedEvents.upcoming.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Events */}
      {categorizedEvents.completed.length > 0 && (
        <div className="event-category">
          <h3 className="category-title">
            📚 Past Events
          </h3>
          <div className="events-grid">
            {categorizedEvents.completed.slice(0, 6).map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
          {categorizedEvents.completed.length > 6 && (
            <button className="view-more-btn">
              View {categorizedEvents.completed.length - 6} more past events
            </button>
          )}
        </div>
      )}

      {/* Empty State */}
      {events.length === 0 && (
        <div className="empty-state">
          <div className="empty-content">
            <h3>🎭 No Events Available</h3>
            <p>Check back soon for upcoming events where you can tip speakers!</p>
            <button className="btn btn-outline">
              Get Notified of New Events
            </button>
          </div>
        </div>
      )}

      {/* Connection Prompt */}
      {!isConnected && events.length > 0 && (
        <div className="connection-prompt">
          <div className="prompt-content">
            <h4>💡 Connect Your Wallet</h4>
            <p>Connect your wallet to tip speakers and unlock the full experience</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventSelector;