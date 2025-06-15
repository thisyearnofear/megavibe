import React, { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import './styles/design-system.css';
import './App.css';
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { DynamicWagmiConnector } from '@dynamic-labs/wagmi-connector';
import { createConfig, WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'viem';
import { mainnet } from 'viem/chains';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import { EnhancedWalletConnector as WalletConnector } from './components/Shared/EnhancedWalletConnector';
import { Venue } from './services/locationService';
import realtimeService, { SongChangeEvent } from './services/realtimeService';

// Lazy load components for performance optimization
const VenuePicker = lazy(() =>
  import('./components/LiveMusic/VenuePicker').then(module => ({
    default: module.VenuePicker,
  }))
);
const MegaVibeButton = lazy(() =>
  import('./components/LiveMusic/EnhancedMegaVibeButton').then(module => ({
    default: module.EnhancedMegaVibeButton,
  }))
);
const SongIdentifier = lazy(() =>
  import('./components/LiveMusic/SongIdentifier').then(module => ({
    default: module.SongIdentifier,
  }))
);
const VenueContentMarketplace = lazy(() =>
  import('./components/LiveMusic/VenueContentMarketplace').then(module => ({
    default: module.default,
  }))
);
const PerformerDashboard = lazy(() =>
  import('./components/Demo/PerformerDashboard').then(module => ({
    default: module.PerformerDashboard,
  }))
);
const ArtistSupport = lazy(() =>
  import('./components/LiveMusic/ArtistSupport').then(module => ({
    default: module.default,
  }))
);
const AudioFeed = lazy(() =>
  import('./components/Social/AudioFeed').then(module => ({
    default: module.AudioFeed,
  }))
);


// Wagmi configuration for Mantle Mainnet (will be updated with correct chain ID)
const config = createConfig({
  chains: [mainnet],
  multiInjectedProviderDiscovery: false,
  transports: {
    [mainnet.id]: http(),
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false, // Avoid unnecessary refetches
    },
  },
});

function App() {
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [showVenuePicker, setShowVenuePicker] = useState(false); // Changed to false - no auto-popup
  const [currentSong, setCurrentSong] = useState<SongChangeEvent | null>(null);
  const [showSongIdentifier, setShowSongIdentifier] = useState(false);
  const [activeView, setActiveView] = useState<'live' | 'social'>('live');
  const [error, setError] = useState<string | null>(null);
  const [connectedWalletAddress, setConnectedWalletAddress] = useState<
    string | undefined
  >(undefined);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [tutorialStep, setTutorialStep] = useState<number>(0);
  const [showPerformerDashboard, setShowPerformerDashboard] = useState(false);
  const [selectedFeatureType, setSelectedFeatureType] = useState<'connection' | 'bounty' | 'tokenization' | 'influence' | 'reputation' | 'demo'>('demo');

  const appRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);

  useGSAP(() => {
    if (appRef.current) {
      gsap.fromTo(
        appRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 1.5, ease: 'power3.out' }
      );
    }

    if (navRef.current) {
      gsap.fromTo(
        navRef.current,
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, delay: 0.5, ease: 'power3.out' }
      );
    }

    if (mainRef.current) {
      gsap.fromTo(
        mainRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1.2, delay: 1, ease: 'power3.out' }
      );
    }
  }, []);

  // Check if it's the user's first visit using localStorage
  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedMegaVibe');
    if (!hasVisited) {
      setShowTutorial(true);
      localStorage.setItem('hasVisitedMegaVibe', 'true');
    }
  }, []);

  const handleNextTutorialStep = () => {
    setTutorialStep(prev => prev + 1);
  };

  const handleSkipTutorial = () => {
    setShowTutorial(false);
    setTutorialStep(0);
  };

  const handleFeatureCardClick = (featureType: 'connection' | 'bounty' | 'tokenization' | 'influence' | 'reputation' | 'demo') => {
    setSelectedFeatureType(featureType);
    setShowPerformerDashboard(true);
  };

  // Remove automatic location detection on app load
  // Location will only be requested when user explicitly clicks "Find Nearby Venues"

  const handleVenueSelect = (venue: Venue) => {
    setSelectedVenue(venue);
    setShowVenuePicker(false);

    // Connect to venue's real-time updates
    if (venue.id) {
      realtimeService.connect();
      realtimeService.joinVenue(venue.id);
    }
  };

  const handleSongIdentified = (song: SongChangeEvent) => {
    setCurrentSong(song);
    setShowSongIdentifier(true);
  };

  const handleCloseSongIdentifier = () => {
    setShowSongIdentifier(false);
    setCurrentSong(null);
  };

  const handleWalletConnect = (address: string) => {
    setConnectedWalletAddress(address);
    // Additional logic can be added here for wallet connection effects
  };

  const handleWalletDisconnect = () => {
    setConnectedWalletAddress(undefined);
  };

  return (
    <DynamicContextProvider
      settings={{
        environmentId: 'cd08ffe6-e5d5-49d4-8cb3-f9419a7f5e4d',
        walletConnectors: [EthereumWalletConnectors],
      }}
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>
            <div className="App" ref={appRef}>
              {/* Navigation */}
              <nav className="app-nav" ref={navRef}>
                <div className="nav-container">
                  <div className="nav-brand">
                    <h1>MEGA<span className="brand-accent">VIBE</span></h1>
                  </div>
                  <div className="nav-tabs">
                    <button
                      className={`nav-tab ${
                        activeView === 'live' ? 'active' : ''
                      }`}
                      onClick={() => setActiveView('live')}
                    >
                      🎵 Live Vibes
                    </button>
                    <button
                      className={`nav-tab ${
                        activeView === 'social' ? 'active' : ''
                      }`}
                      onClick={() => setActiveView('social')}
                    >
                      🎙️ Social Feed
                    </button>
                  </div>
                  <div className="nav-actions">
                    <button
                      className="venue-selector"
                      onClick={() => setShowVenuePicker(true)}
                    >
                      📍 {selectedVenue ? selectedVenue.name : 'Find Venues'}
                    </button>
                    <div className="wallet-connector-wrapper">
                      <WalletConnector
                        onConnect={handleWalletConnect}
                        onDisconnect={handleWalletDisconnect}
                        connectedAddress={connectedWalletAddress}
                        compact={true}
                        showBalance={false}
                      />
                    </div>
                  </div>
                </div>
              </nav>

              {/* Main Content */}
              <main className="app-content" ref={mainRef}>
                {error && (
                  <div className="error-banner">
                    {error}
                    <button onClick={() => setError(null)}>×</button>
                  </div>
                )}

                {activeView === 'live' ? (
                  <div className="live-view">
                    {selectedVenue ? (
                      <>
                        <div className="venue-info">
                          <h2>{selectedVenue.name}</h2>
                          <p>{selectedVenue.address}</p>
                          {selectedVenue.currentEvent && (
                            <div className="event-info">
                              <span className="live-badge">LIVE NOW</span>
                              <span>{selectedVenue.currentEvent.name}</span>
                            </div>
                          )}
                        </div>

                        <div className="megavibe-section">
                          <Suspense
                            fallback={<div>Loading MegaVibe Button...</div>}
                          >
                            <MegaVibeButton
                              venueId={selectedVenue.id}
                              onSongIdentified={handleSongIdentified}
                            />
                          </Suspense>
                        </div>

                        {!selectedVenue.currentEvent && (
                          <div className="no-event-message">
                            <h3>No Live Event</h3>
                            <p>No live event at this venue right now.</p>
                            <p>Check back during show times!</p>
                          </div>
                        )}

                        {selectedVenue.currentEvent && (
                          <Suspense
                            fallback={<div>Loading Artist Support...</div>}
                          >
                            <ArtistSupport
                              artistName={
                                selectedVenue.currentEvent.artists?.[0] ||
                                'Current Artist'
                              }
                              venueId={selectedVenue.id}
                              onTipSent={amount =>
                                console.log(`Tip sent: ${amount} ETH`)
                              }
                            />
                          </Suspense>
                        )}

                        <Suspense
                          fallback={<div>Loading Venue Content...</div>}
                        >
                          <VenueContentMarketplace venueId={selectedVenue.id} />
                        </Suspense>
                      </>
                    ) : (
                      <div className="welcome-screen">
                        <div className="welcome-hero">
                          <h1 className="welcome-title">
                            TURN UP. TUNE IN.{' '}
                            <span className="brand-gradient">VIBE OUT.</span>
                          </h1>
                          <p className="welcome-subtitle">
                            <strong>MegaVibe</strong> transforms any live experience into a collaborative content creation and monetization ecosystem.
                            Walk into any venue, instantly connect with performers and audiences, create bounties for content, and earn on-chain.
                          </p>

                        </div>

                        <div className="features-showcase">
                          <div className="showcase-header">
                            <h2>🚀 Experience All Features</h2>
                            <p>Click any feature below to see it in action with real artist profiles</p>
                          </div>

                          <div className="welcome-features">
                            <div className="feature-card implemented" onClick={() => handleFeatureCardClick('connection')}>
                              <div className="feature-status">
                                <span className="status-badge implemented">✅ LIVE</span>
                              </div>
                              <div className="feature-icon-wrapper">
                                <div className="vinyl-record"></div>
                              </div>
                              <h3>🎯 Instant Connection</h3>
                              <p><strong>GPS Magic:</strong> Walk into any venue and instantly know who's performing, what's happening, and who else is there. Zero friction discovery.</p>
                              <div className="feature-cta">
                                <span>Try with Papa, Anatu & Andrew →</span>
                              </div>
                            </div>

                            <div className="feature-card implemented" onClick={() => handleFeatureCardClick('bounty')}>
                              <div className="feature-status">
                                <span className="status-badge implemented">✅ LIVE</span>
                              </div>
                              <div className="feature-icon-wrapper">
                                <div className="sound-wave">
                                  <div className="sound-wave-bar"></div>
                                  <div className="sound-wave-bar"></div>
                                  <div className="sound-wave-bar"></div>
                                  <div className="sound-wave-bar"></div>
                                  <div className="sound-wave-bar"></div>
                                </div>
                              </div>
                              <h3>💰 Bounty Requests</h3>
                              <p><strong>Pay for Content:</strong> Create bounties for specific performances - "50 USDC for funniest ZK proofs talk" - foster fun incentives.</p>
                              <div className="feature-cta">
                                <span>Demo Bounty System →</span>
                              </div>
                            </div>

                            <div className="feature-card implemented" onClick={() => handleFeatureCardClick('tokenization')}>
                              <div className="feature-status">
                                <span className="status-badge implemented">✅ LIVE</span>
                              </div>
                              <div className="feature-icon-wrapper">
                                <div className="status-indicator status-live">
                                  <span>NFT</span>
                                </div>
                              </div>
                              <h3>🎬 Moment Tokenization</h3>
                              <p><strong>Own Viral Clips:</strong> Contribute content to pools, earn when it's used, and watch viral moments become tradeable assets.</p>
                              <div className="feature-cta">
                                <span>See NFT Creation →</span>
                              </div>
                            </div>

                            <div className="feature-card implemented" onClick={() => handleFeatureCardClick('influence')}>
                              <div className="feature-status">
                                <span className="status-badge implemented">✅ LIVE</span>
                              </div>
                              <div className="feature-icon-wrapper">
                                <div className="status-indicator status-live">
                                  <span>⚡</span>
                                </div>
                              </div>
                              <h3>⚡ Live Influence</h3>
                              <p><strong>Shape Reality:</strong> Tips and audience reactions influence what happens on stage in real-time. Your voice matters.</p>
                              <div className="feature-cta">
                                <span>Interactive Demo →</span>
                              </div>
                            </div>

                            <div className="feature-card implemented" onClick={() => handleFeatureCardClick('reputation')}>
                              <div className="feature-status">
                                <span className="status-badge implemented">✅ LIVE</span>
                              </div>
                              <div className="feature-icon-wrapper">
                                <div className="status-indicator status-live">
                                  <span>🏆</span>
                                </div>
                              </div>
                              <h3>🏆 Build Reputation</h3>
                              <p><strong>Prove Your Taste:</strong> On-chain proof of expertise across events. Great curators and supporters get recognized and rewarded.</p>
                              <div className="feature-cta">
                                <span>Explore Reputation →</span>
                              </div>
                            </div>

                            <div className="feature-card demo-feature-card featured" onClick={() => handleFeatureCardClick('demo')}>
                              <div className="feature-status">
                                <span className="status-badge featured">🎯 FEATURED</span>
                              </div>
                              <div className="feature-icon-wrapper">
                                <div className="megavibe-button-container compact-demo">
                                  <button className="megavibe-btn-enhanced demo-button">
                                    <div className="btn-content">
                                      <span className="btn-text font-display">MEGA VIBE</span>
                                    </div>
                                  </button>
                                </div>
                              </div>
                              <h3>🎯 Meet The Artists</h3>
                              <p><strong>Start here!</strong> Explore real artist profiles including Papa, Anatu & Andrew. This is the button that starts it all.</p>
                              <div className="feature-cta">
                                <span>Begin Journey →</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="welcome-actions">
                          <div className="action-group primary-actions">
                            <button
                              className="btn btn-primary btn-xl featured-btn"
                              onClick={() => handleFeatureCardClick('demo')}
                            >
                              🎯 Start with Artist Profiles
                            </button>
                            <button
                              className="btn btn-secondary btn-xl"
                              onClick={() => setShowVenuePicker(true)}
                            >
                              📍 Explore Live Venues
                            </button>
                          </div>
                          <div className="action-group secondary-actions">
                            <button
                              className="btn btn-outline btn-lg"
                              onClick={() => setActiveView('social')}
                            >
                              📱 Browse Content Feed
                            </button>
                            <button
                              className="btn btn-outline btn-lg"
                              onClick={() => handleFeatureCardClick('connection')}
                            >
                              🚀 Quick Feature Tour
                            </button>
                          </div>
                        </div>



                        <div className="welcome-note">
                          <div className="implementation-status">
                            <div className="status-grid">
                              <div className="status-item">
                                <span className="status-icon">✅</span>
                                <span className="status-text">Full Features</span>
                              </div>
                              <div className="status-item">
                                <span className="status-icon">🎭</span>
                                <span className="status-text">Artist Profiles</span>
                              </div>
                              <div className="status-item">
                                <span className="status-icon">🏗️</span>
                                <span className="status-text">On-Chain</span>
                              </div>
                              <div className="status-item">
                                <span className="status-icon">📱</span>
                                <span className="status-text">Mobile Friendly</span>
                              </div>
                            </div>
                          </div>
                          <p>
                            <strong>Live Performance Economy:</strong> Connect your wallet to create bounties, tokenize moments, build reputation, and earn onchain across events.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="social-view">
                    <Suspense fallback={<div>Loading Audio Feed...</div>}>
                      <AudioFeed />
                    </Suspense>
                  </div>
                )}
              </main>

              {/* Modals */}
              {showVenuePicker && (
                <Suspense fallback={<div>Loading Venue Picker...</div>}>
                  <VenuePicker
                    onVenueSelect={handleVenueSelect}
                    onClose={() => setShowVenuePicker(false)}
                  />
                </Suspense>
              )}

              {showSongIdentifier && currentSong && selectedVenue && (
                <Suspense fallback={<div>Loading Song Identifier...</div>}>
                  <SongIdentifier
                    currentSong={currentSong}
                    venueId={selectedVenue.id}
                    onClose={handleCloseSongIdentifier}
                  />
                </Suspense>
              )}

              {showPerformerDashboard && (
                <Suspense fallback={<div>Loading Performer Dashboard...</div>}>
                  <PerformerDashboard
                    featureType={selectedFeatureType}
                    onClose={() => setShowPerformerDashboard(false)}
                  />
                </Suspense>
              )}

              {/* Tutorial Overlay */}
              {showTutorial && (
                <div className="modal-overlay">
                  <div
                    className="modal"
                    style={{
                      maxWidth: '520px',
                    }}
                  >
                    <button className="close-btn" onClick={handleSkipTutorial}>
                      ×
                    </button>
                    <div className="modal-header">
                      <h2>Welcome to MegaVibe!</h2>
                      <p style={{
                        color: 'var(--gray-600)',
                        fontSize: 'var(--font-size-base)',
                        margin: 'var(--space-sm) 0 0 0',
                        fontWeight: '400'
                      }}>
                        Step {tutorialStep + 1} of 4
                      </p>
                    </div>
                    <div className="modal-body">
                      {tutorialStep === 0 && (
                        <>
                          <h3>🎵 Explore Venues</h3>
                          <p>
                            Use the venue selector to find live performances
                            near you. Click on "Select Venue" to explore
                            available locations and discover what's happening now.
                          </p>
                        </>
                      )}
                      {tutorialStep === 1 && (
                        <>
                          <h3>🎤 Discover Live Performances</h3>
                          <p>
                            In the "Live Music" tab, you can see current events
                            at your selected venue and interact with the
                            MegaVibe button to identify songs and performances.
                          </p>
                        </>
                      )}
                      {tutorialStep === 2 && (
                        <>
                          <h3>📱 Connect with Social Feed</h3>
                          <p>
                            Switch to the "Social Feed" tab to browse audio
                            snippets, connect with artists, and share your own
                            content from live performances.
                          </p>
                        </>
                      )}
                      {tutorialStep === 3 && (
                        <>
                          <h3>💰 Support Artists</h3>
                          <p>
                            Connect your wallet to send tips directly to
                            performers using cryptocurrency during live events.
                            Help support the artists you love!
                          </p>
                        </>
                      )}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: 'var(--space-xl)',
                          gap: 'var(--space-md)',
                        }}
                      >
                        <button
                          className="btn btn-outline"
                          onClick={handleSkipTutorial}
                        >
                          Skip Tutorial
                        </button>
                        <div style={{
                          display: 'flex',
                          gap: 'var(--space-xs)',
                          alignItems: 'center'
                        }}>
                          {[0, 1, 2, 3].map((step) => (
                            <div
                              key={step}
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: step <= tutorialStep ? 'var(--accent)' : 'var(--gray-300)',
                                transition: 'all var(--transition-fast)',
                              }}
                            />
                          ))}
                        </div>
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            if (tutorialStep < 3) {
                              handleNextTutorialStep();
                            } else {
                              handleSkipTutorial();
                            }
                          }}
                        >
                          {tutorialStep < 3 ? 'Next' : 'Got It!'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  );
}

export default App;
