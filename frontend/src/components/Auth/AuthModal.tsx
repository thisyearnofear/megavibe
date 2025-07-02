// Consolidated Authentication Modal
// Clean, DRY, minimal design

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
  title = "MegaVibe",
  subtitle = "Choose your method"
}) => {
  const {
    authenticateWithMetaMask,
    authenticateWithDynamic,
    isConnecting,
    error
  } = useAuth();

  const [selectedMethod, setSelectedMethod] = useState<'metamask' | 'dynamic' | null>(null);

  if (!isOpen) return null;

  const handleMetaMaskConnect = async () => {
    setSelectedMethod('metamask');
    try {
      await authenticateWithMetaMask();
      onClose();
    } catch (error) {
      setSelectedMethod(null);
    }
  };

  const handleDynamicConnect = async () => {
    setSelectedMethod('dynamic');
    try {
      await authenticateWithDynamic();
      onClose();
    } catch (error) {
      setSelectedMethod(null);
    }
  };

  const isMethodConnecting = (method: 'metamask' | 'dynamic') => {
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
            {/* Wallet Login */}
            <div className="auth-method primary">
              <div className="auth-method-header">
                <div className="auth-method-icon">🦊</div>
                <div className="auth-method-info">
                  <h3>Wallet Login</h3>
                  <div className="auth-method-badges">
                    <span className="badge primary">Recommended</span>
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
            </div>

            {/* Social/Email Login */}
            <div className="auth-method secondary">
              <div className="auth-method-header">
                <div className="auth-method-icon">🔗</div>
                <div className="auth-method-info">
                  <h3>Social/Email Login</h3>
                  <p>CB Wallet, WalletConnect, etc</p>
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
                  'Connect Alternative'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
