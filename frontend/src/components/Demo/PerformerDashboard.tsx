import React, { useState, Suspense } from 'react';
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

// Feature-specific demo data showcasing unique backend implementations
const SAMPLE_PERFORMERS: Record<string, Performer[]> = {
  connection: [
    {
      id: 'connection-demo-1',
      name: 'Dr. Sarah Kim',
      avatar: '/images/boom.jpg',
      genre: 'Blockchain Conference',
      isLive: true,
      currentSong: 'Zero-Knowledge Proofs in Practice',
      tipCount: 234,
      reputation: 4.9,
      bio: 'Lead researcher at Ethereum Foundation, speaking about ZK-rollups and privacy',
      socialLinks: {
        twitter: 'https://twitter.com/drsarahkim',
        youtube: 'https://youtube.com/drsarahkim'
      }
    },
    {
      id: 'connection-demo-2',
      name: 'Marcus Rivera',
      avatar: '/images/boom.jpg',
      genre: 'Comedy Show',
      isLive: true,
      currentSong: 'Crypto Jokes & Web3 Humor',
      tipCount: 89,
      reputation: 4.7,
      bio: 'Stand-up comedian specializing in tech humor, currently at The Laugh Track',
      socialLinks: {
        instagram: 'https://instagram.com/marcuscomedy',
        twitter: 'https://twitter.com/marcuscomedy'
      }
    },
    {
      id: 'connection-demo-3',
      name: 'Elena Vasquez',
      avatar: '/images/boom.jpg',
      genre: 'Jazz Performance',
      isLive: false,
      currentSong: 'Next: Blue Moon Variations',
      tipCount: 156,
      reputation: 4.8,
      bio: 'Grammy-nominated jazz pianist, performing at Blue Note tonight at 9 PM',
      socialLinks: {
        spotify: 'https://spotify.com/elenavasquez',
        instagram: 'https://instagram.com/elenavasquez'
      }
    }
  ],
  bounty: [
    {
      id: 'bounty-demo-1',
      name: 'Jake "The Beatboxer" Thompson',
      avatar: '/images/boom.jpg',
      genre: 'Street Performance',
      isLive: true,
      currentSong: 'Taking Bounty Requests',
      tipCount: 312,
      reputation: 4.8,
      bio: 'Viral beatboxer who creates custom beats for bounty requests. Active bounties: 50 USDC for "Mantle Network beat"',
      socialLinks: {
        tiktok: 'https://tiktok.com/@jakebeatbox',
        instagram: 'https://instagram.com/jakebeatbox'
      }
    },
    {
      id: 'bounty-demo-2',
      name: 'Professor Maria Santos',
      avatar: '/images/boom.jpg',
      genre: 'Educational Content',
      isLive: false,
      currentSong: 'Next: Bounty Topic TBD',
      tipCount: 89,
      reputation: 4.9,
      bio: 'Computer science professor who explains complex topics for bounty requests. Current bounty: 75 USDC for "DeFi in 5 minutes"',
      socialLinks: {
        youtube: 'https://youtube.com/profmaria',
        twitter: 'https://twitter.com/profmaria'
      }
    }
  ],
  tokenization: [
    {
      id: 'tokenization-demo-1',
      name: 'Luna Chang',
      avatar: '/images/boom.jpg',
      genre: 'Performance Artist',
      isLive: true,
      currentSong: 'Interactive Light Show',
      tipCount: 445,
      reputation: 4.9,
      bio: 'Digital artist whose performances auto-mint as NFTs. 12 clips in content pool, 3 went viral this week, earning $234 for contributors',
      socialLinks: {
        opensea: 'https://opensea.io/lunachang',
        instagram: 'https://instagram.com/lunachang'
      }
    },
    {
      id: 'tokenization-demo-2',
      name: 'The Moment Collective',
      avatar: '/images/boom.jpg',
      genre: 'Collaborative Art',
      isLive: true,
      currentSong: 'Multi-Angle Performance',
      tipCount: 567,
      reputation: 4.8,
      bio: 'Group creating multi-perspective content. 5 angles of same moment = 5 NFTs. Revenue shared among all contributors',
      socialLinks: {
        website: 'https://momentcollective.art',
        twitter: 'https://twitter.com/momentcollective'
      }
    }
  ],
  influence: [
    {
      id: 'influence-demo-1',
      name: 'DJ Nexus',
      avatar: '/images/boom.jpg',
      genre: 'Interactive Electronic',
      isLive: true,
      currentSong: 'Audience-Driven Mix',
      tipCount: 1234,
      reputation: 4.9,
      bio: 'Pioneer of tip-to-influence DJing. Real-time: $50 tips = genre change, $100 = song request, $200 = live remix. Analytics show 89% audience satisfaction',
      socialLinks: {
        twitch: 'https://twitch.tv/djnexus',
        spotify: 'https://spotify.com/djnexus'
      }
    },
    {
      id: 'influence-demo-2',
      name: 'Chef Roberto Live',
      avatar: '/images/boom.jpg',
      genre: 'Cooking Show',
      isLive: true,
      currentSong: 'Interactive Cooking',
      tipCount: 678,
      reputation: 4.7,
      bio: 'Celebrity chef streaming live cooking influenced by tips. Venue analytics: 94% engagement rate, 23 ingredients changed by audience tonight',
      socialLinks: {
        youtube: 'https://youtube.com/chefroberto',
        instagram: 'https://instagram.com/chefroberto'
      }
    }
  ],
  reputation: [
    {
      id: 'reputation-demo-1',
      name: 'Alex "The Tastemaker" Johnson',
      avatar: '/images/boom.jpg',
      genre: 'Cultural Curator',
      isLive: false,
      tipCount: 2341,
      reputation: 4.95,
      bio: 'Diamond-tier curator with 47 proof-of-presence NFTs. 89% prediction accuracy on viral content. Cross-event reputation: 2,341 points across 23 venues',
      socialLinks: {
        foundation: 'https://foundation.app/tastemaker',
        twitter: 'https://twitter.com/tastemaker'
      }
    },
    {
      id: 'reputation-demo-2',
      name: 'Community Champion Sarah',
      avatar: '/images/boom.jpg',
      genre: 'Event Networker',
      isLive: true,
      currentSong: 'Networking Hour',
      tipCount: 1567,
      reputation: 4.87,
      bio: 'Platinum-tier reputation across 156 events. Expertise in crypto, music, and art. Leaderboard: #3 globally, #1 in NYC region',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/sarahnetworker',
        twitter: 'https://twitter.com/sarahnetworker'
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
    },
    {
      id: 'anatu-demo',
      name: 'Anatu',
      avatar: '/images/boom.jpg',
      genre: 'Afrobeat/Electronic',
      isLive: false,
      currentSong: 'Lagos Nights',
      tipCount: 156,
      reputation: 4.9,
      bio: 'Nigerian-born electronic artist blending traditional Afrobeat with modern production',
      socialLinks: {
        spotify: 'https://open.spotify.com/artist/anatu',
        instagram: 'https://instagram.com/anatumusic',
        twitter: 'https://twitter.com/anatumusic',
        youtube: 'https://youtube.com/c/anatumusic'
      }
    },
    {
      id: 'andrew-demo',
      name: 'Andrew',
      avatar: '/images/boom.jpg',
      genre: 'Acoustic/Singer-Songwriter',
      isLive: true,
      currentSong: 'City Stories',
      tipCount: 89,
      reputation: 4.7,
      bio: 'Storytelling singer-songwriter with a passion for connecting through music',
      socialLinks: {
        spotify: 'https://open.spotify.com/artist/andrewmusic',
        instagram: 'https://instagram.com/andrewsongs',
        twitter: 'https://twitter.com/andrewsongs',
        youtube: 'https://youtube.com/c/andrewsongs'
      }
    }
  ]
};

