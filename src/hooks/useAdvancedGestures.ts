'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { hapticFeedback, throttle } from '@/utils/mobile';

interface AdvancedGestureState {
  // Basic gestures
  isSwipeLeft: boolean;
  isSwipeRight: boolean;
  isSwipeUp: boolean;
  isSwipeDown: boolean;
  
  // Advanced gestures
  isLongPress: boolean;
  isDoubleTap: boolean;
  isPinching: boolean;
  isRotating: boolean;
  
  // Gesture data
  swipeVelocity: number;
  pinchScale: number;
  rotationAngle: number;
  longPressProgress: number;
  
  // Touch position
  touchPosition: { x: number; y: number } | null;
}

interface AdvancedGestureOptions {
  // Swipe options
  onSwipeLeft?: (velocity: number) => void;
  onSwipeRight?: (velocity: number) => void;
  onSwipeUp?: (velocity: number) => void;
  onSwipeDown?: (velocity: number) => void;
  
  // Advanced gesture callbacks
  onLongPress?: (position: { x: number; y: number }) => void;
  onDoubleTap?: (position: { x: number; y: number }) => void;
  onPinch?: (scale: number, center: { x: number; y: number }) => void;
  onRotate?: (angle: number, center: { x: number; y: number }) => void;
  
  // Pull to refresh
  onPullToRefresh?: () => void;
  
  // Thresholds
  swipeThreshold?: number;
  velocityThreshold?: number;
  longPressDelay?: number;
  doubleTapDelay?: number;
  
  // Features
  enableHaptics?: boolean;
  enableVelocityTracking?: boolean;
  enableRotation?: boolean;
}

