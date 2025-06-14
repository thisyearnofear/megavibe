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
                      🎵 Live Music
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
                            The Future of{' '}
                            <span className="brand-gradient">LIVE MUSIC</span>
                          </h1>
                          <p className="welcome-subtitle">
                            <strong>MegaVibe</strong> is Shazam for live performances.
                            Walk into any venue, tap our button, and instantly identify songs
                            while tipping artists in real-time.
                          </p>
                        </div>

                        <div className="welcome-features">
                          <div className="feature-card">
                            <div className="feature-icon-wrapper">
                              <div className="vinyl-record"></div>
                            </div>
                            <h3>🎯 Auto-Detect Venues</h3>
                            <p><strong>GPS Magic:</strong> Walk into participating venues and MegaVibe automatically knows where you are. No manual check-ins needed.</p>
                          </div>
                          <div className="feature-card">
                            <div className="feature-icon-wrapper">
                              <div className="sound-wave">
                                <div className="sound-wave-bar"></div>
                                <div className="sound-wave-bar"></div>
                                <div className="sound-wave-bar"></div>
                                <div className="sound-wave-bar"></div>
                                <div className="sound-wave-bar"></div>
                              </div>
                            </div>
                            <h3>🎵 Identify Live Songs</h3>
                            <p><strong>Like Shazam, But Live:</strong> Tap the MegaVibe button to instantly identify what song is being performed right now on stage.</p>
                          </div>
                          <div className="feature-card">
                            <div className="feature-icon-wrapper">
                              <div className="status-indicator status-live">
                                <span>TIP</span>
                              </div>
                            </div>
                            <h3>💰 Tip Artists Instantly</h3>
                            <p><strong>Direct Support:</strong> Send tips directly to performers the moment they play a song you love. Artists get paid instantly.</p>
                          </div>
                          <div className="feature-card demo-feature-card">
                            <div className="feature-icon-wrapper">
                              <div className="megavibe-button-container compact-demo">
                                <button className="megavibe-btn-enhanced demo-button">
                                  <div className="btn-content">
                                    <span className="btn-text font-display">MEGA VIBE</span>
                                  </div>
                                </button>
                              </div>
                            </div>
                            <h3>🎯 See It In Action</h3>
                            <p><strong>This is the button</strong> you'll tap at live venues to identify songs and tip artists instantly.</p>
                          </div>
                        </div>

                        <div className="welcome-actions">
                          <button
                            className="btn btn-primary btn-xl"
                            onClick={() => setShowVenuePicker(true)}
                          >
                            🎵 Try MegaVibe Now
                          </button>
                          <button
                            className="btn btn-secondary btn-xl"
                            onClick={() => setActiveView('social')}
                          >
                            📱 View Live Feed
                          </button>
                        </div>



                        <div className="welcome-note">
                          <p>
                            <strong>🚀 Beta Launch:</strong> We're partnering with venues and artists in major cities.
                            Connect your wallet to start tipping and join the future of live music support!
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

              {/* Tutorial Overlay */}
              {showTutorial && (
                <div className="modal-overlay">
                  <div
                    className="modal"
                    style={{
                      maxWidth: '500px',
                      backgroundColor: 'var(--surface-color)',
                      color: 'var(--text-color)',
                    }}
                  >
                    <button className="close-btn" onClick={handleSkipTutorial}>
                      ×
                    </button>
                    <div className="modal-header">
                      <h2 style={{ margin: 0 }}>Welcome to MegaVibe!</h2>
                    </div>
                    <div className="modal-body">
                      {tutorialStep === 0 && (
                        <>
                          <h3>Step 1: Explore Venues</h3>
                          <p>
                            Use the venue selector to find live music events
                            near you. Click on "Select Venue" to explore
                            available locations.
                          </p>
                        </>
                      )}
                      {tutorialStep === 1 && (
                        <>
                          <h3>Step 2: Discover Live Music</h3>
                          <p>
                            In the "Live Music" tab, you can see current events
                            at your selected venue and interact with the
                            MegaVibe button to identify songs.
                          </p>
                        </>
                      )}
                      {tutorialStep === 2 && (
                        <>
                          <h3>Step 3: Connect with Social Feed</h3>
                          <p>
                            Switch to the "Social Feed" tab to browse audio
                            snippets, connect with artists, and share your own
                            content.
                          </p>
                        </>
                      )}
                      {tutorialStep === 3 && (
                        <>
                          <h3>Step 4: Support Artists</h3>
                          <p>
                            Connect your wallet to send tips directly to
                            performers using cryptocurrency during live events.
                          </p>
                        </>
                      )}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginTop: '1.5rem',
                        }}
                      >
                        <button
                          className="btn btn-outline"
                          onClick={handleSkipTutorial}
                        >
                          Skip Tutorial
                        </button>
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
