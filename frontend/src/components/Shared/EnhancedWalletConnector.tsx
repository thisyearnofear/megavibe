import React, { useState, useEffect } from 'react';
import { useDynamicContext, DynamicWidget } from '@dynamic-labs/sdk-react-core';
import { useAccount, useDisconnect, useBalance } from 'wagmi';
import '../../styles/EnhancedWalletConnector.css';

interface EnhancedWalletConnectorProps {
  onConnect: (walletAddress: string) => void;
  onDisconnect: () => void;
  connectedAddress?: string;
  showBalance?: boolean;
  compact?: boolean;
}

export const EnhancedWalletConnector: React.FC<
  EnhancedWalletConnectorProps
> = ({
  onConnect,
  onDisconnect,
  connectedAddress,
  showBalance = true,
  compact = false,
}) => {
  const { user } = useDynamicContext();
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Get balance if wallet is connected
  const { data: balance } = useBalance({
    address: address,
    query: { enabled: !!address && isConnected && showBalance },
  });

  useEffect(() => {
    if (isConnected && address) {
      setIsAnimating(true);
      onConnect(address);
      setTimeout(() => setIsAnimating(false), 600);
    } else if (!isConnected && connectedAddress) {
      onDisconnect();
    }
  }, [isConnected, address, connectedAddress, onConnect, onDisconnect]);

  const handleDisconnect = () => {
    setIsAnimating(true);
    disconnect();
    onDisconnect();
    setError(null);
    setShowDropdown(false);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (bal: { formatted: string } | undefined) => {
    if (!bal) return '0.00';
    const value = parseFloat(bal.formatted);
    return value.toFixed(4);
  };

  const getChainName = () => {
    if (!chain) return 'Unknown';
    return chain.name;
  };

  const getChainIcon = () => {
    if (!chain) return '🔗';
    switch (chain.id) {
      case 1:
        return '🔷'; // Ethereum
      case 5000:
        return '🟢'; // Mantle
      case 8453:
        return '🔵'; // Base
      case 42161:
        return '🔴'; // Arbitrum
      default:
        return '🔗';
    }
  };

  if (compact && isConnected && address) {
    return (
      <div className="enhanced-wallet-compact">
        <button
          className="wallet-compact-button"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <div className="wallet-avatar">
            <div className="avatar-gradient"></div>
            <span className="avatar-text">
              {address.slice(2, 4).toUpperCase()}
            </span>
          </div>
          <span className="wallet-address">{formatAddress(address)}</span>
        </button>

        {showDropdown && (
          <div className="wallet-dropdown">
            <div className="dropdown-header">
              <div className="user-info">
                <div className="wallet-avatar large">
                  <div className="avatar-gradient"></div>
                  <span className="avatar-text">
                    {address.slice(2, 4).toUpperCase()}
                  </span>
                </div>
                <div className="user-details">
                  <span className="user-address">{formatAddress(address)}</span>
                  <span className="chain-info">
                    {getChainIcon()} {getChainName()}
                  </span>
                </div>
              </div>
            </div>

            {showBalance && balance && (
              <div className="balance-info">
                <span className="balance-label">Balance</span>
                <span className="balance-value">
                  {formatBalance(balance)} {balance.symbol}
                </span>
              </div>
            )}

            <div className="dropdown-actions">
              <button
                className="action-button copy"
                onClick={() => navigator.clipboard.writeText(address)}
              >
                📋 Copy Address
              </button>
              <button
                className="action-button disconnect"
                onClick={handleDisconnect}
              >
                🚪 Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`enhanced-wallet-container ${isAnimating ? 'animating' : ''}`}
    >
      {isConnected && address ? (
        <div className="wallet-connected">
          <div className="connection-indicator">
            <div className="status-dot connected"></div>
            <span className="status-text">Connected</span>
          </div>

          <div className="wallet-info">
            <div className="wallet-header">
              <div className="wallet-avatar">
                <div className="avatar-gradient"></div>
                <span className="avatar-text">
                  {address.slice(2, 4).toUpperCase()}
                </span>
              </div>

              <div className="wallet-details">
                <div className="wallet-address-row">
                  <span className="wallet-address">
                    {formatAddress(address)}
                  </span>
                  <button
                    className="copy-button"
                    onClick={() => navigator.clipboard.writeText(address)}
                    title="Copy address"
                  >
                    📋
                  </button>
                </div>

                <div className="chain-info">
                  <span className="chain-icon">{getChainIcon()}</span>
                  <span className="chain-name">{getChainName()}</span>
                </div>
              </div>
            </div>

            {showBalance && balance && (
              <div className="balance-display">
                <div className="balance-row">
                  <span className="balance-label">Balance:</span>
                  <span className="balance-amount">
                    {formatBalance(balance)} {balance.symbol}
                  </span>
                </div>
              </div>
            )}

            {user && (
              <div className="user-info">
                <span className="user-email">{user.email}</span>
              </div>
            )}
          </div>

          <button onClick={handleDisconnect} className="disconnect-button">
            <span className="disconnect-icon">🚪</span>
            <span className="disconnect-text">Disconnect</span>
          </button>
        </div>
      ) : (
        <div className="wallet-disconnected">
          <div className="connection-indicator">
            <div className="status-dot disconnected"></div>
            <span className="status-text">Not Connected</span>
          </div>

          <div className="connect-section">
            <div className="connect-prompt">
              <h3>Connect Your Wallet</h3>
              <p>
                Set bounties and tips, or earn (from) them, monetize live content
          
              </p>
            </div>

            <div className="dynamic-widget-wrapper">
              <DynamicWidget />
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
          <button className="error-dismiss" onClick={() => setError(null)}>
            ×
          </button>
        </div>
      )}
    </div>
  );
};