export function useAdvancedGestures(options: AdvancedGestureOptions = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onLongPress,
    onDoubleTap,
    onPinch,
    onRotate,
    onPullToRefresh,
    swipeThreshold = 50,
    velocityThreshold = 0.5,
    longPressDelay = 500,
    doubleTapDelay = 300,
    enableHaptics = true,
    enableVelocityTracking = true,
    enableRotation = false
  } = options;

  const [gestureState, setGestureState] = useState<AdvancedGestureState>({
    isSwipeLeft: false,
    isSwipeRight: false,
    isSwipeUp: false,
    isSwipeDown: false,
    isLongPress: false,
    isDoubleTap: false,
    isPinching: false,
    isRotating: false,
    swipeVelocity: 0,
    pinchScale: 1,
    rotationAngle: 0,
    longPressProgress: 0,
    touchPosition: null
  });

  // Refs for tracking gesture data
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressProgressRef = useRef<NodeJS.Timeout | null>(null);
  const initialTouchesRef = useRef<TouchList | null>(null);
  const lastAngleRef = useRef<number>(0);

  // Utility functions
  const getDistance = (touch1: Touch, touch2: Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getAngle = (touch1: Touch, touch2: Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.atan2(dy, dx) * 180 / Math.PI;
  };

  const getCenter = (touch1: Touch, touch2: Touch) => ({
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2
  });

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (longPressProgressRef.current) {
      clearInterval(longPressProgressRef.current);
      longPressProgressRef.current = null;
    }
    setGestureState(prev => ({ ...prev, longPressProgress: 0 }));
  };

  const startLongPressTimer = (x: number, y: number) => {
    clearLongPressTimer();
    
    // Progress animation
    let progress = 0;
    longPressProgressRef.current = setInterval(() => {
      progress += 100 / (longPressDelay / 10);
      setGestureState(prev => ({ ...prev, longPressProgress: Math.min(progress, 100) }));
    }, 10);

    // Long press trigger
    longPressTimerRef.current = setTimeout(() => {
      setGestureState(prev => ({ ...prev, isLongPress: true, longPressProgress: 100 }));
      onLongPress?.({ x, y });
      if (enableHaptics) hapticFeedback('HEAVY');
      
      setTimeout(() => {
        setGestureState(prev => ({ ...prev, isLongPress: false, longPressProgress: 0 }));
      }, 200);
    }, longPressDelay);
  };

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    const now = Date.now();

    if (e.touches.length === 1) {
      // Single touch
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: now
      };

      setGestureState(prev => ({ 
        ...prev, 
        touchPosition: { x: touch.clientX, y: touch.clientY } 
      }));

      // Check for double tap
      if (lastTapRef.current && 
          now - lastTapRef.current.time < doubleTapDelay &&
          Math.abs(touch.clientX - lastTapRef.current.x) < 50 &&
          Math.abs(touch.clientY - lastTapRef.current.y) < 50) {
        
        setGestureState(prev => ({ ...prev, isDoubleTap: true }));
        onDoubleTap?.({ x: touch.clientX, y: touch.clientY });
        if (enableHaptics) hapticFeedback('MEDIUM');
        
        setTimeout(() => {
          setGestureState(prev => ({ ...prev, isDoubleTap: false }));
        }, 200);
        
        lastTapRef.current = null;
      } else {
        lastTapRef.current = { time: now, x: touch.clientX, y: touch.clientY };
        startLongPressTimer(touch.clientX, touch.clientY);
      }
    } else if (e.touches.length === 2) {
      // Multi-touch
      clearLongPressTimer();
      initialTouchesRef.current = e.touches;
      
      if (enableRotation) {
        lastAngleRef.current = getAngle(e.touches[0], e.touches[1]);
      }
      
      setGestureState(prev => ({ ...prev, isPinching: true }));
    }
  }, [doubleTapDelay, longPressDelay, onDoubleTap, onLongPress, enableHaptics, enableRotation]);

  const handleTouchMove = useCallback(throttle((e: unknown) => {
    const touchEvent = e as TouchEvent;
    if (touchEvent.touches.length === 1 && touchStartRef.current) {
      const touch = touchEvent.touches[0];
      const deltaY = touch.clientY - touchStartRef.current.y;
      
      // Clear long press if moved too much
      if (Math.abs(deltaY) > 10 || Math.abs(touch.clientX - touchStartRef.current.x) > 10) {
        clearLongPressTimer();
      }
      
      // Pull to refresh
      if (deltaY > 80 && window.scrollY === 0 && onPullToRefresh) {
        setGestureState(prev => ({ ...prev, touchPosition: { x: touch.clientX, y: touch.clientY } }));
      }
    } else if (touchEvent.touches.length === 2 && initialTouchesRef.current) {
      const currentDistance = getDistance(touchEvent.touches[0], touchEvent.touches[1]);
      const initialDistance = getDistance(initialTouchesRef.current[0], initialTouchesRef.current[1]);
      const scale = currentDistance / initialDistance;
      const center = getCenter(touchEvent.touches[0], touchEvent.touches[1]);
      
      setGestureState(prev => ({ ...prev, pinchScale: scale }));
      onPinch?.(scale, center);
      
      if (enableRotation) {
        const currentAngle = getAngle(touchEvent.touches[0], touchEvent.touches[1]);
        const rotationDelta = currentAngle - lastAngleRef.current;
        
        setGestureState(prev => ({ 
          ...prev, 
          rotationAngle: prev.rotationAngle + rotationDelta,
          isRotating: Math.abs(rotationDelta) > 2
        }));
        
        onRotate?.(rotationDelta, center);
        lastAngleRef.current = currentAngle;
      }
    }
  }, 16), [onPinch, onRotate, onPullToRefresh, enableRotation]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    clearLongPressTimer();
    
    if (gestureState.isPinching) {
      setGestureState(prev => ({ 
        ...prev, 
        isPinching: false, 
        isRotating: false,
        pinchScale: 1,
        rotationAngle: 0
      }));
      initialTouchesRef.current = null;
    } else if (touchStartRef.current && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (enableVelocityTracking && deltaTime > 0) {
        const velocity = distance / deltaTime;
        setGestureState(prev => ({ ...prev, swipeVelocity: velocity }));
        
        if (velocity > velocityThreshold && distance > swipeThreshold) {
          if (enableHaptics) hapticFeedback('LIGHT');
          
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (deltaX > 0) {
              setGestureState(prev => ({ ...prev, isSwipeRight: true }));
              onSwipeRight?.(velocity);
            } else {
              setGestureState(prev => ({ ...prev, isSwipeLeft: true }));
              onSwipeLeft?.(velocity);
            }
          } else {
            // Vertical swipe
            if (deltaY > 0) {
              setGestureState(prev => ({ ...prev, isSwipeDown: true }));
              onSwipeDown?.(velocity);
            } else {
              setGestureState(prev => ({ ...prev, isSwipeUp: true }));
              onSwipeUp?.(velocity);
            }
          }
          
          // Reset swipe states
          setTimeout(() => {
            setGestureState(prev => ({ 
              ...prev, 
              isSwipeLeft: false,
              isSwipeRight: false,
              isSwipeUp: false,
              isSwipeDown: false,
              swipeVelocity: 0
            }));
          }, 300);
        }
      }
      
      // Handle pull to refresh
      if (deltaY > 80 && window.scrollY === 0) {
        onPullToRefresh?.();
      }
    }
    
    setGestureState(prev => ({ ...prev, touchPosition: null }));
    touchStartRef.current = null;
  }, [gestureState.isPinching, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onPullToRefresh, enableHaptics, enableVelocityTracking, velocityThreshold, swipeThreshold]);

  useEffect(() => {
    const element = document.body;
    
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      clearLongPressTimer();
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    gestureState,
    // Helper methods
    resetGestures: () => setGestureState({
      isSwipeLeft: false,
      isSwipeRight: false,
      isSwipeUp: false,
      isSwipeDown: false,
      isLongPress: false,
      isDoubleTap: false,
      isPinching: false,
      isRotating: false,
      swipeVelocity: 0,
      pinchScale: 1,
      rotationAngle: 0,
      longPressProgress: 0,
      touchPosition: null
    })
  };
}