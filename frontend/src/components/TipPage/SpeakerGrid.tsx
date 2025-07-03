import React, { useState, useMemo } from 'react';
import { Speaker } from '../../contexts/EventContext';
import { LoadingSpinner } from '../Loading/LoadingSpinner';
import './SpeakerGrid.css';

interface SpeakerGridProps {
  speakers: Speaker[];
  onSpeakerSelect: (speakerId: string) => void;
  onQuickTip: (speakerId: string, amount: number) => void;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  eventState: 'live' | 'pre-event' | 'post-event';
}

const QUICK_TIP_AMOUNTS = [5, 10, 25, 50];

export const SpeakerGrid: React.FC<SpeakerGridProps> = ({
  speakers,
  onSpeakerSelect,
  onQuickTip,
  isConnected,
  isCorrectNetwork,
  eventState
}) => {
  const [loadingTips, setLoadingTips] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'speaking' | 'available'>('all');

  // Filter speakers based on current status
  const filteredSpeakers = useMemo(() => {
    if (filter === 'all') return speakers;
    if (filter === 'speaking') return speakers.filter(s => s.isCurrentlySpeaking);
    if (filter === 'available') return speakers.filter(s => s.isAvailableForTips);
    return speakers;
  }, [speakers, filter]);

  // Sort speakers: currently speaking first, then by tip count
  const sortedSpeakers = useMemo(() => {
    return [...filteredSpeakers].sort((a, b) => {
      if (a.isCurrentlySpeaking && !b.isCurrentlySpeaking) return -1;
      if (!a.isCurrentlySpeaking && b.isCurrentlySpeaking) return 1;
      return (b.tipCount || 0) - (a.tipCount || 0);
    });
  }, [filteredSpeakers]);

  const handleQuickTip = async (speakerId: string, amount: number) => {
    if (!isConnected || !isCorrectNetwork) return;
    
    setLoadingTips(prev => new Set(prev).add(speakerId));
    try {
      await onQuickTip(speakerId, amount);
    } finally {
      setLoadingTips(prev => {
        const newSet = new Set(prev);
        newSet.delete(speakerId);
        return newSet;
      });
    }
  };

  const SpeakerCard: React.FC<{ speaker: Speaker }> = ({ speaker }) => {
    const isLoading = loadingTips.has(speaker.id);
    const canTip = isConnected && isCorrectNetwork && !isLoading;

    return (
      <div className={`speaker-card ${speaker.isCurrentlySpeaking ? 'speaking' : ''}`}>
        
        {/* Speaker Avatar & Status */}
        <div className="speaker-header">
          <div className="speaker-avatar">
            {speaker.avatar ? (
              <img src={speaker.avatar} alt={speaker.name} />
            ) : (
              <div className="avatar-placeholder">
                {speaker.name.charAt(0).toUpperCase()}
              </div>
            )}
            {speaker.isCurrentlySpeaking && (
              <div className="speaking-indicator">
                <span className="pulse-dot"></span>
              </div>
            )}
          </div>
          
          <div className="speaker-info">
            <h4 className="speaker-name">{speaker.name}</h4>
            {speaker.title && (
              <p className="speaker-title">{speaker.title}</p>
            )}
            {speaker.currentTalk && (
              <p className="current-talk">
                <span className="talk-icon">🎤</span>
                {speaker.currentTalk}
              </p>
            )}
          </div>
        </div>

        {/* Speaker Stats */}
        <div className="speaker-stats">
          <div className="stat">
            <span className="stat-value">${speaker.todayEarnings || 0}</span>
            <span className="stat-label">earned today</span>
          </div>
          <div className="stat">
            <span className="stat-value">{speaker.tipCount || 0}</span>
            <span className="stat-label">tips received</span>
          </div>
        </div>

        {/* Quick Tip Actions */}
        <div className="speaker-actions">
          {eventState === 'live' && (
            <>
              {/* Quick Tip Buttons */}
              <div className="quick-tips">
                {QUICK_TIP_AMOUNTS.map(amount => (
                  <button
                    key={amount}
                    className={`quick-tip-btn ${!canTip ? 'disabled' : ''}`}
                    onClick={() => handleQuickTip(speaker.id, amount)}
                    disabled={!canTip}
                  >
                    {isLoading ? (
                      <LoadingSpinner size="xs" />
                    ) : (
                      `$${amount}`
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Tip Button */}
              <button
                className={`custom-tip-btn ${!canTip ? 'disabled' : ''}`}
                onClick={() => onSpeakerSelect(speaker.id)}
                disabled={!canTip}
              >
                💰 Custom Tip
              </button>
            </>
          )}

          {/* Connection Prompts */}
          {!isConnected && (
            <div className="connection-prompt">
              <span>Connect wallet to tip</span>
            </div>
          )}

          {isConnected && !isCorrectNetwork && (
            <div className="network-prompt">
              <span>Switch to correct network</span>
            </div>
          )}
        </div>

        {/* Speaker Social Links */}
        {(speaker.twitter || speaker.farcaster) && (
          <div className="speaker-social">
            {speaker.twitter && (
              <a 
                href={`https://twitter.com/${speaker.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link twitter"
              >
                🐦
              </a>
            )}
            {speaker.farcaster && (
              <a 
                href={`https://warpcast.com/${speaker.farcaster}`}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link farcaster"
              >
                🟣
              </a>
            )}
          </div>
        )}
      </div>
    );
  };

  if (speakers.length === 0) {
    return (
      <div className="speakers-empty">
        <div className="empty-content">
          <h3>🎤 No Speakers Available</h3>
          <p>Speakers will appear here when the event starts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="speaker-grid-container">
      
      {/* Filter Controls */}
      <div className="speaker-filters">
        <h3>🎤 Speakers ({filteredSpeakers.length})</h3>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({speakers.length})
          </button>
          <button
            className={`filter-btn ${filter === 'speaking' ? 'active' : ''}`}
            onClick={() => setFilter('speaking')}
          >
            Speaking Now ({speakers.filter(s => s.isCurrentlySpeaking).length})
          </button>
          <button
            className={`filter-btn ${filter === 'available' ? 'active' : ''}`}
            onClick={() => setFilter('available')}
          >
            Available ({speakers.filter(s => s.isAvailableForTips).length})
          </button>
        </div>
      </div>

      {/* Speakers Grid */}
      <div className="speakers-grid">
        {sortedSpeakers.map(speaker => (
          <SpeakerCard key={speaker.id} speaker={speaker} />
        ))}
      </div>

      {/* Tips Info */}
      <div className="tips-info">
        <div className="info-card">
          <h4>💡 Quick Tips</h4>
          <p>Use the preset amounts for instant tips, or click "Custom Tip" for more options</p>
        </div>
        <div className="info-card">
          <h4>⚡ Ultra-Low Fees</h4>
          <p>Tips are sent via Mantle Network with fees under $0.01</p>
        </div>
      </div>
    </div>
  );
};

export default SpeakerGrid;