import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LiveTipFeed } from '../LiveMusic/LiveTipFeed';
import { TippingModal } from '../LiveMusic/TippingModal';
import { BountyModal } from '../LiveMusic/BountyModal';
import { useEvent } from '../../contexts/EventContext';
import { useWallet } from '../../contexts/WalletContext';
import { FlywheelVisualization } from './FlywheelVisualization';
import { KnowledgeEconomyStats } from './KnowledgeEconomyStats';
import { FlywheelSteps } from './FlywheelSteps';
import './KnowledgeFlywheelPage.css';
import { PageLayout } from '../Layout/PageLayout';
import { Button } from '../UI/Button';

interface KnowledgeFlywheelPageProps {
  onBack?: () => void;
}

export const KnowledgeFlywheelPage: React.FC<KnowledgeFlywheelPageProps> = ({ onBack }) => {
  console.log('🧠 KnowledgeFlywheelPage component rendered!');

  const navigate = useNavigate();
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
    navigate('/tip');
  };

  const handleCreateBounty = () => {
    navigate('/bounties');
  };


  return (
    <PageLayout
      title="Knowledge Economy"
      subtitle="See how the flywheel creates value and drives the ecosystem."
    >
      <div className="knowledge-flywheel-content">
        {/* Main Flywheel Section */}
        <div className="flywheel-main-section">
          <div className="flywheel-visualization-container">
            <FlywheelVisualization
              activeStep={activeFlywheelStep}
              onStepClick={setActiveFlywheelStep}
            />
          </div>

          <div className="flywheel-steps-container">
            <FlywheelSteps activeStep={activeFlywheelStep} />
          </div>

          {/* Action Buttons */}
          <div className="flywheel-actions">
            {isLoading ? (
              <div className="loading-skeleton" style={{ height: '48px', width: '200px' }} />
            ) : (
              <>
                <Button 
                  variant="primary" 
                  size="lg" 
                  onClick={handleStartTipping}
                >
                  💰 Start Tipping
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleCreateBounty}
                >
                  🎯 Create Bounty
                </Button>
              </>
            )}
          </div>

          {!isConnected && (
            <div className="connection-notice">
              <p>💡 Connect your wallet to participate in the knowledge economy</p>
            </div>
          )}
        </div>

        {/* Stats and Activity Sidebar */}
        <div className="flywheel-sidebar">
          <KnowledgeEconomyStats />

          {currentEvent && (
            <div className="live-activity-card">
              <h3>🔴 Live Activity</h3>
              <LiveTipFeed
                eventId={currentEvent.id}
                className="compact-tip-feed"
              />
            </div>
          )}
        </div>
      </div>

      {/* Success Stories Section */}
      <div className="success-stories-section">
        <h2>💫 Success Stories</h2>
        <div className="stories-grid">
          <div className="story-card">
            <div className="story-avatar">🧠</div>
            <div className="story-content">
              <h4>Vitalik Buterin</h4>
              <p className="story-earnings">$12,400 earned</p>
              <p className="story-detail">4 conferences • 847 tips • 23 bounties</p>
            </div>
          </div>
          <div className="story-card">
            <div className="story-avatar">🚀</div>
            <div className="story-content">
              <h4>Andrew Chen</h4>
              <p className="story-earnings">$8,900 earned</p>
              <p className="story-detail">$50K business • 156 content pieces</p>
            </div>
          </div>
          <div className="story-card">
            <div className="story-avatar">💡</div>
            <div className="story-content">
              <h4>Balaji Srinivasan</h4>
              <p className="story-earnings">$15,600 earned</p>
              <p className="story-detail">Network State • 92 videos • 1.2M views</p>
            </div>
          </div>
        </div>
      </div>

    </PageLayout>
  );
};
