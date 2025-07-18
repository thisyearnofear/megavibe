'use client';

import React, { useState, useRef } from 'react';
import { useAdvancedGestures } from '@/hooks/useAdvancedGestures';
import { hapticFeedback } from '@/utils/mobile';
import styles from './GestureEnhancedCard.module.css';

interface GestureEnhancedCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
  className?: string;
  enableSwipeActions?: boolean;
  enableLongPress?: boolean;
  enableDoubleTap?: boolean;
  swipeLeftAction?: {
    icon: string;
    label: string;
    color: string;
  };
  swipeRightAction?: {
    icon: string;
    label: string;
    color: string;
  };
}

export default function GestureEnhancedCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  onLongPress,
  onDoubleTap,
  className = '',
  enableSwipeActions = true,
  enableLongPress = true,
  enableDoubleTap = true,
  swipeLeftAction = { icon: '❌', label: 'Remove', color: '#ef4444' },
  swipeRightAction = { icon: '❤️', label: 'Like', color: '#10b981' }
}: GestureEnhancedCardProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isPressed, setIsPressed] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const { gestureState } = useAdvancedGestures({
    onSwipeLeft: (velocity) => {
      if (enableSwipeActions && onSwipeLeft) {
        setSwipeOffset(-100);
        hapticFeedback('MEDIUM');
        setTimeout(() => {
          onSwipeLeft();
          setSwipeOffset(0);
        }, 200);
      }
    },
    onSwipeRight: (velocity) => {
      if (enableSwipeActions && onSwipeRight) {
        setSwipeOffset(100);
        hapticFeedback('MEDIUM');
        setTimeout(() => {
          onSwipeRight();
          setSwipeOffset(0);
        }, 200);
      }
    },
    onLongPress: (position) => {
      if (enableLongPress && onLongPress) {
        setIsPressed(true);
        onLongPress();
        setTimeout(() => setIsPressed(false), 300);
      }
    },
    onDoubleTap: (position) => {
      if (enableDoubleTap && onDoubleTap) {
        onDoubleTap();
      }
    },
    enableHaptics: true,
    enableVelocityTracking: true
  });

  const cardStyle = {
    transform: `translateX(${swipeOffset}px) scale(${isPressed ? 0.97 : 1})`,
    transition: swipeOffset === 0 ? 'all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)' : 'transform 0.2s ease',
    opacity: isPressed ? 0.9 : 1,
    boxShadow: isPressed ? '0 10px 25px rgba(0,0,0,0.1)' : '0 2px 10px rgba(0,0,0,0.1)',
    filter: isPressed ? 'brightness(0.95)' : 'brightness(1)'
  };

  return (
    <div className={styles.container}>
      {/* Swipe Action Backgrounds */}
      {enableSwipeActions && (
        <>
          <div 
            className={`${styles.swipeAction} ${styles.swipeLeft}`}
            style={{ backgroundColor: swipeLeftAction.color }}
          >
            <span className={styles.swipeIcon}>{swipeLeftAction.icon}</span>
            <span className={styles.swipeLabel}>{swipeLeftAction.label}</span>
          </div>
          <div 
            className={`${styles.swipeAction} ${styles.swipeRight}`}
            style={{ backgroundColor: swipeRightAction.color }}
          >
            <span className={styles.swipeIcon}>{swipeRightAction.icon}</span>
            <span className={styles.swipeLabel}>{swipeRightAction.label}</span>
          </div>
        </>
      )}

      {/* Main Card */}
      <div
        ref={cardRef}
        className={`${styles.card} ${className} ${
          gestureState.isLongPress ? styles.longPressed : ''
        } ${
          gestureState.isDoubleTap ? styles.doubleTapped : ''
        }`}
        style={cardStyle}
      >
        {children}
        
        {/* Long Press Progress Indicator */}
        {enableLongPress && gestureState.longPressProgress > 0 && (
          <div className={styles.longPressIndicator}>
            <div 
              className={styles.longPressProgress}
              style={{ width: `${gestureState.longPressProgress}%` }}
            />
          </div>
        )}
        
        {/* Touch Position Indicator */}
        {gestureState.touchPosition && (
          <div 
            className={styles.touchIndicator}
            style={{
              left: gestureState.touchPosition.x - 10,
              top: gestureState.touchPosition.y - 10
            }}
          />
        )}
      </div>
    </div>
  );
}
