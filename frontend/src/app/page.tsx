"use client";

import React from "react";
import Hero from "@/components/hero/Hero";
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
      <div className={styles.container}>
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
      </div>
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
      <div className={styles.container}>
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
      </div>
    </section>
  );
};

// Home page component
export default function Home() {
  return (
    <main className={styles.main}>
      <Hero />
      <FeatureSection />
      <HowItWorksSection />

      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <h2 className={styles.ctaTitle}>Ready to Join The Stage?</h2>
          <p className={styles.ctaDescription}>
            Experience the future of the live performance economy today.
          </p>
          <button className={styles.ctaButton}>Get Started</button>
        </div>
      </section>
    </main>
  );
}
