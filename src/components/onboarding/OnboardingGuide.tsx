"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from '@/contexts/OnboardingContext';
import Button from '@/components/shared/Button';
import styles from './OnboardingGuide.module.css';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  action?: string;
  tip?: string;
}

const OnboardingGuide = () => {
  const { hasCompletedOnboarding, setHasCompletedOnboarding } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to MegaVibe! 🎉',
      description: 'The ultimate platform for live performance economy. Let\'s get you started on this amazing journey!',
      icon: '🌟',
      action: 'Let\'s explore!',
      tip: 'Tip: You can always access help from the menu'
    },
    {
      id: 'discover',
      title: 'Discover Amazing Performers 🎭',
      description: 'Find talented creators and performers from around the world. Use location services to discover artists near you!',
      icon: '🔍',
      action: 'Show me how',
      tip: 'Pro tip: Enable location for personalized recommendations'
    },
    {
      id: 'tip',
      title: 'Support with Tips 💰',
      description: 'Show your appreciation with seamless crypto tipping. Every tip makes a performer\'s day brighter!',
      icon: '✨',
      action: 'Learn tipping',
      tip: 'Fun fact: Tips are instant and go directly to performers'
    },
    {
      id: 'bounties',
      title: 'Create Bounties 🎯',
      description: 'Commission custom content from your favorite artists. Set your price and watch magic happen!',
      icon: '🎨',
      action: 'Try bounties',
      tip: 'Creative tip: Be specific in your bounty descriptions'
    },
    {
      id: 'community',
      title: 'Join the Community 🤝',
      description: 'You\'re now part of a vibrant ecosystem of creators and supporters. Let\'s make some magic together!',
      icon: '🎪',
      action: 'Start exploring!',
      tip: 'Remember: Every interaction builds the creative economy'
    }
  ];

  useEffect(() => {
    if (!hasCompletedOnboarding) {
      setIsVisible(true);
      // Haptic feedback for mobile
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    }
  }, [hasCompletedOnboarding]);

  if (hasCompletedOnboarding || !isVisible) {
    return null;
  }

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      setHasCompletedOnboarding(true);
      setIsVisible(false);
    } else {
      setCurrentStep(prev => prev + 1);
    }
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    setHasCompletedOnboarding(true);
    setIsVisible(false);
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  const modalVariants = {
    hidden: { 
      scale: 0.8, 
      opacity: 0,
      y: 50
    },
    visible: { 
      scale: 1, 
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    },
    exit: { 
      scale: 0.8, 
      opacity: 0,
      y: 50,
      transition: { duration: 0.2 }
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.3, delay: 0.1 }
    },
    exit: { 
      opacity: 0, 
      x: -20,
      transition: { duration: 0.2 }
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        className={styles.overlay}
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <motion.div 
          className={styles.modal}
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Progress indicator */}
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <motion.div
                className={styles.progressFill}
                initial={{ width: "0%" }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className={styles.progressText}>
              {currentStep + 1} of {steps.length}
            </span>
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={styles.stepContent}
            >
              <motion.div 
                className={styles.iconContainer}
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
              >
                <span className={styles.stepIcon}>{currentStepData.icon}</span>
              </motion.div>
              
              <h2 className={styles.title}>{currentStepData.title}</h2>
              <p className={styles.description}>{currentStepData.description}</p>
              
              {currentStepData.tip && (
                <div className={styles.tip}>
                  <span className={styles.tipIcon}>💡</span>
                  <span className={styles.tipText}>{currentStepData.tip}</span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className={styles.navigation}>
            <div className={styles.leftActions}>
              {currentStep > 0 && (
                <button 
                  className={styles.secondaryButton}
                  onClick={handlePrevious}
                >
                  ← Back
                </button>
              )}
            </div>

            <div className={styles.rightActions}>
              <button 
                className={styles.skipButton}
                onClick={handleSkip}
              >
                Skip
              </button>
              
              <Button
                onClick={handleNext}
                variant="primary"
              >
                {isLastStep ? '🚀 Start Exploring!' : currentStepData.action || 'Next →'}
              </Button>
            </div>
          </div>

          {/* Step indicators */}
          <div className={styles.stepIndicators}>
            {steps.map((_, index) => (
              <motion.div
                key={index}
                className={`${styles.stepDot} ${index === currentStep ? styles.active : ''}`}
                animate={{
                  scale: index === currentStep ? 1.2 : 1,
                  opacity: index === currentStep ? 1 : 0.5
                }}
                transition={{ duration: 0.2 }}
                onClick={() => setCurrentStep(index)}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingGuide;
