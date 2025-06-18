import React from 'react';
import { useWallet } from '../../contexts/WalletContext';
import './HeaderWalletStatus.css';

export const HeaderWalletStatus: React.FC = () => {
  const {
    isConnected,
    isConnecting,
    address,
    isCorrectNetwork,
    connectWallet,
    switchToMantleSepolia,
    formatAddress,
  } = useWallet();

  if (!isConnected) {
    return (
      <button
        className="header-wallet-btn not-connected"
        onClick={connectWallet}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <>
            <span className="spinner-sm"></span>
            <span className="btn-text">Connecting...</span>
          </>
        ) : (
          <>
            <span className="wallet-icon">👛</span>
            <span className="btn-text">Connect</span>
          </>
        )}
      </button>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <button
        className="header-wallet-btn wrong-network"
        onClick={switchToMantleSepolia}
        disabled={isConnecting}
      >
        <span className="wallet-icon">⚠️</span>
        <span className="btn-text">Switch Network</span>
      </button>
    );
  }

  return (
    <div className="header-wallet-status connected">
      <span className="wallet-icon">✅</span>
      <span className="wallet-address">{formatAddress(address || '')}</span>
    </div>
  );
};
