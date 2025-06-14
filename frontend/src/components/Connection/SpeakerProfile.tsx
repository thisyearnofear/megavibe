import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import './SpeakerProfile.css';

interface SpeakerProfile {
  id: string;
  userId: string;
  displayName: string;
  title: string;
  company: string;
  bio: string;
  avatar: string;
  coverImage: string;
  expertise: string[];
  specialties: string[];
  languages: Array<{
    language: string;
    proficiency: string;
  }>;
  yearsExperience: number;
  totalEvents: number;
  reputation: {
    overallScore: number;
    speakingScore: number;
    engagementScore: number;
    reliabilityScore: number;
  };
  socialProof: {
    followers: number;
    totalTips: number;
    totalBounties: number;
    averageRating: number;
    totalRatings: number;
    repeatInvitations: number;
  };
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    website?: string;
    youtube?: string;
    instagram?: string;
  };
  isVerified: boolean;
  verificationBadges: Array<{
    type: string;
    earnedAt: Date;
    description: string;
  }>;
  level: string;
  currentStatus: string;
  currentEvent?: {
    eventId: string;
    venueId: string;
    role: string;
    startTime: Date;
    endTime: Date;
  };
  preferredTopics: string[];
  preferredFormats: string[];
  isAvailableForBooking: boolean;
  profileViews: number;
  lastActive: Date;
  pastEvents?: Array<{
    eventName: string;
    venueName: string;
    date: Date;
    role: string;
    topic: string;
    rating: number;
    attendeeCount: number;
    tipsReceived: number;
    bountiesCompleted: number;
  }>;
}

interface SpeakerProfileProps {
  speakerId: string;
  onConnect?: (speakerId: string) => void;
  onTip?: (speakerId: string) => void;
  onBooking?: (speakerId: string) => void;
  showPrivateInfo?: boolean;
}

