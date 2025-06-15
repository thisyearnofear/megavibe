import React, { useState } from 'react';
import ArtistProfiles from '../ArtistProfiles';
import '../../styles/PerformerDashboard.css';
import '../../styles/FeatureDemo.css';

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
    tiktok?: string;
    opensea?: string;
    website?: string;
    twitch?: string;
    foundation?: string;
    linkedin?: string;
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
              <h3>🎯 GPS Magic: Instant Venue Connection</h3>
              <div className="connection-flow">
                <div className="step-indicator">
                  <div className="step active">1. Detect</div>
                  <div className="step active">2. Connect</div>
                  <div className="step active">3. Discover</div>
                </div>

                <div className="mock-connection-interface">
                  <div className="venue-detected">
                    <h4>📍 {selectedPerformer} at Blue Note NYC</h4>
                    <p>Confidence: 98% | Distance: 15m | Auto-connected</p>

                    <div className="live-info">
                      <div className="now-playing">
                        <h5>🎵 Now Playing:</h5>
                        <p>"Midnight Blues" - Live improvisation</p>
                        <div className="audio-visualizer">
                          <div className="bar"></div>
                          <div className="bar"></div>
                          <div className="bar"></div>
                          <div className="bar"></div>
                        </div>
                      </div>
                    </div>

                    <div className="attendee-section">
                      <h5>🤝 Connect with 23 people here:</h5>
                      <div className="attendee-grid">
                        <div className="attendee-card">
                          <span className="avatar">👨‍💻</span>
                          <div>
                            <strong>Alex Chen</strong>
                            <p>Blockchain Dev at Ethereum</p>
                            <button className="connect-btn">Connect</button>
                          </div>
                        </div>
                        <div className="attendee-card">
                          <span className="avatar">🎵</span>
                          <div>
                            <strong>Sarah Kim</strong>
                            <p>Music Producer</p>
                            <button className="connect-btn">Connect</button>
                          </div>
                        </div>
                        <div className="attendee-card">
                          <span className="avatar">🎤</span>
                          <div>
                            <strong>Mike Torres</strong>
                            <p>Sound Engineer</p>
                            <button className="connect-btn">Connect</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="venue-features">
                      <h5>📱 Available Actions:</h5>
                      <div className="action-buttons">
                        <button className="action-btn">💬 Join Chat</button>
                        <button className="action-btn">🎤 Request Song</button>
                        <button className="action-btn">📸 Share Moment</button>
                        <button className="action-btn">💰 Send Tip</button>
                      </div>
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
              <h3>💰 Interactive Bounty System</h3>
              <div className="bounty-flow">
                <div className="step-indicator">
                  <div className="step">1. Browse</div>
                  <div className="step active">2. Create</div>
                  <div className="step">3. Fulfill</div>
                  <div className="step">4. Reward</div>
                </div>

                <div className="mock-bounty-interface">
                  <div className="bounty-creator">
                    <h4>💡 Create New Bounty for {selectedPerformer}</h4>
                    <div className="bounty-form">
                      <div className="form-group">
                        <label>🎯 What do you want to hear?</label>
                        <input type="text" placeholder="Play 'Bohemian Rhapsody' acoustic version" />
                        <div className="suggestion-chips">
                          <span className="chip">Song Request</span>
                          <span className="chip">Genre Switch</span>
                          <span className="chip">Collaboration</span>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>💰 Bounty Amount (USDC)</label>
                        <div className="amount-selector">
                          <button>25</button>
                          <button className="selected">50</button>
                          <button>100</button>
                          <button>Custom</button>
                        </div>
                        <p className="helper-text">Higher amounts get priority attention</p>
                      </div>

                      <div className="form-group">
                        <label>⏰ Time Limit</label>
                        <select>
                          <option>Within this set</option>
                          <option>Next 30 minutes</option>
                          <option>Tonight only</option>
                        </select>
                      </div>

                      <button className="create-bounty-btn">🚀 Post Bounty (50 USDC)</button>
                    </div>
                  </div>

                  <div className="active-bounties">
                    <h4>🔥 Live Bounties for {selectedPerformer}:</h4>
                    <div className="bounty-list">
                      <div className="bounty-item priority">
                        <div className="bounty-header">
                          <span className="amount">💰 150 USDC</span>
                          <span className="status new">NEW</span>
                        </div>
                        <p className="request">"Duet with someone from audience"</p>
                        <div className="bounty-meta">
                          <span>⏰ 45 min left</span>
                          <span>👥 3 supporters</span>
                          <button className="support-btn">+25 USDC</button>
                        </div>
                      </div>

                      <div className="bounty-item">
                        <div className="bounty-header">
                          <span className="amount">💰 75 USDC</span>
                          <span className="status active">ACTIVE</span>
                        </div>
                        <p className="request">"Play something from the 90s"</p>
                        <div className="bounty-meta">
                          <span>⏰ 20 min left</span>
                          <span>👥 2 supporters</span>
                          <button className="support-btn">Support</button>
                        </div>
                      </div>

                      <div className="bounty-item completed">
                        <div className="bounty-header">
                          <span className="amount">💰 100 USDC</span>
                          <span className="status completed">✅ COMPLETED</span>
                        </div>
                        <p className="request">"Freestyle about blockchain"</p>
                        <div className="bounty-meta">
                          <span>✨ Just completed!</span>
                          <span>🎉 Payout sent</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bounty-stats">
                    <h4>📊 Bounty Economics</h4>
                    <div className="stats-grid">
                      <div className="stat-card">
                        <span className="stat-value">$2,340</span>
                        <span className="stat-label">Total Earned</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-value">89%</span>
                        <span className="stat-label">Fulfillment Rate</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-value">23</span>
                        <span className="stat-label">Active Bounties</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'tokenization':
        return (
          <div className="feature-demo-content">
            <div className="demo-showcase">
              <h3>🎬 Content Pool & NFT Tokenization</h3>
              <div className="tokenization-flow">
                <div className="step-indicator">
                  <div className="step">1. Capture</div>
                  <div className="step active">2. Pool</div>
                  <div className="step">3. Mint</div>
                  <div className="step">4. Earn</div>
                </div>

                <div className="mock-tokenization-interface">
                  <div className="content-pool-section">
                    <h4>🎪 {selectedPerformer}'s Live Content Pool</h4>
                    <div className="pool-overview">
                      <div className="pool-stats">
                        <div className="stat">
                          <span className="value">47</span>
                          <span className="label">Contributors</span>
                        </div>
                        <div className="stat">
                          <span className="value">$1,234</span>
                          <span className="label">Pool Value</span>
                        </div>
                        <div className="stat">
                          <span className="value">156</span>
                          <span className="label">Clips</span>
                        </div>
                      </div>
                    </div>

                    <div className="contribution-section">
                      <h5>📱 Contribute Content</h5>
                      <div className="upload-options">
                        <div className="upload-card">
                          <span className="icon">📹</span>
                          <h6>Video Clip</h6>
                          <p>5 USDC entry fee</p>
                          <button className="upload-btn">Upload Video</button>
                        </div>
                        <div className="upload-card">
                          <span className="icon">🎵</span>
                          <h6>Audio Only</h6>
                          <p>3 USDC entry fee</p>
                          <button className="upload-btn">Upload Audio</button>
                        </div>
                        <div className="upload-card">
                          <span className="icon">📸</span>
                          <h6>Photo Series</h6>
                          <p>2 USDC entry fee</p>
                          <button className="upload-btn">Upload Photos</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="nft-showcase">
                    <h4>🚀 Recent NFT Mints</h4>
                    <div className="nft-grid">
                      <div className="nft-card featured">
                        <div className="nft-image">🎵</div>
                        <div className="nft-info">
                          <h6>"Epic Guitar Solo"</h6>
                          <p>Minted 2 hours ago</p>
                          <div className="nft-price">
                            <span className="current">0.8 ETH</span>
                            <span className="trend up">+23%</span>
                          </div>
                          <div className="contributors">
                            <span>3 contributors earned</span>
                          </div>
                        </div>
                      </div>

                      <div className="nft-card">
                        <div className="nft-image">🔥</div>
                        <div className="nft-info">
                          <h6>"Crowd Goes Wild"</h6>
                          <p>Minted 1 day ago</p>
                          <div className="nft-price">
                            <span className="current">0.5 ETH</span>
                            <span className="trend up">+8%</span>
                          </div>
                          <div className="contributors">
                            <span>7 contributors earned</span>
                          </div>
                        </div>
                      </div>

                      <div className="nft-card">
                        <div className="nft-image">⚡</div>
                        <div className="nft-info">
                          <h6>"Lightning Fingers"</h6>
                          <p>Minted 3 days ago</p>
                          <div className="nft-price">
                            <span className="current">0.3 ETH</span>
                            <span className="trend stable">→</span>
                          </div>
                          <div className="contributors">
                            <span>5 contributors earned</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="revenue-section">
                    <h4>💰 Your Revenue Dashboard</h4>
                    <div className="earnings-overview">
                      <div className="total-earnings">
                        <span className="amount">$127.50</span>
                        <span className="period">This Month</span>
                      </div>
                      <div className="earnings-breakdown">
                        <div className="earning-item">
                          <span className="source">🎵 "Epic Solo" NFT</span>
                          <span className="amount">$45.20</span>
                        </div>
                        <div className="earning-item">
                          <span className="source">🔥 "Crowd Reaction" NFT</span>
                          <span className="amount">$32.15</span>
                        </div>
                        <div className="earning-item">
                          <span className="source">📱 Pool Contributions</span>
                          <span className="amount">$50.15</span>
                        </div>
                      </div>
                    </div>

                    <div className="smart-contract-info">
                      <h5>⚙️ Smart Contract Details</h5>
                      <div className="contract-details">
                        <div className="detail">
                          <span className="label">Revenue Split:</span>
                          <span className="value">60% Contributors, 30% Artist, 10% Platform</span>
                        </div>
                        <div className="detail">
                          <span className="label">Royalties:</span>
                          <span className="value">5% on all secondary sales</span>
                        </div>
                        <div className="detail">
                          <span className="label">Auto-Payout:</span>
                          <span className="value">Weekly to your wallet</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'influence':
        return (
          <div className="feature-demo-content">
            <div className="demo-showcase">
              <h3>⚡ Real-Time Performance Influence</h3>
              <div className="influence-flow">
                <div className="step-indicator">
                  <div className="step">1. React</div>
                  <div className="step active">2. Tip</div>
                  <div className="step">3. Influence</div>
                  <div className="step">4. Impact</div>
                </div>

                <div className="mock-influence-interface">
                  <div className="live-dashboard">
                    <h4>📊 Live Performance Dashboard</h4>
                    <div className="real-time-stats">
                      <div className="stat-card primary">
                        <span className="stat-icon">⚡</span>
                        <div className="stat-content">
                          <span className="stat-value">94%</span>
                          <span className="stat-label">Energy Level</span>
                          <div className="stat-trend up">+12% from tips</div>
                        </div>
                      </div>
                      <div className="stat-card">
                        <span className="stat-icon">💰</span>
                        <div className="stat-content">
                          <span className="stat-value">$1,456</span>
                          <span className="stat-label">Tips Tonight</span>
                          <div className="stat-trend up">+$89 last 10min</div>
                        </div>
                      </div>
                      <div className="stat-card">
                        <span className="stat-icon">👥</span>
                        <div className="stat-content">
                          <span className="stat-value">127</span>
                          <span className="stat-label">Active Audience</span>
                          <div className="stat-trend up">+23 since last song</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="influence-controls">
                    <h4>🎯 Influence the Performance</h4>
                    <div className="tip-influence-grid">
                      <div className="influence-category">
                        <h5>🎵 Music Direction</h5>
                        <div className="tip-options">
                          <button className="tip-btn trending">
                            <span className="amount">$15</span>
                            <span className="action">More Jazz</span>
                            <span className="votes">23 votes</span>
                          </button>
                          <button className="tip-btn">
                            <span className="amount">$8</span>
                            <span className="action">Acoustic Set</span>
                            <span className="votes">12 votes</span>
                          </button>
                          <button className="tip-btn">
                            <span className="amount">$25</span>
                            <span className="action">Duet Request</span>
                            <span className="votes">5 votes</span>
                          </button>
                        </div>
                      </div>

                      <div className="influence-category">
                        <h5>🔥 Energy Boost</h5>
                        <div className="tip-options">
                          <button className="tip-btn hot">
                            <span className="amount">$50</span>
                            <span className="action">Hype Up!</span>
                            <span className="votes">8 votes</span>
                          </button>
                          <button className="tip-btn">
                            <span className="amount">$20</span>
                            <span className="action">Chill Vibes</span>
                            <span className="votes">15 votes</span>
                          </button>
                        </div>
                      </div>

                      <div className="influence-category">
                        <h5>🎤 Interaction</h5>
                        <div className="tip-options">
                          <button className="tip-btn">
                            <span className="amount">$10</span>
                            <span className="action">Crowd Q&A</span>
                            <span className="votes">18 votes</span>
                          </button>
                          <button className="tip-btn">
                            <span className="amount">$30</span>
                            <span className="action">Story Time</span>
                            <span className="votes">7 votes</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="performance-feedback">
                    <h4>📈 Live Audience Sentiment</h4>
                    <div className="sentiment-visualization">
                      <div className="sentiment-bar">
                        <div className="sentiment-segment love" style={{width: '68%'}}>
                          <span className="emoji">😍</span>
                          <span className="percentage">68%</span>
                        </div>
                        <div className="sentiment-segment excited" style={{width: '22%'}}>
                          <span className="emoji">🔥</span>
                          <span className="percentage">22%</span>
                        </div>
                        <div className="sentiment-segment neutral" style={{width: '8%'}}>
                          <span className="emoji">😐</span>
                          <span className="percentage">8%</span>
                        </div>
                        <div className="sentiment-segment bored" style={{width: '2%'}}>
                          <span className="emoji">😴</span>
                          <span className="percentage">2%</span>
                        </div>
                      </div>
                    </div>

                    <div className="recent-reactions">
                      <h5>💬 Live Reactions</h5>
                      <div className="reaction-stream">
                        <div className="reaction">💰 Sarah tipped $25 for "More bass!"</div>
                        <div className="reaction">🎵 Mike requested "Play Wonderwall!"</div>
                        <div className="reaction">🔥 Alex boosted energy with $15</div>
                        <div className="reaction">😍 Emma loves the current vibe</div>
                      </div>
                    </div>
                  </div>

                  <div className="influence-impact">
                    <h4>📊 Your Influence Impact</h4>
                    <div className="impact-metrics">
                      <div className="impact-stat">
                        <span className="label">Songs Influenced:</span>
                        <span className="value">3 tonight</span>
                      </div>
                      <div className="impact-stat">
                        <span className="label">Energy Contribution:</span>
                        <span className="value">+15% boost</span>
                      </div>
                      <div className="impact-stat">
                        <span className="label">Tip Effectiveness:</span>
                        <span className="value">92% success rate</span>
                      </div>
                    </div>

                    <div className="influence-rewards">
                      <h5>🏆 Influence Rewards Earned</h5>
                      <div className="reward-badges">
                        <div className="badge">🎯 Vibe Curator</div>
                        <div className="badge">💰 Top Tipper</div>
                        <div className="badge">🎵 Taste Maker</div>
                      </div>
                    </div>
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
              <h3>🏆 Cross-Event Reputation System</h3>
              <div className="reputation-flow">
                <div className="step-indicator">
                  <div className="step">1. Attend</div>
                  <div className="step">2. Contribute</div>
                  <div className="step active">3. Build Rep</div>
                  <div className="step">4. Unlock</div>
                </div>

                <div className="mock-reputation-interface">
                  <div className="reputation-profile">
                    <div className="profile-header">
                      <div className="avatar-section">
                        <div className="rep-avatar">🎭</div>
                        <div className="tier-display">
                          <div className="tier-badge diamond">💎 Diamond Curator</div>
                          <div className="tier-progress">
                            <div className="progress-bar">
                              <div className="progress-fill" style={{width: '78%'}}></div>
                            </div>
                            <span className="progress-text">2,341 / 3,000 to Platinum</span>
                          </div>
                        </div>
                      </div>

                      <div className="reputation-score">
                        <h4>{selectedPerformer}'s Reputation Score</h4>
                        <div className="score-display">
                          <span className="score-number">2,341</span>
                          <span className="score-trend">+89 this week</span>
                        </div>
                      </div>
                    </div>

                    <div className="proof-of-presence">
                      <h4>🎫 Proof-of-Presence NFT Collection</h4>
                      <div className="nft-collection">
                        <div className="nft-badge verified">
                          <span className="badge-icon">🎭</span>
                          <div className="badge-info">
                            <span className="event">SXSW 2024</span>
                            <span className="date">March 15, 2024</span>
                            <span className="verification">✓ On-chain verified</span>
                          </div>
                        </div>
                        <div className="nft-badge verified">
                          <span className="badge-icon">🎵</span>
                          <div className="badge-info">
                            <span className="event">Coachella 2024</span>
                            <span className="date">April 12, 2024</span>
                            <span className="verification">✓ GPS + Photo proof</span>
                          </div>
                        </div>
                        <div className="nft-badge verified">
                          <span className="badge-icon">🎪</span>
                          <div className="badge-info">
                            <span className="event">Burning Man 2023</span>
                            <span className="date">August 28, 2023</span>
                            <span className="verification">✓ Community verified</span>
                          </div>
                        </div>
                        <div className="nft-badge recent">
                          <span className="badge-icon">🎤</span>
                          <div className="badge-info">
                            <span className="event">Blue Note Tonight</span>
                            <span className="date">Live now</span>
                            <span className="verification">⏳ Minting...</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="reputation-breakdown">
                      <h4>📊 Reputation Breakdown</h4>
                      <div className="rep-categories">
                        <div className="rep-category">
                          <div className="category-header">
                            <span className="category-icon">🎯</span>
                            <span className="category-name">Prediction Accuracy</span>
                            <span className="category-score">892 pts</span>
                          </div>
                          <div className="category-detail">89% success rate spotting viral moments</div>
                        </div>

                        <div className="rep-category">
                          <div className="category-header">
                            <span className="category-icon">💰</span>
                            <span className="category-name">Economic Impact</span>
                            <span className="category-score">634 pts</span>
                          </div>
                          <div className="category-detail">$12,450 in tips distributed to artists</div>
                        </div>

                        <div className="rep-category">
                          <div className="category-header">
                            <span className="category-icon">🤝</span>
                            <span className="category-name">Community Building</span>
                            <span className="category-score">567 pts</span>
                          </div>
                          <div className="category-detail">Connected 234 people across events</div>
                        </div>

                        <div className="rep-category">
                          <div className="category-header">
                            <span className="category-icon">📈</span>
                            <span className="category-name">Content Curation</span>
                            <span className="category-score">248 pts</span>
                          </div>
                          <div className="category-detail">23 viral moments discovered first</div>
                        </div>
                      </div>
                    </div>

                    <div className="reputation-benefits">
                      <h4>💎 Diamond Tier Exclusive Benefits</h4>
                      <div className="benefits-grid">
                        <div className="benefit-card">
                          <span className="benefit-icon">🎫</span>
                          <div className="benefit-content">
                            <h6>VIP Event Access</h6>
                            <p>Skip lines, backstage passes, early entry</p>
                          </div>
                        </div>
                        <div className="benefit-card">
                          <span className="benefit-icon">🚀</span>
                          <div className="benefit-content">
                            <h6>Early NFT Drops</h6>
                            <p>24-hour priority access to all mints</p>
                          </div>
                        </div>
                        <div className="benefit-card">
                          <span className="benefit-icon">💸</span>
                          <div className="benefit-content">
                            <h6>Revenue Bonus</h6>
                            <p>15% extra on all content pool earnings</p>
                          </div>
                        </div>
                        <div className="benefit-card">
                          <span className="benefit-icon">🎯</span>
                          <div className="benefit-content">
                            <h6>Curator Powers</h6>
                            <p>Vote on featured content and artists</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="reputation-network">
                      <h4>🌐 Cross-Event Network</h4>
                      <div className="network-stats">
                        <div className="network-stat">
                          <span className="stat-label">Events Attended:</span>
                          <span className="stat-value">156 venues</span>
                        </div>
                        <div className="network-stat">
                          <span className="stat-label">Cities Visited:</span>
                          <span className="stat-value">47 cities</span>
                        </div>
                        <div className="network-stat">
                          <span className="stat-label">Artists Supported:</span>
                          <span className="stat-value">89 artists</span>
                        </div>
                        <div className="network-stat">
                          <span className="stat-label">Network Rating:</span>
                          <span className="stat-value">4.9/5.0 ⭐</span>
                        </div>
                      </div>
                    </div>
                  </div>
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
              <button
                className="btn btn-outline btn-sm"
                onClick={handleBackToDashboard}
                style={{ marginBottom: 'var(--space-sm)' }}
              >
                ← Back to Artists
              </button>
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
