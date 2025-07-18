"use client";

import React, { useState } from "react";
import GestureEnhancedCard from "./GestureEnhancedCard";
import { hapticFeedback } from "@/utils/mobile";
import styles from "./SwipeablePerformerCard.module.css";

interface Performer {
  id: string;
  name: string;
  genre: string;
  avatar?: string;
  isLive?: boolean;
  tipAmount?: string;
  reputation?: number;
}

interface SwipeablePerformerCardProps {
  performer: Performer;
  onTip?: (performerId: string) => void;
  onFavorite?: (performerId: string) => void;
  onViewProfile?: (performerId: string) => void;
  onShare?: (performerId: string) => void;
}

export default function SwipeablePerformerCard({
  performer,
  onTip,
  onFavorite,
  onViewProfile,
  onShare,
}: SwipeablePerformerCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [showQuickTip, setShowQuickTip] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleSwipeRight = () => {
    // Quick tip gesture
    if (onTip) {
      setShowQuickTip(true);
      hapticFeedback("MEDIUM");

      setTimeout(() => {
        onTip(performer.id);
        setShowQuickTip(false);
        hapticFeedback("HEAVY");
        setIsPressed(true);
        setTimeout(() => setIsPressed(false), 300);
      }, 1000);
    }
  };

  const handleSwipeLeft = () => {
    // Favorite gesture
    setIsFavorited(!isFavorited);
    if (onFavorite) {
      onFavorite(performer.id);
    }
    hapticFeedback("LIGHT");
  };

  const handleLongPress = () => {
    // Show context menu or detailed actions
    if (onShare) {
      onShare(performer.id);
    }
  };

  const handleDoubleTap = () => {
    // Quick view profile
    if (onViewProfile) {
      onViewProfile(performer.id);
    }
  };

  return (
    <div className={styles.container}>
      <GestureEnhancedCard
        onSwipeRight={handleSwipeRight}
        onSwipeLeft={handleSwipeLeft}
        onLongPress={handleLongPress}
        onDoubleTap={handleDoubleTap}
        swipeRightAction={{
          icon: "💰",
          label: "Quick Tip",
          color: "#10b981",
        }}
        swipeLeftAction={{
          icon: isFavorited ? "💔" : "❤️",
          label: isFavorited ? "Unfavorite" : "Favorite",
          color: "#ef4444",
        }}
        className={styles.card}
      >
        <div className={styles.cardContent}>
          {/* Avatar and Live Indicator */}
          <div className={styles.avatarContainer}>
            <div className={styles.avatar}>
              {performer.avatar ? (
                <img src={performer.avatar} alt={performer.name} />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {performer.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {performer.isLive && (
              <div className={styles.liveIndicator}>
                <span className={styles.liveDot}></span>
                LIVE
              </div>
            )}
          </div>

          {/* Performer Info */}
          <div className={styles.performerInfo}>
            <h3 className={styles.performerName}>{performer.name}</h3>
            <p className={styles.performerGenre}>{performer.genre}</p>

            {performer.reputation && (
              <div className={styles.reputation}>
                <span className={styles.reputationIcon}>⭐</span>
                <span className={styles.reputationScore}>
                  {performer.reputation}
                </span>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className={styles.quickActions}>
            {performer.tipAmount && (
              <div className={styles.tipAmount}>
                <span className={styles.tipIcon}>💰</span>
                <span>{performer.tipAmount} ETH</span>
              </div>
            )}

            <button
              className={`${styles.favoriteButton} ${
                isFavorited ? styles.favorited : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleSwipeLeft();
              }}
            >
              {isFavorited ? "❤️" : "🤍"}
            </button>
          </div>
        </div>

        {/* Quick Tip Feedback */}
        {showQuickTip && (
          <div className={styles.quickTipFeedback}>
            <div className={styles.tipAnimation}>
              <span className={styles.tipIcon}>💰</span>
              <span className={styles.tipText}>Tip Sent!</span>
            </div>
          </div>
        )}

        {/* Gesture Hints */}
        <div className={styles.gestureHints}>
          <div className={styles.gestureHint}>
            <span className={styles.gestureIcon}>👆</span>
            <span className={styles.gestureText}>Double tap for profile</span>
          </div>
          <div className={styles.gestureHint}>
            <span className={styles.gestureIcon}>👈</span>
            <span className={styles.gestureText}>Swipe for actions</span>
          </div>
        </div>
      </GestureEnhancedCard>
    </div>
  );
}
