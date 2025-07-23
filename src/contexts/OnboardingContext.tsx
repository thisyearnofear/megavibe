"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface OnboardingContextType {
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (value: boolean) => void;
  hasSeenCreateTour: boolean;
  setHasSeenCreateTour: (value: boolean) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [hasCompletedOnboarding, setHasCompletedOnboardingState] = useState<boolean>(false);
  const [hasSeenCreateTour, setHasSeenCreateTourState] = useState<boolean>(false);

  useEffect(() => {
    const hasCompleted = localStorage.getItem('hasCompletedOnboarding') === 'true';
    setHasCompletedOnboardingState(hasCompleted);
    const seenCreateTour = localStorage.getItem('hasSeenCreateTour') === 'true';
    setHasSeenCreateTourState(seenCreateTour);
  }, []);

  const setHasCompletedOnboarding = (value: boolean) => {
    localStorage.setItem('hasCompletedOnboarding', String(value));
    setHasCompletedOnboardingState(value);
  };

  const setHasSeenCreateTour = (value: boolean) => {
    localStorage.setItem('hasSeenCreateTour', String(value));
    setHasSeenCreateTourState(value);
  };

  return (
    <OnboardingContext.Provider value={{ hasCompletedOnboarding, setHasCompletedOnboarding, hasSeenCreateTour, setHasSeenCreateTour }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
