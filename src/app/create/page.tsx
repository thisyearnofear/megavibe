"use client";

// Force dynamic rendering to prevent SSR issues with Wagmi hooks
export const dynamic = 'force-dynamic';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AIImageGenerator from "@/components/filcdn/AIImageGenerator";
import styles from "./page.module.css";

import PerformanceUpload from "@/components/creator/PerformanceUpload";

const ForPerformers = () => (
  <div className={styles.contentSection}>
    <h2 className={styles.sectionTitle}>Performer Tools</h2>
    <p className={styles.sectionDescription}>Tools to help you create, manage, and monetize your performances.</p>
    <div className={styles.toolsGrid}>
      <PerformanceUpload />
      <div className={styles.comingSoonCard}>
        <div className={styles.comingSoonIcon}>📈</div>
        <h3 className={styles.comingSoonTitle}>Audience Analytics</h3>
        <p className={styles.comingSoonDescription}>Get insights into your audience&apos;s engagement and preferences.</p>
      </div>
    </div>
  </div>
);

import MomentCapture from "@/components/creator/MomentCapture";

import MyContributions from "@/components/creator/MyContributions";

const ForAudiences = () => (
  <div className={styles.contentSection}>
    <h2 className={styles.sectionTitle}>Audience Tools</h2>
    <p className={styles.sectionDescription}>Tools to help you engage with performers and the community.</p>
    <div className={styles.toolsGrid}>
      <MomentCapture />
      <MyContributions />
    </div>
  </div>
);

export default function CreatePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("everyone");

  return (
    <main className={styles.main}>
      <section className={styles.heroSection}>
        <div className={styles.container}>
          <h1 className={styles.title}>Creator Studio</h1>
          <p className={styles.description}>
            A collaborative space where performers and audiences connect through
            creative content
          </p>
          <div className={styles.audiencePerformerTabs}>
            <button
              className={`${styles.tabButton} ${
                activeTab === "everyone" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("everyone")}
            >
              For Everyone
            </button>
            <button
              className={`${styles.tabButton} ${
                activeTab === "performers" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("performers")}
            >
              For Performers
            </button>
            <button
              className={`${styles.tabButton} ${
                activeTab === "audiences" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("audiences")}
            >
              For Audiences
            </button>
          </div>
        </div>
      </section>

      {activeTab === "everyone" && (
        <section className={styles.toolsSection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Creative Tools</h2>
            <p className={styles.sectionDescription}>
              Tools for both performers and audiences to collaborate in the
              creative process
            </p>

            <div className={styles.toolsGrid}>
              <div className={styles.toolCard}>
                <div className={styles.toolHeader}>
                  <h3 className={styles.toolTitle}>AI Image Creator</h3>
                  <span className={styles.toolBadge}>Powered by FilCDN</span>
                </div>
                <p className={styles.toolDescription}>
                  <span className={styles.forPerformers}>
                    <strong>For Performers:</strong> Create visuals to communicate
                    your ideas before, during, or after performances.
                  </span>
                  <br />
                  <span className={styles.forAudiences}>
                    <strong>For Audiences:</strong> Respond to bounties visually,
                    create tipping incentives, or capture the essence of
                    performances.
                  </span>
                  <br />
                  <span className={styles.storageInfo}>
                    All images are stored permanently on decentralized FilCDN
                    storage with instant availability across the platform.
                  </span>
                </p>
                <AIImageGenerator />
              </div>

              {/* Additional tools can be added here in the future */}
              <div className={styles.comingSoonCard}>
                <div className={styles.comingSoonIcon}>🎬</div>
                <h3 className={styles.comingSoonTitle}>Video Creator</h3>
                <p className={styles.comingSoonDescription}>
                  <strong>For Performers:</strong> Create performance snippets and
                  promotions.
                  <br />
                  <strong>For Audiences:</strong> Share reactions and remix
                  content.
                  <br />
                  Coming soon!
                </p>
              </div>

              <div className={styles.comingSoonCard}>
                <div className={styles.comingSoonIcon}>🎵</div>
                <h3 className={styles.comingSoonTitle}>Audio Studio</h3>
                <p className={styles.comingSoonDescription}>
                  <strong>For Performers:</strong> Create sound clips and audio
                  experiences.
                  <br />
                  <strong>For Audiences:</strong> Contribute audio responses and
                  remixes.
                  <br />
                  Coming soon!
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === "performers" && <ForPerformers />}
      {activeTab === "audiences" && <ForAudiences />}

      <section className={styles.resourcesSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Resources & Tips</h2>
          <p className={styles.sectionDescription}>
            Learn how performers and audiences can collaborate effectively
          </p>

          <div className={styles.resourcesGrid}>
            <div className={styles.resourceCard}>
              <div className={styles.resourceIcon}>📊</div>
              <h3 className={styles.resourceTitle}>Analytics & Insights</h3>
              <p className={styles.resourceDescription}>
                Track engagement with your content and understand your audience
                better.
              </p>
              <button
                className={styles.resourceButton}
                onClick={() => router.push("/analytics")}
              >
                View Analytics
              </button>
            </div>

            <div className={styles.resourceCard}>
              <div className={styles.resourceIcon}>💰</div>
              <h3 className={styles.resourceTitle}>Monetization Strategies</h3>
              <p className={styles.resourceDescription}>
                Discover how both performers and audiences benefit from tips,
                bounties, and collaborations.
              </p>
              <button
                className={styles.resourceButton}
                onClick={() => router.push("/monetization")}
              >
                Explore Strategies
              </button>
            </div>

            <div className={styles.resourceCard}>
              <div className={styles.resourceIcon}>🔍</div>
              <h3 className={styles.resourceTitle}>Collaboration Hub</h3>
              <p className={styles.resourceDescription}>
                Connect performers with audiences for creative collaborations
                and shared experiences.
              </p>
              <button
                className={styles.resourceButton}
                onClick={() => router.push("/marketplace")}
              >
                Visit Marketplace
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
