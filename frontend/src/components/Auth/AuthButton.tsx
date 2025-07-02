// MetaMask SDK Primary Authentication Button
// Shows current auth state and opens auth modal

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from './AuthModal';
import './AuthButton.css';

interface AuthButtonProps {
  variant?: 'primary' | 'secondary' | 'minimal';
  showBalance?: boolean;
  showReputation?: boolean;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  variant = 'primary',
  showBalance = false,
  showReputation = false,
}) => {
  const {
    user,
    isAuthenticated,
    isConnecting,
    logout,
    showAuthModal,
    setShowAuthModal,
    hasWallet,
  } = useAuth();

  const handleAuthClick = () => {
    if (isAuthenticated) {
      // Show user menu or logout
      logout();
    } else {
      // Open auth modal
      setShowAuthModal(true);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getAuthMethodIcon = (method: string) => {
    switch (method) {
      case 'metamask':
        return '🦊';
      case 'dynamic':
        return '🔗';
      case 'social':
        return '👤';
      default:
        return '🔐';
    }
  };

  const getAuthMethodLabel = (method: string) => {
    switch (method) {
      case 'metamask':
        return 'MetaMask';
      case 'dynamic':
        return 'Wallet';
      case 'social':
        return 'Social';
      default:
        return 'Auth';
    }
  };

  if (isAuthenticated && user) {
    return (
      <div className={`auth-button authenticated ${variant}`}>
        <div className="auth-user-info">
          <div className="auth-method-indicator">
            <span className="auth-method-icon">
              {getAuthMethodIcon(user.authMethod)}
            </span>
            <span className="auth-method-label">
              {getAuthMethodLabel(user.authMethod)}
            </span>
          </div>
          
          <div className="user-details">
            <div className="user-name">
              {user.profile?.name || user.id.slice(0, 8)}
            </div>
            
            {hasWallet() && user.address && (
              <div className="user-address">
                {formatAddress(user.address)}
              </div>
            )}
            
            {showReputation && user.reputation !== undefined && (
              <div className="user-reputation">
                ⭐ {user.reputation} pts
              </div>
            )}
          </div>
        </div>

        <button
          className="auth-logout-button"
          onClick={handleAuthClick}
          disabled={isConnecting}
          title="Logout"
        >
          {isConnecting ? '...' : '↗️'}
        </button>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </div>
    );
  }

  return (
    <>
      <button
        className={`auth-button unauthenticated ${variant}`}
        onClick={handleAuthClick}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <>
            <span className="auth-spinner"></span>
            Connecting...
          </>
        ) : (
          <>
            <span className="auth-icon">🦊</span>
            Connect Wallet
          </>
        )}
      </button>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};

export default AuthButton;
