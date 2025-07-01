// MetaMask SDK Authentication Demo Page
// Demonstrates the new wallet-first authentication system

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AuthButton from './AuthButton';
import './AuthDemo.css';

export const AuthDemo: React.FC = () => {
  const {
    user,
    isAuthenticated,
    isConnecting,
    error,
    hasWallet,
    getAuthMethodPriority,
  } = useAuth();

  const authMethods = getAuthMethodPriority();

  return (
    <div className="auth-demo">
      <div className="auth-demo-container">
        <header className="auth-demo-header">
          <h1>🎭 MegaVibe Authentication</h1>
          <p>MetaMask SDK Primary Authentication System</p>
        </header>

        <div className="auth-demo-content">
          {/* Authentication Status */}
          <div className="auth-status-card">
            <h2>Authentication Status</h2>
            
            <div className="status-grid">
              <div className="status-item">
                <span className="status-label">Connected:</span>
                <span className={`status-value ${isAuthenticated ? 'success' : 'error'}`}>
                  {isAuthenticated ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              
              <div className="status-item">
                <span className="status-label">Connecting:</span>
                <span className={`status-value ${isConnecting ? 'warning' : 'neutral'}`}>
                  {isConnecting ? '🔄 Yes' : '⏸️ No'}
                </span>
              </div>
              
              <div className="status-item">
                <span className="status-label">Has Wallet:</span>
                <span className={`status-value ${hasWallet() ? 'success' : 'error'}`}>
                  {hasWallet() ? '🦊 Yes' : '👤 No'}
                </span>
              </div>
              
              {error && (
                <div className="status-item error">
                  <span className="status-label">Error:</span>
                  <span className="status-value error">⚠️ {error}</span>
                </div>
              )}
            </div>
          </div>

          {/* User Information */}
          {isAuthenticated && user && (
            <div className="user-info-card">
              <h2>User Information</h2>
              
              <div className="user-details-grid">
                <div className="user-detail">
                  <span className="detail-label">ID:</span>
                  <span className="detail-value">{user.id}</span>
                </div>
                
                <div className="user-detail">
                  <span className="detail-label">Auth Method:</span>
                  <span className={`detail-value auth-method ${user.authMethod}`}>
                    {user.authMethod === 'metamask' && '🦊 MetaMask'}
                    {user.authMethod === 'dynamic' && '🔗 Dynamic'}
                    {user.authMethod === 'social' && '👤 Social'}
                  </span>
                </div>
                
                {user.address && (
                  <div className="user-detail">
                    <span className="detail-label">Wallet Address:</span>
                    <span className="detail-value address">{user.address}</span>
                  </div>
                )}
                
                {user.profile?.name && (
                  <div className="user-detail">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{user.profile.name}</span>
                  </div>
                )}
                
                {user.reputation !== undefined && (
                  <div className="user-detail">
                    <span className="detail-label">Reputation:</span>
                    <span className="detail-value reputation">⭐ {user.reputation} points</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Authentication Methods Priority */}
          <div className="auth-methods-card">
            <h2>Authentication Priority</h2>
            <p>MegaVibe uses this order for authentication:</p>
            
            <div className="auth-methods-list">
              {authMethods.map((method, index) => (
                <div key={method} className={`auth-method-item ${method}`}>
                  <div className="method-rank">{index + 1}</div>
                  <div className="method-info">
                    <div className="method-name">
                      {method === 'metamask' && '🦊 MetaMask SDK'}
                      {method === 'dynamic' && '🔗 Dynamic.xyz'}
                      {method === 'social' && '👤 Social Login'}
                    </div>
                    <div className="method-description">
                      {method === 'metamask' && 'Primary - Direct MetaMask integration'}
                      {method === 'dynamic' && 'Secondary - Multi-wallet support'}
                      {method === 'social' && 'Fallback - For non-crypto users'}
                    </div>
                  </div>
                  <div className="method-features">
                    {method === 'metamask' && (
                      <>
                        <span className="feature">Hackathon Bonus</span>
                        <span className="feature">Gas Sponsorship</span>
                        <span className="feature">Instant Auth</span>
                      </>
                    )}
                    {method === 'dynamic' && (
                      <>
                        <span className="feature">Multi-wallet</span>
                        <span className="feature">Mobile Friendly</span>
                      </>
                    )}
                    {method === 'social' && (
                      <>
                        <span className="feature limited">Limited Features</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Authentication Button Demo */}
          <div className="auth-button-demo">
            <h2>Authentication Button</h2>
            <p>Try different button variants:</p>
            
            <div className="button-variants">
              <div className="button-variant">
                <h4>Primary</h4>
                <AuthButton variant="primary" showReputation={true} />
              </div>
              
              <div className="button-variant">
                <h4>Secondary</h4>
                <AuthButton variant="secondary" />
              </div>
              
              <div className="button-variant">
                <h4>Minimal</h4>
                <AuthButton variant="minimal" />
              </div>
            </div>
          </div>

          {/* Features Showcase */}
          <div className="features-card">
            <h2>🚀 Hackathon Features</h2>
            
            <div className="features-grid">
              <div className="feature-item">
                <div className="feature-icon">🦊</div>
                <div className="feature-content">
                  <h4>MetaMask SDK Primary</h4>
                  <p>Direct MetaMask integration for $2k bonus eligibility</p>
                </div>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon">🔐</div>
                <div className="feature-content">
                  <h4>Signature Authentication</h4>
                  <p>Secure wallet-based login without passwords</p>
                </div>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon">⭐</div>
                <div className="feature-content">
                  <h4>OnChain Reputation</h4>
                  <p>Behavioral data creates verifiable reputation</p>
                </div>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon">💰</div>
                <div className="feature-content">
                  <h4>USDC Integration</h4>
                  <p>All transactions use USDC stablecoin</p>
                </div>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon">🔄</div>
                <div className="feature-content">
                  <h4>Fallback Support</h4>
                  <p>Dynamic.xyz and social login for broader access</p>
                </div>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon">⚡</div>
                <div className="feature-content">
                  <h4>Gas Sponsorship Ready</h4>
                  <p>EIP-7702 support for sponsored transactions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthDemo;
