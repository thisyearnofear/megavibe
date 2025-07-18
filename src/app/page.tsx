"use client";

import React, { useState } from "react";
import Hero from "@/components/hero/Hero";
import QuickDiscovery from "@/components/mobile/QuickDiscovery";
import QuickTip from "@/components/mobile/QuickTip";
import QuickRequest from "@/components/mobile/QuickRequest";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import Container from "@/components/layout/Container";
import styles from "./page.module.css";

// Feature section component
const FeatureSection = () => {
  const features = [
    {
      title: "Discover Performers",
      description:
        "Explore talented creators and performers from around the world.",
      icon: "🎭",
    },
    {
      title: "Engage with Content",
      description: "Interact with unique performances and digital creations.",
      icon: "🎬",
    },
    {
      title: "Seamless Tipping",
      description:
        "Support creators directly with our frictionless tipping system.",
      icon: "💸",
    },
    {
      title: "Create Bounties",
      description: "Commission custom content from your favorite performers.",
      icon: "🎯",
    },
  ];

  return (
    <section className={styles.featureSection}>
      <Container>
        <h2 className={styles.sectionTitle}>Features</h2>
        <p className={styles.sectionDescription}>
          MegaVibe brings you a complete ecosystem for the live performance
          economy
        </p>

        <div className={styles.featureGrid}>
          {features.map((feature, index) => (
            <div key={index} className={styles.featureCard}>
              <div className={styles.featureIcon}>{feature.icon}</div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

// How it works section component
const HowItWorksSection = () => {
  const steps = [
    {
      number: "01",
      title: "Connect Wallet",
      description: "Link your wallet to access all MegaVibe features securely.",
    },
    {
      number: "02",
      title: "Explore The Stage",
      description:
        "Browse performers, content, and live events in our ecosystem.",
    },
    {
      number: "03",
      title: "Engage & Support",
      description:
        "Interact with creators through tips, bounties, and feedback.",
    },
    {
      number: "04",
      title: "Join the Community",
      description: "Become part of the decentralized performance economy.",
    },
  ];

  return (
    <section className={styles.howItWorksSection}>
      <Container>
        <h2 className={styles.sectionTitle}>How It Works</h2>
        <p className={styles.sectionDescription}>
          Get started with MegaVibe in four simple steps
        </p>

        <div className={styles.stepsContainer}>
          {steps.map((step, index) => (
            <div key={index} className={styles.step}>
              <div className={styles.stepNumber}>{step.number}</div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDescription}>{step.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

// Home page component
import { PerformerProfile } from "@/services/api/performerService";

interface Performer extends PerformerProfile {
  distance?: string;
  distanceKm?: number;
}

export default function Home() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [selectedPerformer, setSelectedPerformer] = useState<Performer | null>(
    null
  );
  const [showTipModal, setShowTipModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const handleQuickTip = (performer: Performer) => {
    setSelectedPerformer(performer);
    setShowTipModal(true);
  };

  const handleQuickRequest = (performer: Performer) => {
    setSelectedPerformer(performer);
    setShowRequestModal(true);
  };

  const handleTipComplete = () => {
    setShowTipModal(false);
    setSelectedPerformer(null);
    // Show success feedback
    console.log("Tip completed successfully!");
  };

  const handleRequestComplete = () => {
    setShowRequestModal(false);
    setSelectedPerformer(null);
    // Show success feedback
    console.log("Request created successfully!");
  };

  // Mobile-first IRL engagement experience
  if (isMobile) {
    return (
      <main className={styles.mobileMain}>
        <QuickDiscovery
          onQuickTip={handleQuickTip}
          onQuickRequest={handleQuickRequest}
        />

        {/* Quick Action Modals */}
        {selectedPerformer && (
          <>
            <QuickTip
              performer={selectedPerformer}
              isOpen={showTipModal}
              onClose={() => setShowTipModal(false)}
              onComplete={handleTipComplete}
            />

            <QuickRequest
              performer={selectedPerformer}
              isOpen={showRequestModal}
              onClose={() => setShowRequestModal(false)}
              onComplete={handleRequestComplete}
            />
          </>
        )}
      </main>
    );
  }

  // Desktop experience remains unchanged
  return (
    <main className={styles.main}>
      <Hero />
      <FeatureSection />
      <HowItWorksSection />

      <section className={styles.ctaSection}>
        <Container>
          <h2 className={styles.ctaTitle}>Ready to Join The Stage?</h2>
          <p className={styles.ctaDescription}>
            Experience the future of the live performance economy today.
          </p>
          <button className={styles.ctaButton}>Get Started</button>
        </Container>
      </section>
    </main>
  );
}

// Minor change to trigger type re-evaluation
