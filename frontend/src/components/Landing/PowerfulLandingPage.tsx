import React, { useState, useEffect } from 'react';
import { useEvent } from '../../contexts/EventContext';
import { useWallet } from '../../contexts/WalletContext';
import { mockDataService, LIVE_EARNINGS_DATA, SUCCESS_STORIES, generateMockActivity } from '../../services/mockDataService';
import './PowerfulLandingPage.css';
import '../../styles/design-system.css';

import { PageLayout } from '../Layout/PageLayout';
import { Button } from '../UI/Button';
import { Card } from '../UI/Card';

interface PowerfulLandingPageProps {
  onGetStarted: () => void;
  onExploreEvents: () => void;
  featureType?: 'connection' | 'bounty' | 'tokenization' | 'influence' | 'reputation' | 'demo';
}

const FLYWHEEL_STEPS = [
  {
    step: 1,
    icon: "🎤",
    title: "Speak & Earn",
    description: "Share insights at events",
    outcome: "$500-3000 per talk",
    example: "Vitalik explains Ethereum roadmap → $3,200 in tips"
  },
  {
    step: 2,
    icon: "🎯",
    title: "Commission Content",
    description: "Turn tips into bounties",
    outcome: "10x content creation",
    example: "Creates $2,800 in bounties for video clips & tutorials"
  },
  {
    step: 3,
    icon: "📈",
    title: "Amplify Reach",
    description: "Content spreads your ideas",
    outcome: "Viral distribution",
    example: "AI-generated clips reach 100K+ developers"
  },
  {
    step: 4,
    icon: "🔄",
    title: "Inspire Others",
    description: "More speakers join the topic",
    outcome: "Knowledge economy grows",
    example: "Others speak about Ethereum → Cycle repeats"
  }
];

export const PowerfulLandingPage: React.FC<PowerfulLandingPageProps> = ({
  onGetStarted,
  onExploreEvents,
  featureType = 'connection'
}) => {
  const [currentEarningIndex, setCurrentEarningIndex] = useState(0);
  const [totalPlatformValue, setTotalPlatformValue] = useState(127845);
  const [liveStats, setLiveStats] = useState({
    activeSpeakers: 47,
    liveTips: 12,
    pendingBounties: 28,
    totalEarned: 89420
  });

  const { isConnected } = useWallet();
  const { liveStats: eventStats } = useEvent();

  // Simulate live earnings counter
  useEffect(() => {
    const interval = setInterval(() => {
      setTotalPlatformValue(prev => prev + Math.floor(Math.random() * 50) + 25);
      setLiveStats(prev => ({
        ...prev,
        liveTips: prev.liveTips + (Math.random() > 0.7 ? 1 : 0),
        totalEarned: prev.totalEarned + Math.floor(Math.random() * 100) + 50
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Rotate earnings examples
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentEarningIndex((prev) => (prev + 1) % LIVE_EARNINGS_DATA.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const currentEarning = LIVE_EARNINGS_DATA[currentEarningIndex];

  return (
    <PageLayout
      title="Welcome to MegaVibe"
      subtitle="The platform for live tipping, bounties, and knowledge sharing."
      
    >
      <div className="welcome-features grid grid-cols-1 grid-cols-2-sm grid-cols-3-md">
        {FLYWHEEL_STEPS.map(step => (
          <Card key={step.step} hoverable className="feature-card">
            <div className="feature-icon-wrapper" style={{ fontSize: '2.5rem', marginBottom: 'var(--space-4)' }}>{step.icon}</div>
            <h3 className="heading-2">{step.title}</h3>
            <p className="heading-3">{step.description}</p>
            <div style={{ color: 'var(--success)' }}>{step.outcome}</div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-600)', marginTop: 'var(--space-2)' }}>{step.example}</div>
          </Card>
        ))}
      </div>
      <div style={{ marginTop: 'var(--space-8)', textAlign: 'center' }}>
        <Button variant="primary" size="lg" onClick={onGetStarted} style={{ marginRight: 'var(--space-4)' }}>
          Get Started
        </Button>
        <Button variant="outline" size="lg" onClick={onExploreEvents}>
          Explore Events
        </Button>
      </div>
    </PageLayout>
  );
};

export default PowerfulLandingPage;
