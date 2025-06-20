import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '../../contexts/WalletContext';
import './CrossPlatformNav.css';

interface CrossPlatformNavProps {
  speakerAddress?: string;
  eventId?: string;
  bountyId?: string;
  className?: string;
}

export const CrossPlatformNav: React.FC<CrossPlatformNavProps> = ({
  speakerAddress,
  eventId,
  bountyId,
  className = ''
}) => {
  const location = useLocation();
  const { isConnected } = useWallet();

  const buildNavLink = (path: string, params?: Record<string, string>) => {
    const searchParams = new URLSearchParams();
    
    if (speakerAddress) searchParams.set('speaker', speakerAddress);
    if (eventId) searchParams.set('event', eventId);
    if (bountyId) searchParams.set('bounty', bountyId);
    
    // Add custom params
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        searchParams.set(key, value);
      });
    }

    const queryString = searchParams.toString();
    return queryString ? `${path}?${queryString}` : path;
  };

  const isActivePath = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <nav className={`cross-platform-nav ${className}`}>
      <div className="nav-section nav-section--primary">
        <h4>🌐 Integrated Journey</h4>
        <div className="nav-links">
          <Link 
            to={buildNavLink('/talent')}
            className={`nav-link ${isActivePath('/talent') ? 'nav-link--active' : ''}`}
          >
            <span className="nav-icon">👥</span>
            <div className="nav-content">
              <span className="nav-label">Talent Profiles</span>
              <span className="nav-description">Web3 social + on-chain reputation</span>
            </div>
          </Link>

          <Link 
            to={buildNavLink('/tip')}
            className={`nav-link ${isActivePath('/tip') ? 'nav-link--active' : ''}`}
          >
            <span className="nav-icon">💰</span>
            <div className="nav-content">
              <span className="nav-label">Live Tipping</span>
              <span className="nav-description">Real-time value exchange</span>
            </div>
          </Link>

          <Link 
            to={buildNavLink('/bounties')}
            className={`nav-link ${isActivePath('/bounties') ? 'nav-link--active' : ''}`}
          >
            <span className="nav-icon">🎯</span>
            <div className="nav-content">
              <span className="nav-label">Bounty Marketplace</span>
              <span className="nav-description">On-chain content incentives</span>
            </div>
          </Link>

          <Link 
            to={buildNavLink('/infonomy')}
            className={`nav-link ${isActivePath('/infonomy') ? 'nav-link--active' : ''}`}
          >
            <span className="nav-icon">🧠</span>
            <div className="nav-content">
              <span className="nav-label">Knowledge Flywheel</span>
              <span className="nav-description">Value creation cycle</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Context-Aware Quick Actions */}
      {(speakerAddress || eventId) && (
        <div className="nav-section nav-section--context">
          <h4>🔗 Quick Actions</h4>
          <div className="context-actions">
            {speakerAddress && (
              <>
                <Link 
                  to={buildNavLink('/tip', { focus: speakerAddress })}
                  className="context-action context-action--tip"
                >
                  💸 Tip This Speaker
                </Link>
                
                <Link 
                  to={buildNavLink('/bounties', { create: 'true', speaker: speakerAddress })}
                  className="context-action context-action--bounty"
                >
                  🎯 Create Bounty
                </Link>

                <Link 
                  to={buildNavLink('/infonomy', { focus: speakerAddress })}
                  className="context-action context-action--impact"
                >
                  📊 View Impact
                </Link>
              </>
            )}

            {eventId && (
              <>
                <Link 
                  to={buildNavLink('/bounties', { event: eventId })}
                  className="context-action context-action--event"
                >
                  📋 Event Bounties
                </Link>
                
                <Link 
                  to={buildNavLink('/tip', { event: eventId })}
                  className="context-action context-action--event"
                >
                  🎪 Event Tipping
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* On-Chain Status */}
      <div className="nav-section nav-section--status">
        <div className="chain-status">
          <div className={`status-indicator ${isConnected ? 'status-indicator--connected' : 'status-indicator--disconnected'}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              {isConnected ? '🟢 On-Chain Data Active' : '🔴 Demo Mode (Connect Wallet)'}
            </span>
          </div>
          
          {!isConnected && (
            <p className="status-note">
              Connect your wallet to see real on-chain data and participate in the economy
            </p>
          )}
        </div>
      </div>

      {/* Data Flow Visualization */}
      <div className="nav-section nav-section--flow">
        <h4>💫 Value Flow</h4>
        <div className="flow-diagram">
          <div className="flow-step">
            <span className="flow-icon">👥</span>
            <span className="flow-label">Discover</span>
            <span className="flow-arrow">→</span>
          </div>
          <div className="flow-step">
            <span className="flow-icon">💰</span>
            <span className="flow-label">Tip</span>
            <span className="flow-arrow">→</span>
          </div>
          <div className="flow-step">
            <span className="flow-icon">🎯</span>
            <span className="flow-label">Bounty</span>
            <span className="flow-arrow">→</span>
          </div>
          <div className="flow-step">
            <span className="flow-icon">🧠</span>
            <span className="flow-label">Knowledge</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default CrossPlatformNav;
