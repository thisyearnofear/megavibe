import React, { useState, useEffect } from 'react';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { PerformanceSteering } from './PerformanceSteering';
import { SocialSharingIncentives } from './SocialSharingIncentives';
import { OrganizerTools } from '../Admin/OrganizerTools';
import '../../styles/LiveInfluenceHub.css';

interface LiveInfluenceHubProps {
  venueId: string;
  performanceId?: string;
  userRole: 'audience' | 'performer' | 'organizer';
  onClose?: () => void;
}

export const LiveInfluenceHub: React.FC<LiveInfluenceHubProps> = ({
  venueId,
  performanceId,
  userRole,
  onClose,
}) => {
  const [activeFeature, setActiveFeature] = useState<'analytics' | 'steering' | 'sharing' | 'organizer'>('analytics');
  const [isMinimized, setIsMinimized] = useState(false);

  // Auto-select appropriate feature based on user role
  useEffect(() => {
    switch (userRole) {
      case 'performer':
        setActiveFeature('steering');
        break;
      case 'organizer':
        setActiveFeature('organizer');
        break;
      default:
        setActiveFeature('analytics');
    }
  }, [userRole]);

  const getFeatureTitle = () => {
    switch (activeFeature) {
      case 'analytics':
        return '📊 Live Analytics';
      case 'steering':
        return '🎭 Performance Steering';
      case 'sharing':
        return '📱 Social Sharing';
      case 'organizer':
        return '🎪 Organizer Tools';
      default:
        return '⚡ Live Influence';
    }
  };

  const getAvailableFeatures = () => {
    const features = [
      { id: 'analytics', label: '📊 Analytics', description: 'Real-time venue insights' },
      { id: 'sharing', label: '📱 Sharing', description: 'Earn rewards for sharing' },
    ];

    if (performanceId) {
      features.splice(1, 0, { 
        id: 'steering', 
        label: '🎭 Steering', 
        description: 'Audience influence feedback' 
      });
    }

    if (userRole === 'organizer') {
      features.push({ 
        id: 'organizer', 
        label: '🎪 Organizer', 
        description: 'Event optimization tools' 
      });
    }

    return features;
  };

  const handleShare = (platform: string, reward: number) => {
    // Handle successful share
    console.log(`Shared on ${platform}, earned ${reward} points`);
  };

  if (isMinimized) {
    return (
      <div className="live-influence-hub minimized">
        <button 
          className="minimize-button"
          onClick={() => setIsMinimized(false)}
          title="Expand Live Influence Hub"
        >
          ⚡ Live Influence
        </button>
      </div>
    );
  }

  return (
    <div className="live-influence-hub">
      <div className="hub-header">
        <div className="header-content">
          <h2>⚡ Live Influence Economy</h2>
          <div className="header-controls">
            <button 
              className="minimize-button"
              onClick={() => setIsMinimized(true)}
              title="Minimize"
            >
              ➖
            </button>
            {onClose && (
              <button 
                className="close-button"
                onClick={onClose}
                title="Close"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="user-role-indicator">
          <span className={`role-badge ${userRole}`}>
            {userRole === 'audience' && '👥 Audience'}
            {userRole === 'performer' && '🎭 Performer'}
            {userRole === 'organizer' && '🎪 Organizer'}
          </span>
        </div>

        <div className="feature-selector">
          {getAvailableFeatures().map((feature) => (
            <button
              key={feature.id}
              className={`feature-tab ${activeFeature === feature.id ? 'active' : ''}`}
              onClick={() => setActiveFeature(feature.id as any)}
              title={feature.description}
            >
              {feature.label}
            </button>
          ))}
        </div>
      </div>

      <div className="hub-content">
        {activeFeature === 'analytics' && (
          <AnalyticsDashboard
            venueId={venueId}
            isOrganizer={userRole === 'organizer'}
          />
        )}

        {activeFeature === 'steering' && performanceId && (
          <PerformanceSteering
            performanceId={performanceId}
            isPerformer={userRole === 'performer'}
          />
        )}

        {activeFeature === 'sharing' && (
          <SocialSharingIncentives
            performanceId={performanceId}
            onShare={handleShare}
          />
        )}

        {activeFeature === 'organizer' && userRole === 'organizer' && (
          <OrganizerTools
            venueId={venueId}
          />
        )}
      </div>

      <div className="hub-footer">
        <div className="feature-description">
          {activeFeature === 'analytics' && (
            <p>Real-time analytics showing audience engagement, sentiment, and venue performance metrics.</p>
          )}
          {activeFeature === 'steering' && (
            <p>Live audience feedback helping performers understand what the crowd wants to see and hear.</p>
          )}
          {activeFeature === 'sharing' && (
            <p>Share content and earn rewards based on engagement. Higher viral potential = bigger bonuses!</p>
          )}
          {activeFeature === 'organizer' && (
            <p>Comprehensive tools for event optimization, audience insights, and real-time decision making.</p>
          )}
        </div>
      </div>
    </div>
  );
};