import { useEffect, useRef, useState, useCallback } from 'react';

interface GestureState {
  isSwipeLeft: boolean;
  isSwipeRight: boolean;
  isPullToRefresh: boolean;
  isPinching: boolean;
  pinchScale: number;
}

interface UseGestureControlsOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onPullToRefresh?: () => void;
  onPinchStart?: () => void;
  onPinchEnd?: (scale: number) => void;
  swipeThreshold?: number;
  pullThreshold?: number;
}

export function useGestureControls(options: UseGestureControlsOptions = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onPullToRefresh,
    onPinchStart,
    onPinchEnd,
    swipeThreshold = 100,
    pullThreshold = 80
  } = options;

  const [gestureState, setGestureState] = useState<GestureState>({
    isSwipeLeft: false,
    isSwipeRight: false,
    isPullToRefresh: false,
    isPinching: false,
    pinchScale: 1
  });

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchesRef = useRef<TouchList | null>(null);
  const initialPinchDistanceRef = useRef<number>(0);

  const getDistance = (touch1: Touch, touch2: Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - track for swipe
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
    } else if (e.touches.length === 2) {
      // Two touches - track for pinch
      touchesRef.current = e.touches;
      initialPinchDistanceRef.current = getDistance(e.touches[0], e.touches[1]);
      setGestureState(prev => ({ ...prev, isPinching: true }));
      onPinchStart?.();
    }
  }, [onPinchStart]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && touchesRef.current && initialPinchDistanceRef.current > 0) {
      // Handle pinch gesture
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialPinchDistanceRef.current;
      
      setGestureState(prev => ({ ...prev, pinchScale: scale }));
    } else if (e.touches.length === 1 && touchStartRef.current) {
      // Handle pull to refresh
      const touch = e.touches[0];
      const deltaY = touch.clientY - touchStartRef.current.y;
      
      if (deltaY > pullThreshold && window.scrollY === 0) {
        setGestureState(prev => ({ ...prev, isPullToRefresh: true }));
      }
    }
  }, [pullThreshold]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (gestureState.isPinching) {
      // End pinch gesture
      setGestureState(prev => ({ 
        ...prev, 
        isPinching: false, 
        pinchScale: 1 
      }));
      onPinchEnd?.(gestureState.pinchScale);
      initialPinchDistanceRef.current = 0;
      touchesRef.current = null;
    } else if (touchStartRef.current && e.changedTouches.length === 1) {
      // Handle swipe gesture
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;
      
      // Check if it's a swipe (fast horizontal movement)
      if (Math.abs(deltaX) > swipeThreshold && Math.abs(deltaX) > Math.abs(deltaY) && deltaTime < 300) {
        if (deltaX > 0) {
          // Swipe right
          setGestureState(prev => ({ ...prev, isSwipeRight: true }));
          onSwipeRight?.();
          navigator.vibrate?.(50);
        } else {
          // Swipe left
          setGestureState(prev => ({ ...prev, isSwipeLeft: true }));
          onSwipeLeft?.();
          navigator.vibrate?.(50);
        }
        
        // Reset swipe state after animation
        setTimeout(() => {
          setGestureState(prev => ({ 
            ...prev, 
            isSwipeLeft: false, 
            isSwipeRight: false 
          }));
        }, 300);
      }
      
      // Handle pull to refresh
      if (gestureState.isPullToRefresh) {
        onPullToRefresh?.();
        setGestureState(prev => ({ ...prev, isPullToRefresh: false }));
      }
    }
    
    touchStartRef.current = null;
  }, [gestureState.isPinching, gestureState.isPullToRefresh, onSwipeLeft, onSwipeRight, onPullToRefresh, onPinchEnd, swipeThreshold]);

  useEffect(() => {
    const element = document.body;
    
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    gestureState,
    // Helper functions for components
    getSwipeProps: () => ({
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    }),
  };
}