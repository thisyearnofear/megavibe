"use client";

import React, { useState } from "react";
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
  const {
    isConnected,
    walletAddress,
    formattedAddress,
    balance,
    chainId,
    isNetworkSupported,
    disconnectWallet,
    connectWallet,
    isWalletModalOpen,
    openWalletModal,
    closeWalletModal,
    switchNetwork,
  } = useWalletConnection();

  const [isConnecting, setIsConnecting] = useState(false);

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

  // Handle wallet connection
  const handleConnectWallet = async (walletType: ProviderType) => {
    setIsConnecting(true);
    try {
      await connectWallet(walletType);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Switch to Mantle Sepolia if on unsupported network
  const handleSwitchToMantle = async () => {
    try {
      // Mantle Sepolia Chain ID
      await switchNetwork(5003);
    } catch (error) {
      console.error("Failed to switch network:", error);
    }
  };

  return (
    <div className={styles.walletContainer}>
      {isConnected ? (
        <div className={styles.connectedState}>
          <div className={styles.walletInfo}>
            <div className={styles.walletAddress}>
              <span className={styles.addressLabel}>Connected:</span>
              <span className={styles.addressValue}>{formattedAddress}</span>
            </div>
            <div className={styles.walletBalance}>
              <span className={styles.balanceValue}>{balance.formatted}</span>
              <span className={styles.balanceUnit}>MNT</span>
            </div>
          </div>

          {!isNetworkSupported && (
            <div className={styles.networkWarning}>
              <p>Unsupported network detected</p>
              <button
                onClick={handleSwitchToMantle}
                className={styles.switchNetworkBtn}
              >
                Switch to Mantle Sepolia
              </button>
            </div>
          )}

          <button
            onClick={disconnectWallet}
            className={styles.disconnectButton}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button onClick={openWalletModal} className={styles.connectButton}>
          Connect Wallet
        </button>
      )}

      {/* Wallet Selection Modal */}
      {isWalletModalOpen && !isConnected && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Connect Your Wallet</h3>
              <button
                onClick={closeWalletModal}
                className={styles.modalCloseBtn}
              >
                ✕
              </button>
            </div>

            <div className={styles.walletOptions}>
              {walletOptions.map((wallet) => (
                <div
                  key={wallet.id}
                  className={styles.walletOption}
                  onClick={() => handleConnectWallet(wallet.id)}
                >
                  <div className={styles.walletIconWrapper}>
                    <Image
                      src={wallet.icon}
                      alt={wallet.name}
                      width={32}
                      height={32}
                      className={styles.walletIcon}
                    />
                  </div>
                  <div className={styles.walletDetails}>
                    <h4 className={styles.walletName}>{wallet.name}</h4>
                    <p className={styles.walletDescription}>
                      {wallet.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {isConnecting && (
              <div className={styles.connectingIndicator}>
                <div className={styles.spinner}></div>
                <p>Connecting to wallet...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
