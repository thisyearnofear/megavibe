import React, { useState } from 'react';
import { CrossChainTipForm } from '../CrossChain/CrossChainTipForm';
import { OnboardingFlow } from '../Onboarding/OnboardingFlow';
import './UIDemo.css';

export const UIDemo: React.FC = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCrossChainTip, setShowCrossChainTip] = useState(false);

  const handleTipSuccess = (tipData: any) => {
    console.log('Tip successful:', tipData);
    alert(`Tip successful! ${tipData.amount} USDC sent to ${tipData.speakerName}`);
  };

  return (
    <div className="ui-demo">
      <div className="demo-header">
        <h1>🎨 MegaVibe UI Demo</h1>
        <p>Test the new UI components for the hackathon submission</p>
      </div>

      <div className="demo-grid">
        <div className="demo-card">
          <h3>🚀 Onboarding Flow</h3>
          <p>New user experience with guided wallet connection</p>
          <button 
            onClick={() => setShowOnboarding(true)}
            className="demo-btn primary"
          >
            Show Onboarding
          </button>
        </div>

        <div className="demo-card">
          <h3>🌉 Cross-Chain Tipping</h3>
          <p>LI.FI powered cross-chain USDC tipping form</p>
          <button 
            onClick={() => setShowCrossChainTip(true)}
            className="demo-btn primary"
          >
            Show Cross-Chain Tip
          </button>
        </div>

        <div className="demo-card">
          <h3>🏆 Reputation System</h3>
          <p>Multi-chain reputation tracking and badges</p>
          <a href="/reputation" className="demo-btn secondary">
            View Reputation Dashboard
          </a>
        </div>

        <div className="demo-card">
          <h3>🔒 Security Validation</h3>
          <p>Environment security checks (check console)</p>
          <button 
            onClick={() => {
              console.log('Security validation runs automatically on app start');
              alert('Check the browser console for security validation results');
            }}
            className="demo-btn secondary"
          >
            Check Security
          </button>
        </div>
      </div>

      <div className="demo-features">
        <h2>✨ New Features Implemented</h2>
        <div className="features-grid">
          <div className="feature-item">
            <span className="feature-icon">📱</span>
            <div className="feature-content">
              <h4>Responsive Navigation</h4>
              <p>Icon-based navigation with mobile hamburger menu</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🎯</span>
            <div className="feature-content">
              <h4>User Onboarding</h4>
              <p>3-step guided experience for new users</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🌐</span>
            <div className="feature-content">
              <h4>Cross-Chain Integration</h4>
              <p>LI.FI SDK for seamless cross-chain tipping</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🏆</span>
            <div className="feature-content">
              <h4>Reputation Tracking</h4>
              <p>Multi-chain reputation with badges and achievements</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔐</span>
            <div className="feature-content">
              <h4>Security Validation</h4>
              <p>Comprehensive environment security checks</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🎨</span>
            <div className="feature-content">
              <h4>Professional UI</h4>
              <p>Investment-grade design system</p>
            </div>
          </div>
        </div>
      </div>

      <div className="demo-status">
        <h2>🎯 Hackathon Status</h2>
        <div className="status-grid">
          <div className="status-item completed">
            <span className="status-icon">✅</span>
            <span>MetaMask SDK Integration ($2k)</span>
          </div>
          <div className="status-item completed">
            <span className="status-icon">✅</span>
            <span>USDC Payments ($2k)</span>
          </div>
          <div className="status-item in-progress">
            <span className="status-icon">🚧</span>
            <span>LI.FI SDK Integration ($2k) - Needs API Key</span>
          </div>
          <div className="status-item completed">
            <span className="status-icon">✅</span>
            <span>Identity & OnChain Reputation ($6k)</span>
          </div>
        </div>
        <div className="total-prize">
          <strong>Total Prize Potential: $12,000</strong>
        </div>
      </div>

      {/* Modals */}
      {showOnboarding && (
        <div className="demo-modal-overlay">
          <OnboardingFlow />
          <button 
            className="demo-close-btn"
            onClick={() => setShowOnboarding(false)}
          >
            Close Demo
          </button>
        </div>
      )}

      {showCrossChainTip && (
        <div className="demo-modal-overlay">
          <div className="demo-modal">
            <CrossChainTipForm
              speakerAddress="0x742d35Cc6634C0532925a3b8D4C9db96590c6C87"
              speakerName="Demo Speaker"
              eventId="demo-event-123"
              speakerId="demo-speaker-456"
              onTipSuccess={handleTipSuccess}
              onClose={() => setShowCrossChainTip(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
