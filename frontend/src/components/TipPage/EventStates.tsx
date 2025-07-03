import React from 'react';
import { Event, Speaker } from '../../contexts/EventContext';
import './EventStates.css';

interface EventStatesProps {
  eventState: 'pre-event' | 'post-event';
  event: Event;
  speakers: Speaker[];
  onNotifyMe: () => void;
  onViewRecording?: () => void;
}

export const EventStates: React.FC<EventStatesProps> = ({
  eventState,
  event,
  speakers,
  onNotifyMe,
  onViewRecording
}) => {
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeUntilEvent = () => {
    const now = new Date();
    const eventStart = new Date(event.startTime);
    const diffMs = eventStart.getTime() - now.getTime();
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  if (eventState === 'pre-event') {
    return (
      <div className="event-state pre-event">
        <div className="state-content">
          
          {/* Countdown */}
          <div className="countdown-section">
            <h3>⏰ Event Starts Soon</h3>
            <div className="countdown-display">
              <div className="countdown-time">
                {getTimeUntilEvent()}
              </div>
              <div className="countdown-label">until {event.name} begins</div>
            </div>
          </div>

          {/* Event Details */}
          <div className="event-preview">
            <h4>📅 Event Details</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Starts:</span>
                <span className="detail-value">{formatDateTime(event.startTime)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Duration:</span>
                <span className="detail-value">
                  {Math.round((new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60))} hours
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Venue:</span>
                <span className="detail-value">{event.venue}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Speakers:</span>
                <span className="detail-value">{speakers.length} confirmed</span>
              </div>
            </div>
          </div>

          {/* Speaker Preview */}
          {speakers.length > 0 && (
            <div className="speakers-preview">
              <h4>🎤 Featured Speakers</h4>
              <div className="speaker-avatars">
                {speakers.slice(0, 6).map(speaker => (
                  <div key={speaker.id} className="speaker-avatar-preview">
                    {speaker.avatar ? (
                      <img src={speaker.avatar} alt={speaker.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {speaker.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="speaker-name-tooltip">{speaker.name}</span>
                  </div>
                ))}
                {speakers.length > 6 && (
                  <div className="more-speakers">
                    +{speakers.length - 6}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pre-event-actions">
            <button className="btn btn-primary" onClick={onNotifyMe}>
              🔔 Notify Me When Live
            </button>
            <button className="btn btn-outline">
              📅 Add to Calendar
            </button>
            <button className="btn btn-outline">
              🔗 Share Event
            </button>
          </div>

          {/* Preparation Tips */}
          <div className="preparation-tips">
            <h4>💡 Get Ready to Tip</h4>
            <div className="tips-grid">
              <div className="tip-item">
                <span className="tip-icon">🔗</span>
                <span>Connect your wallet now</span>
              </div>
              <div className="tip-item">
                <span className="tip-icon">💰</span>
                <span>Get some USDC ready</span>
              </div>
              <div className="tip-item">
                <span className="tip-icon">⚡</span>
                <span>Switch to Mantle Network</span>
              </div>
              <div className="tip-item">
                <span className="tip-icon">🎯</span>
                <span>Follow your favorite speakers</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (eventState === 'post-event') {
    return (
      <div className="event-state post-event">
        <div className="state-content">
          
          {/* Event Summary */}
          <div className="event-summary">
            <h3>✅ Event Completed</h3>
            <div className="summary-stats">
              <div className="stat-card">
                <div className="stat-value">{speakers.length}</div>
                <div className="stat-label">Speakers</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {speakers.reduce((total, speaker) => total + (speaker.tipCount || 0), 0)}
                </div>
                <div className="stat-label">Tips Sent</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  ${speakers.reduce((total, speaker) => total + (speaker.todayEarnings || 0), 0).toFixed(0)}
                </div>
                <div className="stat-label">Total Earned</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {Math.round((new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60))}h
                </div>
                <div className="stat-label">Duration</div>
              </div>
            </div>
          </div>

          {/* Top Speakers */}
          {speakers.length > 0 && (
            <div className="top-speakers">
              <h4>🏆 Top Tipped Speakers</h4>
              <div className="speaker-leaderboard">
                {speakers
                  .sort((a, b) => (b.todayEarnings || 0) - (a.todayEarnings || 0))
                  .slice(0, 5)
                  .map((speaker, index) => (
                    <div key={speaker.id} className="leaderboard-item">
                      <div className="rank">#{index + 1}</div>
                      <div className="speaker-info">
                        <div className="speaker-avatar">
                          {speaker.avatar ? (
                            <img src={speaker.avatar} alt={speaker.name} />
                          ) : (
                            <div className="avatar-placeholder">
                              {speaker.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="speaker-details">
                          <div className="speaker-name">{speaker.name}</div>
                          <div className="speaker-earnings">
                            ${speaker.todayEarnings || 0} • {speaker.tipCount || 0} tips
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Post-Event Actions */}
          <div className="post-event-actions">
            {onViewRecording && (
              <button className="btn btn-primary" onClick={onViewRecording}>
                📹 Watch Recording
              </button>
            )}
            <button className="btn btn-outline">
              📊 View Full Stats
            </button>
            <button className="btn btn-outline">
              🔗 Share Results
            </button>
            <button className="btn btn-outline">
              💬 Join Discussion
            </button>
          </div>

          {/* Feedback */}
          <div className="event-feedback">
            <h4>💭 How was the event?</h4>
            <div className="feedback-buttons">
              <button className="feedback-btn">🔥 Amazing</button>
              <button className="feedback-btn">👍 Good</button>
              <button className="feedback-btn">👌 Okay</button>
              <button className="feedback-btn">👎 Poor</button>
            </div>
          </div>

          {/* Next Events */}
          <div className="next-events">
            <h4>🔜 Upcoming Events</h4>
            <p>Don't miss the next opportunity to tip amazing speakers!</p>
            <button className="btn btn-outline">
              Browse Upcoming Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default EventStates;