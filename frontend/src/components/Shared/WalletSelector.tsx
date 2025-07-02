import React, { useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import MetaMaskConnector from './MetaMaskConnector';
import './WalletSelector.css';

interface WalletSelectorProps {
  onWalletConnected: (type: 'dynamic' | 'metamask', address: string, provider?: any) => void;
  onError: (error: string) => void;
}

export const WalletSelector: React.FC<WalletSelectorProps> = ({
  onWalletConnected,
  onError,
}) => {
  const [selectedWallet, setSelectedWallet] = useState<'dynamic' | 'metamask' | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const { setShowAuthFlow, user, isAuthenticated } = useDynamicContext();

  const handleDynamicConnect = () => {
    try {
      setIsConnecting(true);
      setSelectedWallet('dynamic');
      setShowAuthFlow(true);
    } catch (error: any) {
      onError(error.message || 'Failed to open Dynamic wallet connection');
      setIsConnecting(false);
    }
  };

  const handleMetaMaskConnect = (address: string, provider: any) => {
    try {
      setSelectedWallet('metamask');
      onWalletConnected('metamask', address, provider);
    } catch (error: any) {
      onError(error.message || 'Failed to connect MetaMask');
    }
  };

  const handleMetaMaskDisconnect = () => {
    setSelectedWallet(null);
  };

  const handleMetaMaskError = (error: string) => {
    onError(error);
    setSelectedWallet(null);
  };

  // If Dynamic is already authenticated, notify parent
  React.useEffect(() => {
    if (isAuthenticated && user && selectedWallet === 'dynamic') {
      const address = user.verifiedCredentials?.[0]?.address || user.walletPublicKey;
      if (address) {
        onWalletConnected('dynamic', address);
        setIsConnecting(false);
      }
    }
  }, [isAuthenticated, user, selectedWallet, onWalletConnected]);

  return (
    <div className="wallet-selector">
      <div className="wallet-selector-header">
        <h3>Connect Your Wallet</h3>
        <p>Choose your preferred wallet to connect to MegaVibe</p>
      </div>

      <div className="wallet-options">
        {/* MetaMask SDK Option */}
        <div className="wallet-option metamask-option">
          <div className="wallet-info">
            <div className="wallet-icon">🦊</div>
            <div className="wallet-details">
              <h4>MetaMask</h4>
              <p>Connect directly with MetaMask browser extension</p>
              <span className="bonus-badge">Recommended</span>
            </div>
          </div>
          
          <MetaMaskConnector
            onConnect={handleMetaMaskConnect}
            onDisconnect={handleMetaMaskDisconnect}
            onError={handleMetaMaskError}
          />
        </div>

        {/* Dynamic Labs Option */}
        <div className="wallet-option dynamic-option">
          <div className="wallet-info">
            <div className="wallet-icon">⚡</div>
            <div className="wallet-details">
              <h4>Multi-Wallet Support</h4>
              <p>MetaMask, Coinbase, WalletConnect, and more</p>
              <span className="provider-badge">Powered by Dynamic Labs</span>
            </div>
          </div>
          
          <button
            onClick={handleDynamicConnect}
            disabled={isConnecting}
            className="connect-dynamic-btn"
          >
            {isConnecting ? 'Opening...' : 'Connect Wallet'}
          </button>
        </div>
      </div>

      <div className="wallet-selector-footer">
        <p className="security-note">
          🔒 Your wallet connection is secure. MegaVibe never stores your private keys.
        </p>
      </div>
    </div>
  );
};

export default WalletSelector;