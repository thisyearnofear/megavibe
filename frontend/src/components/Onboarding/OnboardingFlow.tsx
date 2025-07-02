import React, { useState, useEffect } from 'react';
import { useWallet } from '../../contexts/WalletContext';
import { useNavigate } from 'react-router-dom';
import './OnboardingFlow.css';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
  canSkip?: boolean;
  isCompleted?: boolean;
}

export const OnboardingFlow: React.FC = () => {
  const { isConnected, connectWallet } = useWallet();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Check if user has seen onboarding before
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('megavibe_onboarding_completed');
    if (!hasSeenOnboarding && !isConnected) {
      setIsVisible(true);
    }
  }, [isConnected]);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to MegaVibe! 🎭',
      description: 'Transform live events into cross-chain reputation engines',
      component: (
        <div className="onboarding-welcome">
          <div className="welcome-icon">🌟</div>
          <h2>The Future of Event Engagement</h2>
          <div className="feature-list">
            <div className="feature-item">
              <span className="feature-icon">💰</span>
              <span>Tip speakers across any blockchain</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🏆</span>
              <span>Build verifiable onchain reputation</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎯</span>
              <span>Earn rewards for engagement</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'wallet',
      title: 'Connect Your Wallet 🔗',
      description: 'Secure, wallet-first authentication powered by MetaMask',
      component: (
        <div className="onboarding-wallet">
          <div className="wallet-icon">🔐</div>
          <h2>Why Connect Your Wallet?</h2>
          <div className="benefit-list">
            <div className="benefit-item">
              <span className="check-icon">✅</span>
              <span>Send cross-chain tips with USDC</span>
            </div>
            <div className="benefit-item">
              <span className="check-icon">✅</span>
              <span>Build portable reputation across events</span>
            </div>
            <div className="benefit-item">
              <span className="check-icon">✅</span>
              <span>Access exclusive perks and opportunities</span>
            </div>
          </div>
          <button 
            className="connect-wallet-btn"
            onClick={connectWallet}
            disabled={isConnected}
          >
            {isConnected ? '✅ Wallet Connected!' : '🔗 Connect Wallet'}
          </button>
        </div>
      ),
      isCompleted: isConnected
    },
    {
      id: 'first-tip',
      title: 'Ready to Tip! 🚀',
      description: 'You\'re all set to start building your onchain reputation',
      component: (
        <div className="onboarding-ready">
          <div className="success-icon">🎉</div>
          <h2>You're All Set!</h2>
          <p>Your wallet is connected and you're ready to:</p>
          <div className="action-list">
            <div className="action-item">
              <span className="action-icon">💰</span>
              <div className="action-content">
                <strong>Send Your First Tip</strong>
                <span>Support speakers and earn reputation</span>
              </div>
            </div>
            <div className="action-item">
              <span className="action-icon">🎯</span>
              <div className="action-content">
                <strong>Explore Bounties</strong>
                <span>Create content and earn rewards</span>
              </div>
            </div>
            <div className="action-item">
              <span className="action-icon">🏆</span>
              <div className="action-content">
                <strong>Track Reputation</strong>
                <span>Watch your onchain reputation grow</span>
              </div>
            </div>
          </div>
        </div>
      ),
      canSkip: true
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipOnboarding = () => {
    completeOnboarding();
  };

  const completeOnboarding = () => {
    localStorage.setItem('megavibe_onboarding_completed', 'true');
    setIsVisible(false);
    navigate('/tip'); // Navigate to main tipping page
  };

  const goToTipping = () => {
    completeOnboarding();
  };

  const goToBounties = () => {
    localStorage.setItem('megavibe_onboarding_completed', 'true');
    setIsVisible(false);
    navigate('/bounties');
  };

  if (!isVisible) {
    return null;
  }

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        {/* Header */}
        <div className="onboarding-header">
          <div className="step-indicator">
            Step {currentStep + 1} of {steps.length}
          </div>
          <button 
            className="skip-btn"
            onClick={skipOnboarding}
            aria-label="Skip onboarding"
          >
            Skip
          </button>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="onboarding-content">
          <div className="step-header">
            <h1>{currentStepData.title}</h1>
            <p>{currentStepData.description}</p>
          </div>
          
          <div className="step-body">
            {currentStepData.component}
          </div>
        </div>

        {/* Footer */}
        <div className="onboarding-footer">
          <div className="step-dots">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`step-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                onClick={() => setCurrentStep(index)}
              />
            ))}
          </div>

          <div className="footer-actions">
            {currentStep > 0 && (
              <button 
                className="prev-btn"
                onClick={prevStep}
              >
                ← Previous
              </button>
            )}

            {currentStep === steps.length - 1 ? (
              <div className="final-actions">
                <button 
                  className="action-btn primary"
                  onClick={goToTipping}
                >
                  Start Tipping 💰
                </button>
                <button 
                  className="action-btn secondary"
                  onClick={goToBounties}
                >
                  Explore Bounties 🎯
                </button>
              </div>
            ) : (
              <button 
                className="next-btn"
                onClick={nextStep}
                disabled={currentStepData.id === 'wallet' && !isConnected}
              >
                {currentStepData.id === 'wallet' && !isConnected ? 'Connect Wallet First' : 'Next →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
