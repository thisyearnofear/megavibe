"use client";

import React from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import styles from './OnboardingGuide.module.css';

const OnboardingGuide = () => {
  const { hasCompletedOnboarding, setHasCompletedOnboarding } = useOnboarding();

  if (hasCompletedOnboarding) {
    return null;
  }

  const handleComplete = () => {
    setHasCompletedOnboarding(true);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Welcome to MegaVibe!</h2>
        <p className={styles.description}>
          Discover talented performers, support them with tips, and request custom content through bounties.
        </p>
        <div className={styles.features}>
          <div className={styles.feature}>
            <span className={styles.icon}>🎭</span>
            <h3 className={styles.featureTitle}>Discover</h3>
            <p>Find amazing performers near you.</p>
          </div>
          <div className={styles.feature}>
            <span className={styles.icon}>💸</span>
            <h3 className={styles.featureTitle}>Tip</h3>
            <p>Show your appreciation with seamless tipping.</p>
          </div>
          <div className={styles.feature}>
            <span className={styles.icon}>🎯</span>
            <h3 className={styles.featureTitle}>Bounties</h3>
            <p>Request personalized content from your favorite artists.</p>
          </div>
        </div>
        <button className={styles.button} onClick={handleComplete}>
          Get Started
        </button>
      </div>
    </div>
  );
};

export default OnboardingGuide;
