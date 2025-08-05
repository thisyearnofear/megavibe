"use client";

import React, { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useAddressResolver } from "@/services/identity/addressResolver";
import WalletConnect from "./WalletConnect";
import styles from "./EnhancedWalletDisplay.module.css";

interface EnhancedWalletDisplayProps {
  showBalance?: boolean;
  showPlatformBadges?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

export default function EnhancedWalletDisplay({
  showBalance = true,
  showPlatformBadges = true,
  compact = false,
  onClick,
}: EnhancedWalletDisplayProps) {
  const {
    walletAddress,
    balance,
    isConnected,
    disconnectWallet,
    isInitialized,
  } = useWallet();
  const { connect } = useWalletConnection();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  
  const openWalletModal = () => {
    connect('metamask' as any);
    setIsWalletModalOpen(true);
  };
  
  const closeWalletModal = () => {
    setIsWalletModalOpen(false);
  };
  const { identity, loading } = useAddressResolver(walletAddress);
  const [showDropdown, setShowDropdown] = useState(false);

  // Show loading state during initialization
  if (!isInitialized) {
    return (
      <div
        className={`${styles.walletDisplay} ${compact ? styles.compact : ""}`}
      >
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
        </div>
      </div>
    );
  }

  // Show connect button when not connected
  if (!isConnected || !walletAddress) {
    return (
      <div
        className={`${styles.walletDisplay} ${compact ? styles.compact : ""}`}
      >
        <button
          className={styles.connectButton}
          onClick={openWalletModal}
          aria-label="Connect wallet"
        >
          <span className={styles.connectIcon}>🔗</span>
          {!compact && <span className={styles.connectText}>Connect</span>}
        </button>
        {isWalletModalOpen && <WalletConnect />}
      </div>
    );
  }

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setShowDropdown(!showDropdown);
    }
  };

  const formatBalance = (
    balance: { mnt: string; formatted: string } | string
  ) => {
    // Handle object format from wallet context
    if (typeof balance === "object" && balance.formatted) {
      const num = parseFloat(balance.formatted);
      if (num === 0) return "0";
      if (num < 0.001) return "<0.001";
      if (num < 1) return num.toFixed(3);
      if (num < 1000) return num.toFixed(2);
      if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
      return `${(num / 1000000).toFixed(1)}M`;
    }

    // Handle string format (fallback)
    const balanceStr = typeof balance === "string" ? balance : "0";
    const num = parseFloat(balanceStr);
    if (num === 0) return "0";
    if (num < 0.001) return "<0.001";
    if (num < 1) return num.toFixed(3);
    if (num < 1000) return num.toFixed(2);
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    return `${(num / 1000000).toFixed(1)}M`;
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      ens: "🌐",
      farcaster: "🟣",
      lens: "🌿",
      twitter: "🐦",
      github: "🐙",
      basenames: "🔵",
    };
    return icons[platform] || "🔗";
  };

  return (
    <div className={`${styles.walletDisplay} ${compact ? styles.compact : ""}`}>
      <button
        className={styles.walletButton}
        onClick={handleClick}
        aria-label="Wallet information"
      >
        {/* Avatar */}
        <div className={styles.avatarContainer}>
          {identity?.avatar ? (
            <img
              src={identity.avatar}
              alt="Profile avatar"
              className={styles.avatar}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className={styles.defaultAvatar}>
              {identity?.ensName
                ? identity.ensName.charAt(0).toUpperCase()
                : "👤"}
            </div>
          )}
          {loading && <div className={styles.loadingSpinner} />}
        </div>

        {/* Identity Info */}
        <div className={styles.identityInfo}>
          <div className={styles.displayName}>
            {identity?.displayName ||
              `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
          </div>

          {showBalance && balance && (
            <div className={styles.balance}>{formatBalance(balance)} MNT</div>
          )}
        </div>

        {/* Platform Badges */}
        {showPlatformBadges &&
          identity?.platforms &&
          identity.platforms.length > 0 && (
            <div className={styles.platformBadges}>
              {identity.platforms.slice(0, 3).map((platform) => (
                <span
                  key={platform}
                  className={styles.platformBadge}
                  title={platform}
                >
                  {getPlatformIcon(platform)}
                </span>
              ))}
              {identity.platforms.length > 3 && (
                <span className={styles.moreBadge}>
                  +{identity.platforms.length - 3}
                </span>
              )}
            </div>
          )}

        {/* Dropdown Arrow */}
        <div
          className={`${styles.dropdownArrow} ${
            showDropdown ? styles.open : ""
          }`}
        >
          ▼
        </div>
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <div className={styles.fullAddress}>
              {walletAddress}
              <button
                className={styles.copyButton}
                onClick={() => navigator.clipboard.writeText(walletAddress)}
                title="Copy address"
              >
                📋
              </button>
            </div>
          </div>

          {identity?.description && (
            <div className={styles.description}>{identity.description}</div>
          )}

          {/* Social Links */}
          {identity?.social && (
            <div className={styles.socialLinks}>
              {identity.social.twitter && (
                <a
                  href={`https://twitter.com/${identity.social.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                >
                  🐦 Twitter
                </a>
              )}
              {identity.social.github && (
                <a
                  href={`https://github.com/${identity.social.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                >
                  🐙 GitHub
                </a>
              )}
              {identity.social.farcaster && (
                <a
                  href={`https://farcaster.xyz/${identity.social.farcaster}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                >
                  🟣 Farcaster
                </a>
              )}
            </div>
          )}

          {/* Website Link */}
          {identity?.links?.website && (
            <div className={styles.websiteLink}>
              <a
                href={identity.links.website}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
              >
                🌐 Website
              </a>
            </div>
          )}

          <div className={styles.dropdownActions}>
            <button
              className={styles.actionButton}
              onClick={() => {
                // Navigate to profile/dashboard
                window.location.href = "/dashboard";
              }}
            >
              👤 Profile
            </button>
            <button
              className={styles.actionButton}
              onClick={() => {
                disconnectWallet();
                setShowDropdown(false);
              }}
            >
              🚪 Disconnect
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className={styles.overlay}
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
