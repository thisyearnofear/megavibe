import React from 'react';
import { useWallet } from '../../contexts/WalletContext';
import './WalletStatusCard.css';

interface WalletStatusCardProps {
  showBalance?: boolean;
  showNetworkInfo?: boolean;
  className?: string;
  compact?: boolean;
}

export const WalletStatusCard: React.FC<WalletStatusCardProps> = ({
  showBalance = true,
  showNetworkInfo = true,
  className = '',
  compact = false,
}) => {
  const {
    isConnected,
    isConnecting,
    address,
    balance,
    chainId,
    isCorrectNetwork,
    error,
    connectWallet,
    disconnectWallet,
    switchToMantleSepolia,
    formatBalance,
    formatAddress,
    clearError,
  } = useWallet();

  if (!isConnected) {
    return (
      <div className={`wallet-status-card not-connected ${className} ${compact ? 'compact' : ''}`}>
        <div className="wallet-status-content">
          <div className="wallet-icon">👛</div>
          <div className="wallet-info">
            <h3>Connect Wallet</h3>
            <p>Connect your wallet to send tips</p>
          </div>
          <button
            className="connect-btn"
            onClick={connectWallet}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <span className="spinner"></span>
                Connecting...
              </>
            ) : (
              'Connect Wallet'
            )}
          </button>
        </div>
        {error && (
          <div className="error-message">
            <span>{error}</span>
            <button onClick={clearError} className="error-close">×</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`wallet-status-card connected ${className} ${compact ? 'compact' : ''} ${!isCorrectNetwork ? 'wrong-network' : ''}`}>
      <div className="wallet-status-content">
        <div className="wallet-icon">
          {isCorrectNetwork ? '✅' : '⚠️'}
        </div>

        <div className="wallet-info">
          <div className="wallet-address">
            <span className="address-label">Wallet:</span>
            <span className="address-value">{formatAddress(address || '')}</span>
          </div>

          {showBalance && (
            <div className="wallet-balance">
              <span className="balance-label">Balance:</span>
              <span className="balance-value">{formatBalance(balance)} MNT</span>
            </div>
          )}

          {showNetworkInfo && (
            <div className="network-info">
              <span className="network-label">Network:</span>
              <span className={`network-value ${isCorrectNetwork ? 'correct' : 'incorrect'}`}>
                {chainId === 5003 ? 'Mantle Sepolia ✓' : `Chain ${chainId} ⚠️`}
              </span>
            </div>
          )}
        </div>

        <div className="wallet-actions">
          {!isCorrectNetwork && (
            <button
              className="switch-network-btn"
              onClick={switchToMantleSepolia}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <span className="spinner"></span>
                  Switching...
                </>
              ) : (
                'Switch to Mantle Sepolia'
              )}
            </button>
          )}

          {!compact && (
            <button
              className="disconnect-btn"
              onClick={disconnectWallet}
              title="Disconnect Wallet"
            >
              🔌
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button onClick={clearError} className="error-close">×</button>
        </div>
      )}

      {!isCorrectNetwork && (
        <div className="network-warning">
          <p>⚠️ Please switch to Mantle Sepolia network to send tips</p>
        </div>
      )}
    </div>
  );
};
