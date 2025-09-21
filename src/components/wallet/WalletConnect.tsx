"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./WalletConnect.module.css";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { ProviderType } from "@/services/blockchain";
import Image from "next/image";

interface WalletOption {
  id: ProviderType;
  name: string;
  icon: string;
  description: string;
}

export default function WalletConnect() {
  const { walletInfo, connect, disconnect, switchNetwork } = useWalletConnection();
  const isConnected = walletInfo.isConnected;
  const walletAddress = walletInfo.address;
  const formattedAddress = walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : '';
  const balance = walletInfo.balance?.formatted || '0';
  const chainId = walletInfo.chainId;
  const isNetworkSupported = walletInfo.isSupported;
  const disconnectWallet = disconnect;
  const connectWallet = connect;
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const openWalletModal = () => setIsWalletModalOpen(true);
  const closeWalletModal = () => setIsWalletModalOpen(false);

  const [isConnecting, setIsConnecting] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Wallet options
  const walletOptions: WalletOption[] = [
    {
      id: ProviderType.METAMASK,
      name: "MetaMask",
      icon: "/icons/metamask.svg",
      description: "Connect to your MetaMask Wallet",
    },
    {
      id: ProviderType.WALLET_CONNECT,
      name: "WalletConnect",
      icon: "/icons/walletconnect.svg",
      description: "Scan with WalletConnect to connect",
    },
    {
      id: ProviderType.COINBASE,
      name: "Coinbase Wallet",
      icon: "/icons/coinbase.svg",
      description: "Connect to your Coinbase Wallet",
    },
  ];

  // Handle wallet connection with improved error handling
  const handleConnectWallet = async (walletType: ProviderType) => {
    setIsConnecting(true);
    try {
      await connectWallet(walletType as any);
      closeWalletModal();
      // Announce success to screen readers
      const announcement = `Successfully connected to ${walletOptions.find(w => w.id === walletType)?.name}`;
      announceToScreenReader(announcement);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      // Announce error to screen readers
      announceToScreenReader("Failed to connect wallet. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  // Helper function to announce messages to screen readers
  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  };

  // Switch to Mantle Sepolia if on unsupported network
  const handleSwitchToMantle = async () => {
    try {
      // Mantle Sepolia Chain ID
      await switchNetwork(5003);
      announceToScreenReader("Successfully switched to Mantle Sepolia network");
    } catch (error) {
      console.error("Failed to switch network:", error);
      announceToScreenReader("Failed to switch network. Please try again.");
    }
  };

  // Handle keyboard navigation for modal
  const handleModalKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      closeWalletModal();
    }
  };

  // Modal component to be rendered in portal
  const Modal = () => (
    <div 
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-modal-title"
      aria-describedby="wallet-modal-desc"
      onKeyDown={handleModalKeyDown}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeWalletModal();
        }
      }}
    >
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3 
            id="wallet-modal-title" 
            className={styles.modalTitle}
          >
            Connect Your Wallet
          </h3>
          <button
            onClick={closeWalletModal}
            className={styles.modalCloseBtn}
            aria-label="Close wallet connection modal"
            autoFocus
          >
            ✕
          </button>
        </div>

        <div id="wallet-modal-desc" style={{ position: 'absolute', left: '-10000px' }}>
          Choose a wallet provider to connect to MegaVibe. Use arrow keys to navigate options and Enter to select.
        </div>

        <div 
          className={styles.walletOptions}
          role="list"
          aria-label="Available wallet options"
        >
          {walletOptions.map((wallet, index) => (
            <button
              key={wallet.id}
              className={styles.walletOption}
              onClick={() => handleConnectWallet(wallet.id)}
              disabled={isConnecting}
              role="listitem"
              aria-describedby={`wallet-desc-${wallet.id}`}
              tabIndex={0}
            >
              <div className={styles.walletIconWrapper} aria-hidden="true">
                <Image
                  src={wallet.icon}
                  alt=""
                  width={32}
                  height={32}
                  className={styles.walletIcon}
                />
              </div>
              <div className={styles.walletDetails}>
                <h4 className={styles.walletName}>{wallet.name}</h4>
                <p 
                  id={`wallet-desc-${wallet.id}`}
                  className={styles.walletDescription}
                >
                  {wallet.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        {isConnecting && (
          <div 
            className={styles.connectingIndicator}
            role="status"
            aria-live="polite"
            aria-label="Connecting to wallet"
          >
            <div className={styles.spinner} aria-hidden="true"></div>
            <p>Connecting to wallet...</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.walletContainer}>
      {isConnected ? (
        <div className={styles.connectedState} role="region" aria-label="Wallet connection status">
          <div className={styles.walletInfo}>
            <div className={styles.walletAddress}>
              <span className={styles.addressLabel}>Connected:</span>
              <span 
                className={styles.addressValue}
                aria-label={`Wallet address: ${walletAddress}`}
                title={walletAddress}
              >
                {formattedAddress}
              </span>
            </div>
            <div className={styles.walletBalance}>
              <span 
                className={styles.balanceValue}
                aria-label={`Balance: ${balance} MNT`}
              >
                {balance}
              </span>
              <span className={styles.balanceUnit}>MNT</span>
            </div>
          </div>

          {!isNetworkSupported && (
            <div 
              className={styles.networkWarning}
              role="alert"
              aria-live="assertive"
            >
              <p>Unsupported network detected. Please switch to Mantle Sepolia.</p>
              <button
                onClick={handleSwitchToMantle}
                className={styles.switchNetworkBtn}
                aria-describedby="network-warning-desc"
              >
                Switch to Mantle Sepolia
              </button>
              <div id="network-warning-desc" style={{ position: 'absolute', left: '-10000px' }}>
                Click to switch your wallet to the Mantle Sepolia network
              </div>
            </div>
          )}

          <button
            onClick={() => disconnectWallet()}
            className={styles.disconnectButton}
            aria-label="Disconnect wallet"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button 
          onClick={openWalletModal} 
          className={styles.connectButton}
          aria-label="Open wallet connection modal"
          aria-describedby="connect-wallet-desc"
        >
          <span aria-hidden="true">🔗</span>
          <span>Connect Wallet</span>
          <div id="connect-wallet-desc" style={{ position: 'absolute', left: '-10000px' }}>
            Click to open the wallet connection options
          </div>
        </button>
      )}

      {/* Wallet Selection Modal with improved accessibility - rendered in portal */}
      {isWalletModalOpen && !isConnected && isClient && 
        createPortal(<Modal />, document.body)
      }
    </div>
  );
}
