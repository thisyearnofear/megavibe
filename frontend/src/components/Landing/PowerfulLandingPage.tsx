import React, { useState, useEffect } from 'react';
import { useEvent } from '../../contexts/EventContext';
import { useWallet } from '../../contexts/WalletContext';
import { mockDataService, LIVE_EARNINGS_DATA, SUCCESS_STORIES, generateMockActivity } from '../../services/mockDataService';
import './PowerfulLandingPage.css';

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
    <div className="powerful-landing">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="floating-money">💰</div>
          <div className="floating-money">🎯</div>
          <div className="floating-money">📈</div>
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <span className="live-dot"></span>
            <span>LIVE NOW: ${totalPlatformValue.toLocaleString()} Knowledge Economy</span>
          </div>

          <h1 className="hero-title">
            {featureType === 'connection' && (
              <>The Knowledge Economy <span className="hero-gradient">Flywheel</span></>
            )}
            {featureType === 'tokenization' && (
              <>Turn Tips Into <span className="hero-gradient">Content Bounties</span></>
            )}
            {featureType === 'influence' && (
              <>Watch Speakers Earn <span className="hero-gradient">Live</span></>
            )}
            {featureType === 'reputation' && (
              <>Real Success <span className="hero-gradient">Stories</span></>
            )}
          </h1>

          <p className="hero-subtitle">
            {featureType === 'connection' && (
              <>Watch how <strong>one great talk</strong> becomes a <strong>content empire</strong>.<br />The flywheel that turns knowledge into sustainable income.</>
            )}
            {featureType === 'tokenization' && (
              <>Speakers earn tips, then use them to <strong>commission content</strong>.<br />$25-500 bounties delivered in 24-48 hours.</>
            )}
            {featureType === 'influence' && (
              <>See <strong>real earnings</strong> from conferences happening right now.<br />Tips converting to bounties, content being created.</>
            )}
            {featureType === 'reputation' && (
              <>Real people building <strong>real businesses</strong> with knowledge.<br />From conference speakers to content empires.</>
            )}
          </p>

          {/* Live Earnings Ticker */}
          <div className="live-earnings-ticker">
            <div className="ticker-content">
              <div className="earnings-item">
                <span className="speaker-name">{currentEarning.speaker}</span>
                <span className="topic">"{currentEarning.topic}"</span>
                <span className="amount">${currentEarning.earned.toLocaleString()}</span>
                <span className="time">{currentEarning.timeAgo}</span>
              </div>
              <div className="bounty-follow-up">
                → Created ${currentEarning.bountyCreated.toLocaleString()} in bounties for {currentEarning.contentType}
              </div>
            </div>
          </div>

          {/* Hero CTAs */}
          <div className="hero-actions">
            <button
              className="cta-primary"
              onClick={onGetStarted}
            >
              Join the ${Math.floor(totalPlatformValue/1000)}K+ Knowledge Economy
            </button>
            <button
              className="cta-secondary"
              onClick={onExploreEvents}
            >
              <span className="live-indicator">🔴</span>
              See Live Earnings
            </button>
          </div>

          {/* Live Stats Bar */}
          <div className="live-stats-bar">
            <div className="stat-item">
              <span className="stat-value">{liveStats.activeSpeakers}</span>
              <span className="stat-label">Speakers Earning Now</span>
            </div>
            <div className="stat-item pulse">
              <span className="stat-value">{liveStats.liveTips}</span>
              <span className="stat-label">Tips This Minute</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{liveStats.pendingBounties}</span>
              <span className="stat-label">Active Bounties</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">${liveStats.totalEarned.toLocaleString()}</span>
              <span className="stat-label">Earned Today</span>
            </div>
          </div>
        </div>
      </section>

      {/* Context-based Section */}
      <section className="problem-section">
        <div className="container">
          <h2 className="section-title">
            {featureType === 'connection' && 'How The Flywheel Works'}
            {featureType === 'tokenization' && 'The Bounty System'}
            {featureType === 'influence' && 'Live Earnings Dashboard'}
            {featureType === 'reputation' && 'Success Stories'}
          </h2>
          <div className="problems-grid">
            <div className="problem-item">
              <span className="problem-icon">😤</span>
              <h3>Great speakers earn nothing</h3>
              <p>Beyond their speaking fee, amazing insights generate zero additional revenue</p>
            </div>
            <div className="problem-item">
              <span className="problem-icon">❓</span>
              <h3>Audiences can't get answers</h3>
              <p>Specific questions go unanswered. No way to commission personalized content</p>
            </div>
            <div className="problem-item">
              <span className="problem-icon">💨</span>
              <h3>Content disappears forever</h3>
              <p>Incredible insights vanish after 30 minutes. No lasting value creation</p>
            </div>
            <div className="problem-item">
              <span className="problem-icon">🚫</span>
              <h3>No appreciation mechanism</h3>
              <p>Applause doesn't pay rent. No way to show real value for knowledge</p>
            </div>
          </div>

          <div className="solution-intro">
            <h3>MegaVibe fixes this with the <span className="highlight">Knowledge Economy Flywheel</span></h3>
          </div>
        </div>
      </section>

      {/* Main Feature Section */}
      {/* Main Feature Section */}
      <section className="flywheel-section">
        <div className="container">
          <h2 className="section-title">
            {featureType === 'connection' && 'The Knowledge Economy Flywheel'}
            {featureType === 'tokenization' && 'Live Bounty Marketplace'}
            {featureType === 'influence' && 'Real-Time Earnings'}
            {featureType === 'reputation' && 'Knowledge Creators Winning Big'}
          </h2>
          <p className="section-subtitle">
            {featureType === 'connection' && 'Watch how one great talk becomes a content empire'}
            {featureType === 'tokenization' && 'Active bounties waiting for creators'}
            {featureType === 'influence' && 'Live earnings from conferences happening now'}
            {featureType === 'reputation' && 'Real results from the knowledge economy'}
          </p>

          {featureType === 'connection' && (
            <>
              <div className="flywheel-container">
                <div className="flywheel-center">
                  <div className="flywheel-icon">⚡</div>
                  <div className="flywheel-text">Knowledge<br/>Economy</div>
                </div>

                <div className="flywheel-steps">
                  {FLYWHEEL_STEPS.map((step, index) => (
                    <div
                      key={step.step}
                      className={`flywheel-step step-${step.step}`}
                      style={{ '--delay': `${index * 0.2}s` } as React.CSSProperties}
                    >
                      <div className="step-number">{step.step}</div>
                      <div className="step-icon">{step.icon}</div>
                      <h4 className="step-title">{step.title}</h4>
                      <p className="step-description">{step.description}</p>
                      <div className="step-outcome">{step.outcome}</div>
                      <div className="step-example">{step.example}</div>
                      {step.step < 4 && <div className="step-arrow">→</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Vitalik Example */}
              <div className="flywheel-example">
                <h3>Real Example: The Vitalik Effect</h3>
                <div className="example-flow">
                  <div className="flow-step">
                    <span className="step-icon">🎤</span>
                    <div className="step-content">
                      <strong>Vitalik speaks about Ethereum roadmap</strong>
                      <span>Earns $3,200 in live tips during 45-min talk</span>
                    </div>
                  </div>
                  <div className="flow-arrow">→</div>
                  <div className="flow-step">
                    <span className="step-icon">🎯</span>
                    <div className="step-content">
                      <strong>Creates $2,800 in bounties</strong>
                      <span>"Create 5-min explainer videos for each roadmap item"</span>
                    </div>
                  </div>
                  <div className="flow-arrow">→</div>
                  <div className="flow-step">
                    <span className="step-icon">🤖</span>
                    <div className="step-content">
                      <strong>AI-powered content creation</strong>
                      <span>12 creators submit video explainers using AI tools</span>
                    </div>
                  </div>
                  <div className="flow-arrow">→</div>
                  <div className="flow-step">
                    <span className="step-icon">📈</span>
                    <div className="step-content">
                      <strong>Viral distribution</strong>
                      <span>Content reaches 2.3M developers across all platforms</span>
                    </div>
                  </div>
                </div>
                <div className="example-outcome">
                  <strong>Result:</strong> Vitalik's 45-minute talk becomes 50+ pieces of content,
                  reaching millions, inspiring 23 more Ethereum talks, creating a $50K+ content economy.
                </div>
              </div>
            </>
          )}

          {featureType === 'tokenization' && (
            <div className="bounty-marketplace">
              <div className="active-bounties">
                <h3>🔴 Active Bounties Right Now</h3>
                <div className="bounty-grid">
                  <div className="bounty-card">
                    <div className="bounty-header">
                      <span className="bounty-amount">$500</span>
                      <span className="bounty-deadline">2 days left</span>
                    </div>
                    <h4>Create 5-min Ethereum roadmap explainers</h4>
                    <p>Break down each roadmap milestone into digestible video content</p>
                    <div className="bounty-sponsor">by @VitalikButerin</div>
                    <div className="bounty-stats">
                      <span>3 submissions</span>
                      <span>Video format</span>
                    </div>
                  </div>
                  <div className="bounty-card">
                    <div className="bounty-header">
                      <span className="bounty-amount">$300</span>
                      <span className="bounty-deadline">1 day left</span>
                    </div>
                    <h4>DeFi for beginners tutorial series</h4>
                    <p>Step-by-step guide for newcomers to decentralized finance</p>
                    <div className="bounty-sponsor">by @AndrewCrypto</div>
                    <div className="bounty-stats">
                      <span>7 submissions</span>
                      <span>Written + Video</span>
                    </div>
                  </div>
                  <div className="bounty-card">
                    <div className="bounty-header">
                      <span className="bounty-amount">$750</span>
                      <span className="bounty-deadline">3 days left</span>
                    </div>
                    <h4>Zero Knowledge Proofs explained</h4>
                    <p>Technical deep-dive with practical examples and use cases</p>
                    <div className="bounty-sponsor">by @AnatuDAO</div>
                    <div className="bounty-stats">
                      <span>2 submissions</span>
                      <span>Technical blog</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bounty-stats-section">
                <h3>💰 Bounty Economics</h3>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-number">$47K</div>
                    <div className="stat-label">Total Bounties This Month</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">24hrs</div>
                    <div className="stat-label">Average Delivery Time</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">89%</div>
                    <div className="stat-label">Completion Rate</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {featureType === 'influence' && (
            <div className="live-earnings-dashboard">
              <h3>🔴 Live Earnings Dashboard</h3>
              <div className="earnings-grid">
                <div className="earnings-card live">
                  <div className="speaker-info">
                    <div className="speaker-avatar">V</div>
                    <div className="speaker-details">
                      <h4>Vitalik Buterin</h4>
                      <p>Ethereum Roadmap 2024</p>
                    </div>
                  </div>
                  <div className="earnings-amount">$3,247</div>
                  <div className="earnings-status">🔴 Speaking now</div>
                  <div className="earnings-actions">
                    <span>→ Created $2,800 in bounties</span>
                  </div>
                </div>
                <div className="earnings-card">
                  <div className="speaker-info">
                    <div className="speaker-avatar">H</div>
                    <div className="speaker-details">
                      <h4>Hayden Adams</h4>
                      <p>Uniswap v4 Deep Dive</p>
                    </div>
                  </div>
                  <div className="earnings-amount">$1,892</div>
                  <div className="earnings-status">✅ Completed 2h ago</div>
                  <div className="earnings-actions">
                    <span>→ Created $1,500 in bounties</span>
                  </div>
                </div>
                <div className="earnings-card">
                  <div className="speaker-info">
                    <div className="speaker-avatar">A</div>
                    <div className="speaker-details">
                      <h4>Anatu Florczyk</h4>
                      <p>ZK Proofs Explained</p>
                    </div>
                  </div>
                  <div className="earnings-amount">$1,650</div>
                  <div className="earnings-status">⏰ Starting in 30min</div>
                  <div className="earnings-actions">
                    <span>Pre-tip: $340 already</span>
                  </div>
                </div>
              </div>
              <div className="realtime-stats">
                <h4>⚡ Real-Time Activity</h4>
                <div className="activity-items">
                  <div className="activity-item">
                    <span className="activity-time">2m ago</span>
                    <span className="activity-text">$50 tip → Vitalik for "Great L2 explanation"</span>
                  </div>
                  <div className="activity-item">
                    <span className="activity-time">5m ago</span>
                    <span className="activity-text">$200 bounty created → "Explain Uniswap hooks"</span>
                  </div>
                  <div className="activity-item">
                    <span className="activity-time">8m ago</span>
                    <span className="activity-text">Bounty completed → $300 earned for ZK tutorial</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {featureType === 'reputation' && (
            <div className="success-stories-detailed">
              <div className="story-spotlight">
                <h3>🌟 Featured Success Story</h3>
                <div className="featured-story">
                  <div className="story-avatar">
                    <img src="/api/placeholder/80/80" alt="Andrew Miller" />
                  </div>
                  <div className="story-content">
                    <h4>Andrew Miller - From Speaker to Content Empire</h4>
                    <p className="story-subtitle">Built a $50K knowledge business in 6 months</p>
                    <div className="story-timeline">
                      <div className="timeline-item">
                        <span className="timeline-date">Month 1</span>
                        <span className="timeline-event">First conference talk → $200 in tips</span>
                      </div>
                      <div className="timeline-item">
                        <span className="timeline-date">Month 2</span>
                        <span className="timeline-event">Created first bounty → $500 content commission</span>
                      </div>
                      <div className="timeline-item">
                        <span className="timeline-date">Month 4</span>
                        <span className="timeline-event">Regular speaking + bounties → $5K/month</span>
                      </div>
                      <div className="timeline-item">
                        <span className="timeline-date">Month 6</span>
                        <span className="timeline-event">Content empire → $8K+/month recurring</span>
                      </div>
                    </div>
                    <div className="story-quote">
                      "MegaVibe turned my conference talks into a sustainable business.
                      Now I earn more from my knowledge than my day job."
                    </div>
                  </div>
                </div>
              </div>
              <div className="success-metrics">
                <h4>🏆 Success Metrics</h4>
                <div className="metrics-grid">
                  <div className="metric-item">
                    <div className="metric-number">$127K+</div>
                    <div className="metric-label">Total Creator Earnings</div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-number">342</div>
                    <div className="metric-label">Active Knowledge Workers</div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-number">89%</div>
                    <div className="metric-label">Report Increased Income</div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-number">156</div>
                    <div className="metric-label">Full-Time Transitions</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Success Stories */}
      <section className="success-stories-section">
        <div className="container">
          <h2 className="section-title">Knowledge Creators Winning Big</h2>
          <div className="stories-grid">
            {SUCCESS_STORIES.map((story, index) => (
              <div key={index} className="story-card">
                <div className="story-header">
                  <span className="speaker-handle">{story.speaker}</span>
                  <span className="achievement">{story.achievement}</span>
                </div>
                <p className="story-detail">{story.detail}</p>
                <div className="story-impact">
                  <span className="impact-icon">🚀</span>
                  <span>{story.impact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works-section">
        <div className="container">
          <h2 className="section-title">Three Ways To Win</h2>
          <div className="ways-grid">
            <div className="way-card speaker-way">
              <div className="way-icon">🎤</div>
              <h3>For Speakers</h3>
              <div className="way-outcome">Earn $500-3000 per talk</div>
              <ul className="way-features">
                <li>Get tipped during presentations</li>
                <li>Commission custom content creation</li>
                <li>Build sustainable knowledge business</li>
                <li>Turn insights into recurring revenue</li>
              </ul>
              <div className="way-cta">
                <button className="way-button speaker-button">Start Earning</button>
              </div>
            </div>

            <div className="way-card audience-way">
              <div className="way-icon">💡</div>
              <h3>For Audiences</h3>
              <div className="way-outcome">Get exclusive content on-demand</div>
              <ul className="way-features">
                <li>Tip speakers for amazing insights</li>
                <li>Request specific content via bounties</li>
                <li>Get personalized explanations</li>
                <li>Access expert knowledge anytime</li>
              </ul>
              <div className="way-cta">
                <button className="way-button audience-button">Get Content</button>
              </div>
            </div>

            <div className="way-card creator-way">
              <div className="way-icon">🎨</div>
              <h3>For Creators</h3>
              <div className="way-outcome">Earn from bounty completions</div>
              <ul className="way-features">
                <li>Complete content bounties</li>
                <li>Use AI tools for video/content</li>
                <li>Build reputation in niches</li>
                <li>Scale with automation</li>
              </ul>
              <div className="way-cta">
                <button className="way-button creator-button">Claim Bounties</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="social-proof-section">
        <div className="container">
          <h2 className="section-title">Join 500+ Knowledge Creators</h2>
          <div className="proof-stats">
            <div className="proof-stat">
              <span className="proof-number">$127K+</span>
              <span className="proof-label">Total Earned</span>
            </div>
            <div className="proof-stat">
              <span className="proof-number">2,847</span>
              <span className="proof-label">Tips Sent</span>
            </div>
            <div className="proof-stat">
              <span className="proof-number">1,204</span>
              <span className="proof-label">Bounties Created</span>
            </div>
            <div className="proof-stat">
              <span className="proof-number">856</span>
              <span className="proof-label">Content Pieces</span>
            </div>
          </div>

          <div className="live-activity">
            <h3>🔴 Live Activity</h3>
            <div className="activity-feed">
              {[...Array(3)].map((_, index) => {
                const activity = generateMockActivity();
                return (
                  <div key={index} className="activity-item">
                    <span className="activity-user">{activity.user}</span>
                    <span className="activity-action">{activity.action} {activity.amount}</span>
                    <span className="activity-detail">{activity.detail}</span>
                    <span className="activity-time">{activity.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Turn Knowledge Into Revenue?</h2>
            <p>Join the fastest growing knowledge economy in crypto</p>

            <div className="cta-actions">
              <button
                className="cta-primary large"
                onClick={onGetStarted}
              >
                {featureType === 'connection' && (isConnected ? 'Join The Flywheel' : 'Connect Wallet & Start')}
                {featureType === 'tokenization' && 'Browse Active Bounties'}
                {featureType === 'influence' && 'See Live Earnings'}
                {featureType === 'reputation' && 'Start Your Journey'}
              </button>
              <button
                className="cta-secondary large"
                onClick={onExploreEvents}
              >
                {featureType === 'connection' && 'Explore Live Events'}
                {featureType === 'tokenization' && 'Create Your Bounty'}
                {featureType === 'influence' && 'View All Speakers'}
                {featureType === 'reputation' && 'Read Full Stories'}
              </button>
            </div>

            <div className="cta-guarantee">
              <span className="guarantee-icon">⚡</span>
              <span>Join 47 speakers earning live right now</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PowerfulLandingPage;
