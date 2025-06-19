import React, { useState, useEffect } from 'react';
import { LiveTipFeed } from '../LiveMusic/LiveTipFeed';
import { TippingModal } from '../LiveMusic/TippingModal';
import { BountyModal } from '../LiveMusic/BountyModal';
import { useEvent } from '../../contexts/EventContext';
import { useWallet } from '../../contexts/WalletContext';
import { FlywheelVisualization } from './FlywheelVisualization';
import { KnowledgeEconomyStats } from './KnowledgeEconomyStats';
import { FlywheelSteps } from './FlywheelSteps';
import './KnowledgeFlywheelPage.css';

interface KnowledgeFlywheelPageProps {
  onBack?: () => void;
}

export const KnowledgeFlywheelPage: React.FC<KnowledgeFlywheelPageProps> = ({ onBack }) => {
  console.log('🧠 KnowledgeFlywheelPage component rendered!');

  const [showTippingModal, setShowTippingModal] = useState(false);
  const [showBountyModal, setShowBountyModal] = useState(false);
  const [selectedSpeaker, setSelectedSpeaker] = useState<any>(null);
  const [activeFlywheelStep, setActiveFlywheelStep] = useState(0);

  const { currentEvent, speakers, isLoading } = useEvent();
  const { isConnected } = useWallet();

  // Auto-cycle through flywheel steps for demo
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFlywheelStep(prev => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleStartTipping = () => {
    if (!isConnected) {
      // Could trigger wallet connection here
      return;
    }

    // Select first active speaker
    const activeSpeaker = speakers.find(s => s.isActive) || speakers[0];
    if (activeSpeaker) {
      setSelectedSpeaker(activeSpeaker);
      setShowTippingModal(true);
    }
  };

  const handleCreateBounty = () => {
    if (!isConnected) {
      return;
    }

    const activeSpeaker = speakers.find(s => s.isActive) || speakers[0];
    if (activeSpeaker) {
      setSelectedSpeaker(activeSpeaker);
      setShowBountyModal(true);
    }
  };

  const handleTipSuccess = () => {
    setShowTippingModal(false);
    // Success feedback could be added here
  };

  const handleBountySuccess = () => {
    setShowBountyModal(false);
    // Success feedback could be added here
  };

  if (isLoading) {
    return (
      <div className="knowledge-flywheel-page loading">
        <div className="loading-spinner"></div>
        <p>Loading Knowledge Economy...</p>
      </div>
    );
  }

  return (
    <div className="knowledge-flywheel-page">
      {/* Header */}
      <header className="flywheel-header">
        <button className="back-button" onClick={() => window.location.href = '/'}>
          ← Back to Features
        </button>
        <div className="header-content">
          <h1>🧠 Knowledge Economy Flywheel</h1>
          <p className="header-subtitle">
            Watch how tips become bounties, content creation scales, and knowledge workers earn thousands per talk
          </p>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="flywheel-content">
        {/* Left Column: Flywheel Visualization */}
        <div className="flywheel-section">
          <div className="section-header">
            <h2>The Flywheel in Action</h2>
            <p>See how value flows through the knowledge economy</p>
          </div>

          <FlywheelVisualization
            activeStep={activeFlywheelStep}
            onStepClick={setActiveFlywheelStep}
          />

          <div className="flywheel-actions">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleStartTipping}
              disabled={!isConnected}
            >
              💰 Start Tipping Speakers
            </button>
            <button
              className="btn btn-secondary btn-lg"
              onClick={handleCreateBounty}
              disabled={!isConnected}
            >
              🎯 Commission Content
            </button>
          </div>

          {!isConnected && (
            <div className="connection-notice">
              <p>Connect your wallet to participate in the knowledge economy</p>
            </div>
          )}
        </div>

        {/* Right Column: Live Activity & Stats */}
        <div className="activity-section">
          {/* Knowledge Economy Stats */}
          <KnowledgeEconomyStats />

          {/* Live Tip Feed */}
          {currentEvent && (
            <div className="live-activity">
              <h3>🔴 Live Knowledge Transactions</h3>
              <LiveTipFeed
                eventId={currentEvent.id}
                className="flywheel-tip-feed"
              />
            </div>
          )}
        </div>
      </div>

      {/* Flywheel Steps Explanation */}
      <div className="flywheel-steps-section">
        <FlywheelSteps activeStep={activeFlywheelStep} />
      </div>

      {/* Success Stories Section */}
      <div className="success-stories-preview">
        <h2>Real Results from the Knowledge Economy</h2>
        <div className="stories-grid">
          <div className="story-card">
            <div className="story-avatar">🧠</div>
            <div className="story-content">
              <h4>Vitalik Buterin</h4>
              <p className="story-earnings">$12,400 earned</p>
              <p className="story-detail">Across 4 conferences • 847 tips • 23 bounties completed</p>
            </div>
          </div>
          <div className="story-card">
            <div className="story-avatar">🚀</div>
            <div className="story-content">
              <h4>Andrew Chen</h4>
              <p className="story-earnings">$8,900 earned</p>
              <p className="story-detail">Built $50K knowledge business • 156 content pieces created</p>
            </div>
          </div>
          <div className="story-card">
            <div className="story-avatar">💡</div>
            <div className="story-content">
              <h4>Balaji Srinivasan</h4>
              <p className="story-earnings">$15,600 earned</p>
              <p className="story-detail">Network State talks • 92 commissioned videos • 1.2M views</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cross-Navigation */}
      <div className="cross-navigation">
        <h3>Explore More of MegaVibe</h3>
        <div className="nav-cards">
          <div className="nav-card" onClick={() => window.location.href = '/tip'}>
            <span className="nav-icon">💰</span>
            <h4>Live Tipping</h4>
            <p>Tip speakers in real-time</p>
          </div>
          <div className="nav-card" onClick={() => window.location.href = '/bounties'}>
            <span className="nav-icon">🎯</span>
            <h4>Bounty Marketplace</h4>
            <p>Browse and create content bounties</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showTippingModal && selectedSpeaker && currentEvent && (
        <TippingModal
          speaker={selectedSpeaker}
          event={currentEvent}
          onClose={() => setShowTippingModal(false)}
          onSuccess={handleTipSuccess}
          isOpen={showTippingModal}
        />
      )}

      {showBountyModal && selectedSpeaker && currentEvent && (
        <BountyModal
          eventId={currentEvent.id}
          speakerId={selectedSpeaker.id}
          speakerName={selectedSpeaker.name}
          onClose={() => setShowBountyModal(false)}
          onSuccess={handleBountySuccess}
          isOpen={showBountyModal}
        />
      )}
    </div>
  );
};