export const SpeakerProfile: React.FC<SpeakerProfileProps> = ({
  speakerId,
  onConnect,
  onTip,
  onBooking,
  showPrivateInfo = false
}) => {
  const [speaker, setSpeaker] = useState<SpeakerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'experience' | 'social'>('overview');

  useEffect(() => {
    loadSpeakerProfile();
  }, [speakerId]);

  const loadSpeakerProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/connection/speakers/${speakerId}`, {
        params: { includePrivate: showPrivateInfo }
      });
      setSpeaker(response.data.speaker);
    } catch (error) {
      console.error('Failed to load speaker profile:', error);
      setError('Failed to load speaker profile');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_stage': return '#ff4444';
      case 'available': return '#44ff44';
      case 'busy': return '#ffaa44';
      case 'in_meeting': return '#ff8844';
      case 'offline': return '#888888';
      default: return '#cccccc';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'on_stage': return '🎤 On Stage';
      case 'available': return '✅ Available';
      case 'busy': return '⏰ Busy';
      case 'in_meeting': return '🤝 In Meeting';
      case 'traveling': return '✈️ Traveling';
      case 'offline': return '⚫ Offline';
      default: return status;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Expert': return '#gold';
      case 'Experienced': return '#silver';
      case 'Intermediate': return '#bronze';
      default: return '#gray';
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderSocialLinks = () => {
    if (!speaker?.socialLinks) return null;

    const links = Object.entries(speaker.socialLinks).filter(([_, url]) => url);
    if (links.length === 0) return null;

    return (
      <div className="social-links">
        <h4>Connect</h4>
        <div className="social-links-grid">
          {links.map(([platform, url]) => (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={`social-link ${platform}`}
            >
              <span className="social-icon">{getSocialIcon(platform)}</span>
              <span className="social-label">{platform}</span>
            </a>
          ))}
        </div>
      </div>
    );
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return '🐦';
      case 'linkedin': return '💼';
      case 'github': return '💻';
      case 'website': return '🌐';
      case 'youtube': return '📺';
      case 'instagram': return '📸';
      default: return '🔗';
    }
  };

  if (loading) {
    return (
      <div className="speaker-profile loading">
        <div className="loading-spinner">Loading speaker profile...</div>
      </div>
    );
  }

  if (error || !speaker) {
    return (
      <div className="speaker-profile error">
        <div className="error-message">{error || 'Speaker not found'}</div>
      </div>
    );
  }

  return (
    <div className="speaker-profile">
      {/* Header Section */}
      <div className="profile-header">
        {speaker.coverImage && (
          <div className="cover-image">
            <img src={speaker.coverImage} alt="Cover" />
          </div>
        )}
        
        <div className="profile-info">
          <div className="avatar-section">
            <img src={speaker.avatar} alt={speaker.displayName} className="profile-avatar" />
            <div className="status-indicator" style={{ backgroundColor: getStatusColor(speaker.currentStatus) }}>
              {getStatusText(speaker.currentStatus)}
            </div>
          </div>
          
          <div className="basic-info">
            <div className="name-section">
              <h1>{speaker.displayName}</h1>
              {speaker.isVerified && <span className="verified-badge">✓</span>}
              <span className="level-badge" style={{ backgroundColor: getLevelColor(speaker.level) }}>
                {speaker.level}
              </span>
            </div>
            
            <h2 className="title">{speaker.title}</h2>
            {speaker.company && <h3 className="company">{speaker.company}</h3>}
            
            <div className="quick-stats">
              <div className="stat">
                <span className="stat-value">{speaker.totalEvents}</span>
                <span className="stat-label">Events</span>
              </div>
              <div className="stat">
                <span className="stat-value">{speaker.reputation.overallScore}</span>
                <span className="stat-label">Reputation</span>
              </div>
              <div className="stat">
                <span className="stat-value">{speaker.socialProof.averageRating.toFixed(1)}</span>
                <span className="stat-label">Rating</span>
              </div>
              <div className="stat">
                <span className="stat-value">{speaker.yearsExperience}</span>
                <span className="stat-label">Years</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="profile-actions">
          {onConnect && (
            <button className="action-btn connect-btn" onClick={() => onConnect(speaker.id)}>
              🤝 Connect
            </button>
          )}
          {onTip && (
            <button className="action-btn tip-btn" onClick={() => onTip(speaker.id)}>
              💰 Tip
            </button>
          )}
          {onBooking && speaker.isAvailableForBooking && (
            <button className="action-btn booking-btn" onClick={() => onBooking(speaker.id)}>
              📅 Book
            </button>
          )}
        </div>
      </div>

      {/* Current Event Info */}
      {speaker.currentEvent && (
        <div className="current-event">
          <h3>🎤 Currently Speaking</h3>
          <div className="event-info">
            <span className="event-role">{speaker.currentEvent.role}</span>
            <span className="event-time">
              {formatDate(speaker.currentEvent.startTime)} - {formatDate(speaker.currentEvent.endTime)}
            </span>
          </div>
        </div>
      )}

      {/* Verification Badges */}
      {speaker.verificationBadges.length > 0 && (
        <div className="verification-badges">
          <h3>🏆 Achievements</h3>
          <div className="badges-grid">
            {speaker.verificationBadges.map((badge, index) => (
              <div key={index} className="badge">
                <span className="badge-type">{badge.type.replace('_', ' ')}</span>
                <span className="badge-date">{formatDate(badge.earnedAt)}</span>
                {badge.description && <p className="badge-description">{badge.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'experience' ? 'active' : ''}`}
          onClick={() => setActiveTab('experience')}
        >
          Experience
        </button>
        <button
          className={`tab-btn ${activeTab === 'social' ? 'active' : ''}`}
          onClick={() => setActiveTab('social')}
        >
          Social Proof
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {/* Bio */}
            {speaker.bio && (
              <div className="bio-section">
                <h3>About</h3>
                <p>{speaker.bio}</p>
              </div>
            )}

            {/* Expertise */}
            <div className="expertise-section">
              <h3>Expertise</h3>
              <div className="expertise-tags">
                {speaker.expertise.map((skill, index) => (
                  <span key={index} className="expertise-tag primary">{skill}</span>
                ))}
              </div>
              
              {speaker.specialties.length > 0 && (
                <>
                  <h4>Specialties</h4>
                  <div className="expertise-tags">
                    {speaker.specialties.map((specialty, index) => (
                      <span key={index} className="expertise-tag secondary">{specialty}</span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Languages */}
            {speaker.languages.length > 0 && (
              <div className="languages-section">
                <h3>Languages</h3>
                <div className="languages-list">
                  {speaker.languages.map((lang, index) => (
                    <div key={index} className="language-item">
                      <span className="language-name">{lang.language}</span>
                      <span className="language-proficiency">{lang.proficiency}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preferred Topics & Formats */}
            <div className="preferences-section">
              {speaker.preferredTopics.length > 0 && (
                <div className="preferred-topics">
                  <h3>Preferred Topics</h3>
                  <div className="topic-tags">
                    {speaker.preferredTopics.map((topic, index) => (
                      <span key={index} className="topic-tag">{topic}</span>
                    ))}
                  </div>
                </div>
              )}

              {speaker.preferredFormats.length > 0 && (
                <div className="preferred-formats">
                  <h3>Preferred Formats</h3>
                  <div className="format-tags">
                    {speaker.preferredFormats.map((format, index) => (
                      <span key={index} className="format-tag">{format.replace('_', ' ')}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'experience' && (
          <div className="experience-tab">
            {/* Reputation Breakdown */}
            <div className="reputation-breakdown">
              <h3>Reputation Scores</h3>
              <div className="reputation-bars">
                <div className="reputation-bar">
                  <span className="bar-label">Speaking</span>
                  <div className="bar-container">
                    <div 
                      className="bar-fill speaking" 
                      style={{ width: `${speaker.reputation.speakingScore}%` }}
                    ></div>
                  </div>
                  <span className="bar-value">{speaker.reputation.speakingScore}</span>
                </div>
                
                <div className="reputation-bar">
                  <span className="bar-label">Engagement</span>
                  <div className="bar-container">
                    <div 
                      className="bar-fill engagement" 
                      style={{ width: `${speaker.reputation.engagementScore}%` }}
                    ></div>
                  </div>
                  <span className="bar-value">{speaker.reputation.engagementScore}</span>
                </div>
                
                <div className="reputation-bar">
                  <span className="bar-label">Reliability</span>
                  <div className="bar-container">
                    <div 
                      className="bar-fill reliability" 
                      style={{ width: `${speaker.reputation.reliabilityScore}%` }}
                    ></div>
                  </div>
                  <span className="bar-value">{speaker.reputation.reliabilityScore}</span>
                </div>
              </div>
            </div>

            {/* Past Events */}
            {speaker.pastEvents && speaker.pastEvents.length > 0 && (
              <div className="past-events">
                <h3>Recent Events</h3>
                <div className="events-list">
                  {speaker.pastEvents.map((event, index) => (
                    <div key={index} className="event-item">
                      <div className="event-header">
                        <h4>{event.eventName}</h4>
                        <span className="event-date">{formatDate(event.date)}</span>
                      </div>
                      <div className="event-details">
                        <span className="venue-name">{event.venueName}</span>
                        <span className="event-role">{event.role}</span>
                        {event.topic && <span className="event-topic">{event.topic}</span>}
                      </div>
                      <div className="event-stats">
                        {event.rating && (
                          <span className="event-rating">⭐ {event.rating.toFixed(1)}</span>
                        )}
                        <span className="attendee-count">👥 {event.attendeeCount}</span>
                        {event.tipsReceived > 0 && (
                          <span className="tips-received">💰 ${event.tipsReceived}</span>
                        )}
                        {event.bountiesCompleted > 0 && (
                          <span className="bounties-completed">🎯 {event.bountiesCompleted}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'social' && (
          <div className="social-tab">
            {/* Social Proof Metrics */}
            <div className="social-proof-metrics">
              <h3>Social Proof</h3>
              <div className="metrics-grid">
                <div className="metric-card">
                  <span className="metric-value">{speaker.socialProof.followers}</span>
                  <span className="metric-label">Followers</span>
                </div>
                <div className="metric-card">
                  <span className="metric-value">${speaker.socialProof.totalTips}</span>
                  <span className="metric-label">Total Tips</span>
                </div>
                <div className="metric-card">
                  <span className="metric-value">{speaker.socialProof.totalBounties}</span>
                  <span className="metric-label">Bounties</span>
                </div>
                <div className="metric-card">
                  <span className="metric-value">{speaker.socialProof.repeatInvitations}</span>
                  <span className="metric-label">Repeat Invites</span>
                </div>
              </div>
            </div>

            {/* Social Links */}
            {renderSocialLinks()}

            {/* Profile Stats */}
            <div className="profile-stats">
              <h3>Profile Activity</h3>
              <div className="stats-list">
                <div className="stat-item">
                  <span className="stat-label">Profile Views</span>
                  <span className="stat-value">{speaker.profileViews}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Last Active</span>
                  <span className="stat-value">{formatDate(speaker.lastActive)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Ratings</span>
                  <span className="stat-value">{speaker.socialProof.totalRatings}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeakerProfile;