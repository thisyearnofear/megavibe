// MetaMask SDK Primary Authentication Modal
// Prioritizes MetaMask SDK with fallback options

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  title = "Connect to MegaVibe",
  subtitle = "Choose your preferred authentication method"
}) => {
  const {
    authenticateWithMetaMask,
    authenticateWithDynamic,
    authenticateWithSocial,
    isConnecting,
    error,
    getAuthMethodPriority
  } = useAuth();

  const [selectedMethod, setSelectedMethod] = useState<'metamask' | 'dynamic' | 'social' | null>(null);
  const [showSocialOptions, setShowSocialOptions] = useState(false);

  if (!isOpen) return null;

  const handleMetaMaskConnect = async () => {
    setSelectedMethod('metamask');
    try {
      await authenticateWithMetaMask();
    } catch (error) {
      setSelectedMethod(null);
    }
  };

  const handleDynamicConnect = async () => {
    setSelectedMethod('dynamic');
    try {
      await authenticateWithDynamic();
    } catch (error) {
      setSelectedMethod(null);
    }
  };

  const handleSocialConnect = async (provider: string) => {
    setSelectedMethod('social');
    try {
      // This would integrate with actual social providers
      // For now, we'll show a placeholder
      console.log(`Social login with ${provider} - to be implemented`);
      setShowSocialOptions(false);
      setSelectedMethod(null);
    } catch (error) {
      setSelectedMethod(null);
    }
  };

  const isMethodConnecting = (method: string) => {
    return isConnecting && selectedMethod === method;
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <h2>{title}</h2>
          <p>{subtitle}</p>
          <button className="auth-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="auth-modal-content">
          {error && (
            <div className="auth-error">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="auth-methods">
            {/* Primary: MetaMask SDK */}
            <div className="auth-method primary">
              <div className="auth-method-header">
                <div className="auth-method-icon">🦊</div>
                <div className="auth-method-info">
                  <h3>MetaMask</h3>
                  <p>Connect with MetaMask browser extension</p>
                  <div className="auth-method-badges">
                    <span className="badge primary">Recommended</span>
                    <span className="badge bonus">Hackathon Bonus</span>
                  </div>
                </div>
              </div>
              
              <button
                className="auth-method-button primary"
                onClick={handleMetaMaskConnect}
                disabled={isConnecting}
              >
                {isMethodConnecting('metamask') ? (
                  <>
                    <span className="spinner"></span>
                    Connecting...
                  </>
                ) : (
                  'Connect with MetaMask'
                )}
              </button>

              <div className="auth-method-features">
                <div className="feature">✅ Instant authentication</div>
                <div className="feature">✅ No email required</div>
                <div className="feature">✅ Maximum security</div>
                <div className="feature">✅ Gas sponsorship available</div>
              </div>
            </div>

            {/* Secondary: Dynamic.xyz */}
            <div className="auth-method secondary">
              <div className="auth-method-header">
                <div className="auth-method-icon">🔗</div>
                <div className="auth-method-info">
                  <h3>Other Wallets</h3>
                  <p>Coinbase Wallet, WalletConnect, and more</p>
                  <div className="auth-method-badges">
                    <span className="badge secondary">Multi-wallet</span>
                  </div>
                </div>
              </div>
              
              <button
                className="auth-method-button secondary"
                onClick={handleDynamicConnect}
                disabled={isConnecting}
              >
                {isMethodConnecting('dynamic') ? (
                  <>
                    <span className="spinner"></span>
                    Connecting...
                  </>
                ) : (
                  'Connect Other Wallet'
                )}
              </button>

              <div className="auth-method-features">
                <div className="feature">✅ Multiple wallet support</div>
                <div className="feature">✅ Mobile wallet friendly</div>
                <div className="feature">✅ WalletConnect integration</div>
              </div>
            </div>

            {/* Tertiary: Social Login */}
            <div className="auth-method tertiary">
              <div className="auth-method-header">
                <div className="auth-method-icon">👤</div>
                <div className="auth-method-info">
                  <h3>Social Login</h3>
                  <p>For users without crypto wallets</p>
                  <div className="auth-method-badges">
                    <span className="badge tertiary">Limited Features</span>
                  </div>
                </div>
              </div>
              
              {!showSocialOptions ? (
                <button
                  className="auth-method-button tertiary"
                  onClick={() => setShowSocialOptions(true)}
                  disabled={isConnecting}
                >
                  Continue with Social
                </button>
              ) : (
                <div className="social-options">
                  <button
                    className="social-button google"
                    onClick={() => handleSocialConnect('google')}
                    disabled={isConnecting}
                  >
                    {isMethodConnecting('social') ? (
                      <>
                        <span className="spinner"></span>
                        Connecting...
                      </>
                    ) : (
                      <>
                        <span className="social-icon">🔍</span>
                        Google
                      </>
                    )}
                  </button>
                  
                  <button
                    className="social-button twitter"
                    onClick={() => handleSocialConnect('twitter')}
                    disabled={isConnecting}
                  >
                    <span className="social-icon">🐦</span>
                    Twitter
                  </button>
                  
                  <button
                    className="social-button github"
                    onClick={() => handleSocialConnect('github')}
                    disabled={isConnecting}
                  >
                    <span className="social-icon">🐙</span>
                    GitHub
                  </button>
                  
                  <button
                    className="social-back"
                    onClick={() => setShowSocialOptions(false)}
                  >
                    ← Back
                  </button>
                </div>
              )}

              <div className="auth-method-limitations">
                <div className="limitation">⚠️ Cannot send/receive tips</div>
                <div className="limitation">⚠️ Limited reputation features</div>
                <div className="limitation">⚠️ No blockchain interactions</div>
              </div>
            </div>
          </div>

          <div className="auth-modal-footer">
            <div className="auth-priority-note">
              <strong>Recommended order:</strong> MetaMask → Other Wallets → Social Login
            </div>
            
            <div className="auth-help">
              <p>
                New to crypto? <a href="#" target="_blank">Learn about wallets</a>
              </p>
              <p>
                Need help? <a href="#" target="_blank">Contact support</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
