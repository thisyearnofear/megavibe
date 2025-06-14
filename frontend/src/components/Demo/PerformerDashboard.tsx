import React, { useState } from 'react';
import ArtistProfiles from '../ArtistProfiles';
import '../../styles/PerformerDashboard.css';

interface Performer {
  id: string;
  name: string;
  avatar: string;
  genre: string;
  isLive: boolean;
  currentSong?: string;
  tipCount: number;
  reputation: number;
  bio: string;
  socialLinks: {
    spotify?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
}

interface PerformerDashboardProps {
  featureType: 'connection' | 'bounty' | 'tokenization' | 'influence' | 'reputation' | 'demo';
  onClose: () => void;
}

// Sample data for different feature demonstrations
const SAMPLE_PERFORMERS: Record<string, Performer[]> = {
  connection: [
    {
      id: 'papa-1',
      name: 'Papa',
      avatar: '/images/boom.jpg',
      genre: 'Indie Rock',
      isLive: true,
      currentSong: 'Chupacabra',
      tipCount: 23,
      reputation: 4.8,
      bio: 'Live Experience App creator and indie rock performer',
      socialLinks: {
        spotify: 'https://spoti.fi/3FEOjci',
        instagram: 'https://bit.ly/3FLPDKk',
        twitter: 'https://bit.ly/3FHRTT5',
        youtube: 'https://youtube.com/c/papajams'
      }
    },
    {
      id: 'jazz-quartet',
      name: 'The Jazz Collective',
      avatar: '/images/jazz-avatar.jpg',
      genre: 'Jazz Fusion',
      isLive: true,
      currentSong: 'Blue Moon Rising',
      tipCount: 45,
      reputation: 4.9,
      bio: 'Experimental jazz quartet pushing boundaries',
      socialLinks: {
        spotify: 'https://spotify.com/jazzquartet',
        instagram: 'https://instagram.com/jazzquartet'
      }
    },
    {
      id: 'crypto-speaker',
      name: 'Alex Chen',
      avatar: '/images/speaker-avatar.jpg',
      genre: 'Tech Talk',
      isLive: false,
      tipCount: 12,
      reputation: 4.6,
      bio: 'Blockchain developer and conference speaker',
      socialLinks: {
        twitter: 'https://twitter.com/alexchen',
        youtube: 'https://youtube.com/alexchen'
      }
    }
  ],
  bounty: [
    {
      id: 'comedian-1',
      name: 'Sarah Martinez',
      avatar: '/images/comedian-avatar.jpg',
      genre: 'Stand-up Comedy',
      isLive: true,
      currentSong: 'Crypto Jokes Set',
      tipCount: 67,
      reputation: 4.7,
      bio: 'Crypto comedian taking requests for custom jokes',
      socialLinks: {
        instagram: 'https://instagram.com/sarahcomedy',
        twitter: 'https://twitter.com/sarahcomedy'
      }
    }
  ],
  tokenization: [
    {
      id: 'viral-creator',
      name: 'TikTok Tommy',
      avatar: '/images/creator-avatar.jpg',
      genre: 'Content Creator',
      isLive: true,
      currentSong: 'Viral Dance Challenge',
      tipCount: 156,
      reputation: 4.5,
      bio: 'Creating viral moments that become tradeable NFTs',
      socialLinks: {
        instagram: 'https://instagram.com/tiktommy',
        twitter: 'https://twitter.com/tiktommy'
      }
    }
  ],
  influence: [
    {
      id: 'dj-interactive',
      name: 'DJ Pulse',
      avatar: '/images/dj-avatar.jpg',
      genre: 'Electronic/House',
      isLive: true,
      currentSong: 'Crowd Control Mix',
      tipCount: 89,
      reputation: 4.8,
      bio: 'Interactive DJ who changes sets based on audience tips',
      socialLinks: {
        spotify: 'https://spotify.com/djpulse',
        instagram: 'https://instagram.com/djpulse'
      }
    }
  ],
  reputation: [
    {
      id: 'curator-pro',
      name: 'Music Maven',
      avatar: '/images/curator-avatar.jpg',
      genre: 'Music Curator',
      isLive: false,
      tipCount: 234,
      reputation: 4.9,
      bio: 'Top-rated music curator with proven track record',
      socialLinks: {
        spotify: 'https://spotify.com/musicmaven',
        twitter: 'https://twitter.com/musicmaven'
      }
    }
  ],
  demo: [
    {
      id: 'papa-demo',
      name: 'Papa',
      avatar: '/images/boom.jpg',
      genre: 'Indie Rock',
      isLive: true,
      currentSong: 'Chupacabra',
      tipCount: 23,
      reputation: 4.8,
      bio: 'Live Experience App creator and indie rock performer',
      socialLinks: {
        spotify: 'https://spoti.fi/3FEOjci',
        instagram: 'https://bit.ly/3FLPDKk',
        twitter: 'https://bit.ly/3FHRTT5',
        youtube: 'https://youtube.com/c/papajams'
      }
    }
  ]
};

const FEATURE_TITLES = {
  connection: '🎯 Instant Connection Demo',
  bounty: '💰 Bounty Requests Demo', 
  tokenization: '🎬 Moment Tokenization Demo',
  influence: '⚡ Live Influence Demo',
  reputation: '🏆 Build Reputation Demo',
  demo: '🕺 PERFORMERS'
};

const FEATURE_DESCRIPTIONS = {
  connection: 'See how GPS magic instantly connects you with performers and audiences at any venue',
  bounty: 'Experience creating bounties for specific performances and watching creators compete',
  tokenization: 'Discover how viral moments become tradeable assets with revenue sharing',
  influence: 'Watch how tips and audience reactions shape performances in real-time',
  reputation: 'Explore the on-chain proof system that recognizes great curators and supporters',
  demo: 'From discovery to interaction'
};

export const PerformerDashboard: React.FC<PerformerDashboardProps> = ({
  featureType,
  onClose
}) => {
  const [selectedPerformer, setSelectedPerformer] = useState<string | null>(null);
  const [showArtistProfile, setShowArtistProfile] = useState(false);

  const performers = SAMPLE_PERFORMERS[featureType] || SAMPLE_PERFORMERS.demo;

  const handlePerformerSelect = (performer: Performer) => {
    console.log('Performer selected:', performer.name);
    setSelectedPerformer(performer.name);
    setShowArtistProfile(true);
  };

  const handleBackToDashboard = () => {
    setShowArtistProfile(false);
    setSelectedPerformer(null);
  };

  if (showArtistProfile && selectedPerformer) {
    console.log('Rendering ArtistProfiles for:', selectedPerformer);
    return (
      <div className="modal-overlay">
        <div className="modal performer-dashboard-modal">
          <div className="modal-header">
            <div>
              <h2>🎭 {selectedPerformer} Profile</h2>
              <p className="feature-description">Interactive artist profile experience</p>
            </div>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="modal-body" style={{ padding: 0, overflow: 'hidden' }}>
            <ArtistProfiles
              artist={selectedPerformer}
              onClose={onClose}
              onBack={handleBackToDashboard}
              demoMode={featureType}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal performer-dashboard-modal">
        <div className="modal-header">
          <div>
            <h2>{FEATURE_TITLES[featureType]}</h2>
            <p className="feature-description">{FEATURE_DESCRIPTIONS[featureType]}</p>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="performers-grid">
            {performers.map((performer) => (
              <div
                key={performer.id}
                className="performer-card"
                onClick={() => handlePerformerSelect(performer)}
              >
                <div className="performer-avatar-container">
                  <img 
                    src={performer.avatar} 
                    alt={performer.name}
                    className="performer-avatar"
                  />
                  {performer.isLive && (
                    <div className="live-indicator">
                      <span>LIVE</span>
                    </div>
                  )}
                </div>
                
                <div className="performer-info">
                  <h3 className="performer-name">{performer.name}</h3>
                  <p className="performer-genre">{performer.genre}</p>
                  {performer.currentSong && (
                    <p className="current-song">🎵 {performer.currentSong}</p>
                  )}
                  
                  <div className="performer-stats">
                    <div className="stat">
                      <span className="stat-value">{performer.tipCount}</span>
                      <span className="stat-label">Tips</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{performer.reputation}</span>
                      <span className="stat-label">Rating</span>
                    </div>
                  </div>
                </div>

                <div className="performer-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePerformerSelect(performer);
                    }}
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="dashboard-footer">
            <p className="demo-note">
              <strong>Demo Mode:</strong> Click any performer to experience the {featureType} feature flow
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