const FEATURE_TITLES = {
  connection: '🎯 Shazam for Live Events',
  bounty: '💰 Incentivize Any Content',
  tokenization: '🎬 Own Viral Moments',
  influence: '⚡ Shape Reality Live',
  reputation: '🏆 Prove Your Expertise',
  demo: '🎭 Meet The Artists'
};

const FEATURE_DESCRIPTIONS = {
  connection: 'Walk into any venue and instantly know who\'s performing, what\'s happening, and who else is there. Zero friction discovery.',
  bounty: 'Create bounties for specific content - "50 USDC for funniest crypto joke" - and watch creators compete to fulfill them.',
  tokenization: 'Contribute clips to content pools, earn when they\'re used, and watch viral moments become tradeable NFT assets.',
  influence: 'Your tips and reactions shape what happens on stage in real-time. Analytics dashboards show your impact.',
  reputation: 'Build cross-event reputation with proof-of-presence NFTs. Diamond-tier curators get exclusive access and rewards.',
  demo: 'Interactive artist profiles showcasing Papa, Anatu & Andrew with full social integration and tipping'
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

  const renderFeatureDemo = () => {
    if (!selectedPerformer) return null;

    switch (featureType) {
      case 'connection':
        return (
          <div className="feature-demo-content">
            <div className="demo-showcase">
              <h3>🎯 GPS Magic: Instant Venue Detection</h3>
              <div className="mock-connection-interface">
                <div className="location-ping">
                  <div className="ping-animation"></div>
                  <span>Detecting venue...</span>
                </div>
                <div className="venue-detected">
                  <h4>📍 {selectedPerformer} at Blue Note NYC</h4>
                  <p>Confidence: 98% | Distance: 15m</p>
                  <div className="attendee-list">
                    <h5>Who else is here (23 people):</h5>
                    <div className="attendee-grid">
                      <div className="attendee">👨‍💻 Alex (Blockchain Dev)</div>
                      <div className="attendee">🎵 Sarah (Music Producer)</div>
                      <div className="attendee">🎤 Mike (Sound Engineer)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'bounty':
        return (
          <div className="feature-demo-content">
            <div className="demo-showcase">
              <h3>💰 Create Bounty for {selectedPerformer}</h3>
              <div className="mock-bounty-interface">
                <div className="bounty-form">
                  <label>Request:</label>
                  <input type="text" placeholder="Play 'Bohemian Rhapsody' acoustic version" />
                  <label>Bounty Amount:</label>
                  <div className="amount-selector">
                    <button>25 USDC</button>
                    <button className="selected">50 USDC</button>
                    <button>100 USDC</button>
                  </div>
                  <button className="create-bounty-btn">Create Bounty</button>
                </div>
                <div className="active-bounties">
                  <h4>Active Bounties for {selectedPerformer}:</h4>
                  <div className="bounty-item">💰 75 USDC - "Sing Happy Birthday to Jenny"</div>
                  <div className="bounty-item">💰 50 USDC - "Freestyle about crypto"</div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'tokenization':
        return (
          <div className="feature-demo-content">
            <div className="demo-showcase">
              <h3>🎬 {selectedPerformer}'s Content Pool</h3>
              <div className="mock-tokenization-interface">
                <div className="content-pool">
                  <h4>Contribute to Pool (5 USDC fee)</h4>
                  <div className="upload-area">
                    <div className="upload-button">📱 Upload Clip</div>
                    <p>Contributors: 12 people | Pool value: $234</p>
                  </div>
                </div>
                <div className="nft-showcase">
                  <h4>Recent NFT Mints:</h4>
                  <div className="nft-grid">
                    <div className="nft-card">🎵 "Epic Solo" - 0.5 ETH</div>
                    <div className="nft-card">🔥 "Crowd Reaction" - 0.3 ETH</div>
                  </div>
                </div>
                <div className="revenue-sharing">
                  <h4>Your Earnings: $23.50</h4>
                  <p>From 3 clips contributed this month</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'influence':
        return (
          <div className="feature-demo-content">
            <div className="demo-showcase">
              <h3>⚡ Influence {selectedPerformer} Live</h3>
              <div className="mock-influence-interface">
                <div className="live-analytics">
                  <h4>Real-Time Analytics:</h4>
                  <div className="stats-grid">
                    <div className="stat">🎯 Engagement: 94%</div>
                    <div className="stat">💰 Tips: $456</div>
                    <div className="stat">👥 Audience: 89 people</div>
                  </div>
                </div>
                <div className="influence-controls">
                  <h4>Tip to Influence:</h4>
                  <div className="tip-options">
                    <button>$5 - Song Request</button>
                    <button>$10 - Genre Change</button>
                    <button>$25 - Dedicate Song</button>
                  </div>
                </div>
                <div className="performance-steering">
                  <h4>Audience Feedback:</h4>
                  <div className="feedback-bar">
                    <div className="feedback-positive" style={{width: '78%'}}>😍 Love it (78%)</div>
                    <div className="feedback-neutral" style={{width: '15%'}}>😐 OK (15%)</div>
                    <div className="feedback-negative" style={{width: '7%'}}>😴 Boring (7%)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'reputation':
        return (
          <div className="feature-demo-content">
            <div className="demo-showcase">
              <h3>🏆 {selectedPerformer}'s Reputation System</h3>
              <div className="mock-reputation-interface">
                <div className="reputation-overview">
                  <div className="rep-score">
                    <h4>Reputation Score: 2,341</h4>
                    <div className="tier-badge diamond">💎 Diamond Tier</div>
                  </div>
                  <div className="proof-badges">
                    <h4>Proof-of-Presence NFTs:</h4>
                    <div className="badge-grid">
                      <div className="nft-badge">🎭 SXSW 2024</div>
                      <div className="nft-badge">🎵 Coachella 2024</div>
                      <div className="nft-badge">🎪 Burning Man 2023</div>
                    </div>
                  </div>
                </div>
                <div className="reputation-stats">
                  <h4>Cross-Event Performance:</h4>
                  <div className="stats">
                    <div>🎯 Prediction Accuracy: 89%</div>
                    <div>📈 Viral Content Spotted: 23</div>
                    <div>🏆 Events Attended: 156</div>
                    <div>⭐ Average Rating: 4.8/5</div>
                  </div>
                </div>
                <div className="exclusive-access">
                  <h4>Diamond Tier Benefits:</h4>
                  <div>✅ VIP Event Access</div>
                  <div>✅ Early NFT Drops</div>
                  <div>✅ Revenue Share Bonus</div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <ArtistProfiles
            artist={selectedPerformer}
            onClose={onClose}
            onBack={handleBackToDashboard}
            demoMode={featureType}
          />
        );
    }
  };

  const handleBackToDashboard = () => {
    setShowArtistProfile(false);
    setSelectedPerformer(null);
  };

  if (showArtistProfile && selectedPerformer) {
    console.log('Rendering feature demo for:', selectedPerformer, 'feature:', featureType);

    const featureTitle = {
      connection: `🎯 Instant Connection with ${selectedPerformer}`,
      bounty: `💰 Create Bounty for ${selectedPerformer}`,
      tokenization: `🎬 ${selectedPerformer}'s Content Pool`,
      influence: `⚡ Influence ${selectedPerformer} Live`,
      reputation: `🏆 ${selectedPerformer}'s Reputation`,
      demo: `🎭 ${selectedPerformer} Profile`
    };

    const featureDesc = {
      connection: 'Experience GPS-powered instant connection and speaker discovery',
      bounty: 'Create and manage bounties for specific performance content',
      tokenization: 'Explore content pools, NFT minting, and revenue sharing',
      influence: 'See real-time analytics and tip-to-influence mechanics',
      reputation: 'Browse reputation scoring and proof-of-presence system',
      demo: 'Interactive artist profile experience'
    };

    return (
      <div className="modal-overlay">
        <div className="modal performer-dashboard-modal feature-demo-modal">
          <div className="modal-header">
            <div>
              <h2>{featureTitle[featureType]}</h2>
              <p className="feature-description">{featureDesc[featureType]}</p>
            </div>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="modal-body" style={{
            padding: featureType === 'demo' ? 0 : 'var(--space-lg)',
            overflow: 'auto'
          }}>
            {renderFeatureDemo()}
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
                className={`performer-card ${featureType}-feature`}
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
                  <div className="feature-badge">
                    {featureType === 'connection' && '🎯'}
                    {featureType === 'bounty' && '💰'}
                    {featureType === 'tokenization' && '🎬'}
                    {featureType === 'influence' && '⚡'}
                    {featureType === 'reputation' && '🏆'}
                    {featureType === 'demo' && '🎭'}
                  </div>
                </div>

                <div className="performer-info">
                  <h3 className="performer-name">{performer.name}</h3>
                  <p className="performer-genre">{performer.genre}</p>
                  {performer.currentSong && (
                    <p className="current-song">
                      {featureType === 'connection' && '📍 '}
                      {featureType === 'bounty' && '💰 '}
                      {featureType === 'tokenization' && '🎬 '}
                      {featureType === 'influence' && '⚡ '}
                      {featureType === 'reputation' && '🏆 '}
                      {featureType === 'demo' && '🎵 '}
                      {performer.currentSong}
                    </p>
                  )}
                  <p className="performer-bio">{performer.bio}</p>

                  <div className="performer-stats">
                    <div className="stat">
                      <span className="stat-value">{performer.tipCount}</span>
                      <span className="stat-label">
                        {featureType === 'reputation' ? 'Rep Points' : 'Tips'}
                      </span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{performer.reputation}</span>
                      <span className="stat-label">Rating</span>
                    </div>
                  </div>
                </div>

                <div className="performer-actions">
                  <button
                    className={`btn btn-primary btn-sm ${featureType}-btn`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePerformerSelect(performer);
                    }}
                  >
                    {featureType === 'connection' && 'Connect Now'}
                    {featureType === 'bounty' && 'Create Bounty'}
                    {featureType === 'tokenization' && 'View Pool'}
                    {featureType === 'influence' && 'Influence Live'}
                    {featureType === 'reputation' && 'Check Rep'}
                    {featureType === 'demo' && 'View Profile'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="dashboard-footer">
            <div className="feature-highlight">
              {featureType === 'connection' && (
                <div className="highlight-content">
                  <h4>🎯 GPS Magic in Action</h4>
                  <p>Each card shows real-time venue detection, current speakers, and networking opportunities. Click to experience instant connection!</p>
                </div>
              )}
              {featureType === 'bounty' && (
                <div className="highlight-content">
                  <h4>💰 Active Bounty System</h4>
                  <p>These performers are actively fulfilling community-created bounties. Create your own to incentivize specific content!</p>
                </div>
              )}
              {featureType === 'tokenization' && (
                <div className="highlight-content">
                  <h4>🎬 Content Pool Economics</h4>
                  <p>See how viral moments become NFTs with revenue sharing. Contributors earn when their clips are used or go viral!</p>
                </div>
              )}
              {featureType === 'influence' && (
                <div className="highlight-content">
                  <h4>⚡ Real-Time Influence</h4>
                  <p>Watch how tips and audience reactions shape performances live. Analytics show the direct impact of your participation!</p>
                </div>
              )}
              {featureType === 'reputation' && (
                <div className="highlight-content">
                  <h4>🏆 Cross-Event Reputation</h4>
                  <p>These users have built reputation across multiple venues and events. Their on-chain proof unlocks exclusive access!</p>
                </div>
              )}
              {featureType === 'demo' && (
                <div className="highlight-content">
                  <h4>🎭 Real Artist Profiles</h4>
                  <p>Papa, Anatu & Andrew are real artists with full social integration. Experience the complete MegaVibe artist interaction flow!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
