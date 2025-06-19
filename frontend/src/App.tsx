import React, { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import './styles/design-system.css';
import './App.css';
import { EnhancedWalletConnector as WalletConnector } from './components/Shared/EnhancedWalletConnector';
import { useWallet } from './contexts/WalletContext';
import { useEvent, Speaker } from './contexts/EventContext';
import { Venue } from './services/locationService';


// Lazy load components for performance optimization
const VenuePicker = lazy(() =>
  import('./components/LiveMusic/VenuePicker').then(module => ({
    default: module.VenuePicker,
  }))
);


const LiveTipFeed = lazy(() =>
  import('./components/LiveMusic/LiveTipFeed').then(module => ({
    default: module.default,
  }))
);
const TipAndBountyFlow = lazy(() =>
  import('./components/LiveMusic/TipAndBountyFlow').then(module => ({
    default: module.TipAndBountyFlow,
  }))
);
const PowerfulLandingPage = lazy(() =>
  import('./components/Landing/PowerfulLandingPage').then(module => ({
    default: module.PowerfulLandingPage,
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
const VenueContentMarketplace = lazy(() =>
  import('./components/LiveMusic/VenueContentMarketplace').then(module => ({
    default: module.default,
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
const AudioFeed = lazy(() =>
  import('./components/Social/AudioFeed').then(module => ({
    default: module.AudioFeed,
  }))
);

function App() {
  // UI State
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [showVenuePicker, setShowVenuePicker] = useState(false);
  const [currentSong, setCurrentSong] = useState<any>(null);
  const [showSongIdentifier, setShowSongIdentifier] = useState(false);
  const [activeView, setActiveView] = useState<'live' | 'social'>('live');
  const [error, setError] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [tutorialStep, setTutorialStep] = useState<number>(0);
  const [showPerformerDashboard, setShowPerformerDashboard] = useState(false);
  const [showPowerfulLanding, setShowPowerfulLanding] = useState(false);

  const [selectedFeatureType, setSelectedFeatureType] = useState<'connection' | 'bounty' | 'tokenization' | 'influence' | 'reputation' | 'demo'>('demo');
  const [currentEventId] = useState<string>('devcon-7-bangkok');

  // Use contexts
  const { address, isConnected } = useWallet();
  const {
    currentEvent,
    speakers,
    selectedSpeaker,
    showTipModal,
    showBountyModal,
    liveStats,
    isLoading: eventLoading,
    connectionStatus,
    loadEvent,
    openTipModal,
    closeTipModal,
    openBountyModal,
    closeBountyModal,
    selectSpeaker
  } = useEvent();

  const appRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  // GSAP animations
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

  // Load event data when component mounts
  useEffect(() => {
    loadEvent(currentEventId);
  }, [currentEventId]); // loadEvent is stable from useCallback

  // Tutorial handling
  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedMegaVibe');
    if (!hasVisited) {
      setShowTutorial(true);
    }
  }, []);

  const handleNextTutorialStep = () => {
    setTutorialStep(prev => prev + 1);
  };

  const handleSkipTutorial = () => {
    setShowTutorial(false);
    setTutorialStep(0);
    localStorage.setItem('hasVisitedMegaVibe', 'true');
  };

  const handleFeatureCardClick = (featureType: 'connection' | 'bounty' | 'tokenization' | 'influence' | 'reputation' | 'demo') => {
    console.log('🎯 Feature card clicked:', featureType);
    setSelectedFeatureType(featureType);
    if (featureType === 'demo') {
      console.log('📱 Opening Performer Dashboard');
      setShowPerformerDashboard(true);
    } else if (featureType === 'connection') {
      // Knowledge Economy → Navigate to /infonomy
      console.log('🧠 Navigating to Knowledge Economy');
      window.location.href = '/infonomy';
    } else if (featureType === 'tokenization') {
      // Bounty Marketplace → Navigate to /bounties
      console.log('🎯 Navigating to Bounty Marketplace');
      window.location.href = '/bounties';
    } else {
      // Other feature cards still show the powerful landing
      console.log('🌟 Opening Powerful Landing for:', featureType);
      setShowPowerfulLanding(true);
    }
  };

  // Event handlers
  const handleVenueSelection = (venue: Venue) => {
    setSelectedVenue(venue);
    setShowVenuePicker(false);
  };

  const handleSongIdentified = (song: any) => {
    setCurrentSong(song);
    setShowSongIdentifier(true);
  };

  const handleCloseSongIdentifier = () => {
    setShowSongIdentifier(false);
    setCurrentSong(null);
  };

  const handleSpeakerSelect = (speaker: Speaker) => {
    selectSpeaker(speaker);
    setActiveView('live');
  };

  const handleTipSuccess = () => {
    // Success handled by EventContext
    console.log('Tip success');
  };

  const handleBountySuccess = () => {
    // Success handled by EventContext
    console.log('Bounty success');
  };

  const renderWelcomeScreen = () => (
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

        <div className="welcome-features live-features">
          <div className="feature-card live-feature" onClick={() => handleFeatureCardClick('connection')}>
            <div className="feature-status">
              <span className="status-badge live">🔴 LIVE NOW</span>
            </div>
            <div className="feature-icon-wrapper">
              <div className="vinyl-record spinning"></div>
            </div>
            <h3>🎯 Knowledge Economy</h3>
            <p><strong>The Flywheel:</strong> Watch tips become bounties, content creation scale, and knowledge workers earn $1000s per talk.</p>
            <div className="feature-cta">
              <span>Explore Flywheel →</span>
            </div>
          </div>

          <div className="feature-card implemented featured" onClick={() => window.location.href = '/tip'}>
            <div className="feature-status">
              <span className="status-badge implemented">✅ LIVE NOW</span>
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
            <h3>💰 Live Event Tipping</h3>
            <p><strong>Tip Speakers:</strong> Send crypto tips to speakers in real-time during crypto conferences and events.</p>
            <div className="feature-cta">
              <span>Start Tipping Now →</span>
            </div>
          </div>

          <div className="feature-card live-feature" onClick={() => handleFeatureCardClick('tokenization')}>
            <div className="feature-status">
              <span className="status-badge live">🔴 LIVE NOW</span>
            </div>
            <div className="feature-icon-wrapper">
              <div className="status-indicator status-live pulsing">
                <span>🎯</span>
              </div>
            </div>
            <h3>🎯 Bounty Marketplace</h3>
            <p><strong>Commission Content:</strong> Request specific content from speakers. $25-500 bounties with 24-48h delivery.</p>
            <div className="feature-cta">
              <span>Browse Bounties →</span>
            </div>
          </div>

          <div className="feature-card live-feature" onClick={() => handleFeatureCardClick('influence')}>
            <div className="feature-status">
              <span className="status-badge live">🔴 LIVE NOW</span>
            </div>
            <div className="feature-icon-wrapper">
              <div className="status-indicator status-live">
                <span>⚡</span>
              </div>
            </div>
            <h3>⚡ Live Earnings</h3>
            <p><strong>Real-Time Income:</strong> Watch speakers earn $500-3000 per talk. See the exact moment tips convert to bounties.</p>
            <div className="feature-cta">
              <span>See Live Stats →</span>
            </div>
          </div>

          <div className="feature-card live-feature" onClick={() => handleFeatureCardClick('reputation')}>
            <div className="feature-status">
              <span className="status-badge live">🔴 LIVE NOW</span>
            </div>
            <div className="feature-icon-wrapper">
              <div className="status-indicator status-live">
                <span>🏆</span>
              </div>
            </div>
            <h3>🏆 Success Stories</h3>
            <p><strong>Real Results:</strong> Vitalik earned $12,400 across 4 conferences. Andrew built a $50K knowledge business.</p>
            <div className="feature-cta">
              <span>Read Stories →</span>
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
            🧠 See Knowledge Economy
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
  );

  const renderLiveView = () => (
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
            <Suspense fallback={<div>Loading MegaVibe Button...</div>}>
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
            <Suspense fallback={<div>Loading Artist Support...</div>}>
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

          <Suspense fallback={<div>Loading Venue Content...</div>}>
            <VenueContentMarketplace venueId={selectedVenue.id} />
          </Suspense>
        </>
      ) : (
        renderWelcomeScreen()
      )}
    </div>
  );

  const renderSocialView = () => (
    <div className="social-view">
      <Suspense fallback={<div>Loading Audio Feed...</div>}>
        <AudioFeed />
      </Suspense>
    </div>
  );

  return (
    <div className="App" ref={appRef}>
      {/* Navigation */}
      <nav className="app-nav" ref={navRef}>
        <div className="nav-container">
          <div className="nav-brand">
            <h1>MEGA<span className="brand-accent">VIBE</span></h1>
            {connectionStatus === 'connected' && (
              <div className="connection-indicator">
                <span className="connection-dot"></span>
                <span>Live</span>
              </div>
            )}
          </div>

          <div className="nav-tabs">
            <button
              className={`nav-tab ${activeView === 'live' ? 'active' : ''}`}
              onClick={() => setActiveView('live')}
            >
              🎵 Live Vibes
            </button>
            <button
              className={`nav-tab ${activeView === 'social' ? 'active' : ''}`}
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
                onConnect={() => {}}
                onDisconnect={() => {}}
                connectedAddress={address || undefined}
                compact={true}
                showBalance={true}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="app-content" ref={mainRef}>
        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {eventLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Loading event data...</p>
          </div>
        )}

        {/* View Content */}
        {activeView === 'live' ? renderLiveView() : renderSocialView()}
      </main>

      {/* Modals */}
      {/* Modals */}
      {showVenuePicker && (
        <Suspense fallback={<div>Loading Venue Picker...</div>}>
          <VenuePicker
            onVenueSelect={handleVenueSelection}
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

      {showPowerfulLanding && (
        <Suspense fallback={<div>Loading Powerful Landing...</div>}>
          <PowerfulLandingPage
            featureType={selectedFeatureType}
            onGetStarted={() => {
              setShowPowerfulLanding(false);
              if (!isConnected) {
                // Trigger wallet connection flow
              }
            }}
            onExploreEvents={() => {
              setShowPowerfulLanding(false);
              setShowVenuePicker(true);
            }}
          />
        </Suspense>
      )}



      {/* Tutorial Overlay */}
      {showTutorial && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '520px' }}>
            <button className="close-btn" onClick={handleSkipTutorial}>×</button>
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
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 'var(--space-xl)',
                gap: 'var(--space-md)',
              }}>
                <button className="btn btn-outline" onClick={handleSkipTutorial}>
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

      {/* Connection Status */}
      {connectionStatus === 'connecting' && (
        <div className="connection-status connecting">
          <span>🔄 Connecting to live feed...</span>
        </div>
      )}

      {connectionStatus === 'disconnected' && currentEvent && (
        <div className="connection-status disconnected">
          <span>⚠️ Connection lost</span>
          <button onClick={() => loadEvent(currentEventId)}>Reconnect</button>
        </div>
      )}
    </div>
  );
}

export default App;
