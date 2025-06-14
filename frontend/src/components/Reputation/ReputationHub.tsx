import React, { useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { ReputationProfile } from './ReputationProfile';
import { ReputationLeaderboard } from './ReputationLeaderboard';
import '../../styles/ReputationHub.css';

interface ReputationHubProps {
  onClose?: () => void;
  initialView?: 'profile' | 'leaderboard' | 'overview';
}

export const ReputationHub: React.FC<ReputationHubProps> = ({
  onClose,
  initialView = 'overview',
}) => {
  const { user, primaryWallet } = useDynamicContext();
  const [activeView, setActiveView] = useState(initialView);
  const [isMinimized, setIsMinimized] = useState(false);

  const getViewTitle = () => {
    switch (activeView) {
      case 'profile':
        return '👤 My Reputation';
      case 'leaderboard':
        return '🏆 Leaderboard';
      default:
        return '🏆 Reputation System';
    }
  };

  if (isMinimized) {
    return (
      <div className="reputation-hub minimized">
        <button 
          className="minimize-button"
          onClick={() => setIsMinimized(false)}
          title="Expand Reputation Hub"
        >
          🏆 Reputation
        </button>
      </div>
    );
  }

  return (
    <div className="reputation-hub">
      <div className="hub-header">
        <div className="header-content">
          <h2>{getViewTitle()}</h2>
          <div className="header-controls">
            <button 
              className="minimize-button"
              onClick={() => setIsMinimized(true)}
              title="Minimize"
            >
              ➖
            </button>
            {onClose && (
              <button 
                className="close-button"
                onClick={onClose}
                title="Close"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {!primaryWallet && (
          <div className="wallet-required-notice">
            <p>🔗 Connect your wallet to access reputation features</p>
          </div>
        )}

        <div className="view-selector">
          <button
            className={`view-tab ${activeView === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveView('overview')}
          >
            📊 Overview
          </button>
          {primaryWallet && (
            <button
              className={`view-tab ${activeView === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveView('profile')}
            >
              👤 My Profile
            </button>
          )}
          <button
            className={`view-tab ${activeView === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveView('leaderboard')}
          >
            🏆 Leaderboard
          </button>
        </div>
      </div>

      <div className="hub-content">
        {activeView === 'overview' && (
          <div className="overview-view">
            <div className="reputation-intro">
              <h3>🏆 Build Your On-Chain Reputation</h3>
              <p>
                MegaVibe's reputation system rewards your engagement across live events with 
                verifiable, on-chain proof of your expertise and taste.
              </p>
            </div>

            <div className="reputation-categories">
              <div className="category-card">
                <div className="category-icon">🎨</div>
                <h4>Curator</h4>
                <p>Build reputation by discovering and sharing great content. Predict viral moments and curate quality experiences.</p>
                <div className="category-benefits">
                  <span className="benefit">• Early access to trending content</span>
                  <span className="benefit">• Curator badges and NFTs</span>
                  <span className="benefit">• Revenue sharing from viral predictions</span>
                </div>
              </div>

              <div className="category-card">
                <div className="category-icon">💰</div>
                <h4>Supporter</h4>
                <p>Support artists and creators through tips, bounties, and engagement. Build a reputation as a generous community member.</p>
                <div className="category-benefits">
                  <span className="benefit">• VIP access to exclusive events</span>
                  <span className="benefit">• Direct line to artists</span>
                  <span className="benefit">• Supporter recognition badges</span>
                </div>
              </div>

              <div className="category-card">
                <div className="category-icon">🎪</div>
                <h4>Attendee</h4>
                <p>Earn proof-of-presence NFTs by attending events. Build a verifiable history of your live experience participation.</p>
                <div className="category-benefits">
                  <span className="benefit">• Proof-of-presence NFT collection</span>
                  <span className="benefit">• Event history verification</span>
                  <span className="benefit">• Cross-venue reputation</span>
                </div>
              </div>

              <div className="category-card">
                <div className="category-icon">📱</div>
                <h4>Influencer</h4>
                <p>Share content and drive engagement across social platforms. Build influence through authentic community building.</p>
                <div className="category-benefits">
                  <span className="benefit">• Social influence tracking</span>
                  <span className="benefit">• Viral content rewards</span>
                  <span className="benefit">• Community builder recognition</span>
                </div>
              </div>
            </div>

            <div className="reputation-tiers">
              <h3>🎯 Reputation Tiers & Benefits</h3>
              <div className="tiers-grid">
                <div className="tier-card bronze">
                  <div className="tier-header">
                    <div className="tier-icon">🥉</div>
                    <h4>Bronze</h4>
                    <span className="tier-range">0-199 points</span>
                  </div>
                  <ul className="tier-benefits">
                    <li>Basic event access</li>
                    <li>Standard support</li>
                    <li>Community participation</li>
                  </ul>
                </div>

                <div className="tier-card silver">
                  <div className="tier-header">
                    <div className="tier-icon">🥈</div>
                    <h4>Silver</h4>
                    <span className="tier-range">200-399 points</span>
                  </div>
                  <ul className="tier-benefits">
                    <li>Priority notifications</li>
                    <li>Enhanced profile features</li>
                    <li>5% discount on tips</li>
                  </ul>
                </div>

                <div className="tier-card gold">
                  <div className="tier-header">
                    <div className="tier-icon">🥇</div>
                    <h4>Gold</h4>
                    <span className="tier-range">400-599 points</span>
                  </div>
                  <ul className="tier-benefits">
                    <li>Early access to events</li>
                    <li>VIP support</li>
                    <li>10% discount on tips</li>
                    <li>Custom profile themes</li>
                  </ul>
                </div>

                <div className="tier-card platinum">
                  <div className="tier-header">
                    <div className="tier-icon">💎</div>
                    <h4>Platinum</h4>
                    <span className="tier-range">600-799 points</span>
                  </div>
                  <ul className="tier-benefits">
                    <li>Exclusive event invitations</li>
                    <li>Backstage access</li>
                    <li>15% discount on tips</li>
                    <li>Beta feature access</li>
                  </ul>
                </div>

                <div className="tier-card diamond">
                  <div className="tier-header">
                    <div className="tier-icon">💠</div>
                    <h4>Diamond</h4>
                    <span className="tier-range">800+ points</span>
                  </div>
                  <ul className="tier-benefits">
                    <li>Personal event concierge</li>
                    <li>20% discount on tips</li>
                    <li>Diamond-only events</li>
                    <li>Custom NFT badges</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="getting-started">
              <h3>🚀 Start Building Your Reputation</h3>
              <div className="action-cards">
                <div className="action-card">
                  <div className="action-icon">📍</div>
                  <h4>Attend Events</h4>
                  <p>Visit venues and earn proof-of-presence NFTs</p>
                  <div className="action-points">+10 points per event</div>
                </div>

                <div className="action-card">
                  <div className="action-icon">💰</div>
                  <h4>Support Artists</h4>
                  <p>Send tips and create bounties for performers</p>
                  <div className="action-points">+5 points per tip</div>
                </div>

                <div className="action-card">
                  <div className="action-icon">📱</div>
                  <h4>Share Content</h4>
                  <p>Share moments and help content go viral</p>
                  <div className="action-points">+3 points per share</div>
                </div>

                <div className="action-card">
                  <div className="action-icon">🎨</div>
                  <h4>Curate Quality</h4>
                  <p>Vote on content and predict viral moments</p>
                  <div className="action-points">+15 points for accuracy</div>
                </div>
              </div>
            </div>

            {!primaryWallet && (
              <div className="connect-wallet-cta">
                <h3>🔗 Connect Your Wallet to Get Started</h3>
                <p>
                  Connect your wallet to start building your on-chain reputation and 
                  unlock exclusive benefits across the MegaVibe ecosystem.
                </p>
              </div>
            )}
          </div>
        )}

        {activeView === 'profile' && primaryWallet && user && (
          <ReputationProfile
            userId={user.userId || user.id || 'current-user'}
            isOwnProfile={true}
          />
        )}

        {activeView === 'leaderboard' && (
          <ReputationLeaderboard />
        )}
      </div>

      <div className="hub-footer">
        <div className="footer-info">
          <p>
            💡 <strong>Pro Tip:</strong> Reputation is cross-platform and travels with you to any venue or event
          </p>
        </div>
      </div>
    </div>
  );
};