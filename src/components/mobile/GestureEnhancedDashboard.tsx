'use client';

import React, { useState, useEffect } from 'react';
import { useAdvancedGestures } from '@/hooks/useAdvancedGestures';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { unifiedAppService } from '@/services/unified/UnifiedAppService';
import SwipeablePerformerCard from './SwipeablePerformerCard';
import GestureEnhancedCard from './GestureEnhancedCard';
import { hapticFeedback } from '@/utils/mobile';
import styles from './GestureEnhancedDashboard.module.css';

interface DashboardSection {
  id: string;
  title: string;
  icon: string;
  component: React.ReactNode;
}

export default function GestureEnhancedDashboard() {
  const { walletInfo } = useWalletConnection();
  const walletAddress = walletInfo.address;
  const isConnected = walletInfo.isConnected;
  const [currentSection, setCurrentSection] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<unknown>(null);

  const { gestureState } = useAdvancedGestures({
    onSwipeLeft: () => {
      // Navigate to next section
      setCurrentSection(prev => (prev + 1) % sections.length);
      hapticFeedback('LIGHT');
    },
    onSwipeRight: () => {
      // Navigate to previous section
      setCurrentSection(prev => (prev - 1 + sections.length) % sections.length);
      hapticFeedback('LIGHT');
    },
    onSwipeDown: () => {
      // Pull to refresh
      handleRefresh();
    },
    onDoubleTap: () => {
      // Quick action based on current section
      handleQuickAction();
    },
    enableHaptics: true,
    enableVelocityTracking: true
  });

  const handleRefresh = async () => {
    if (!walletAddress || isRefreshing) return;
    
    setIsRefreshing(true);
    hapticFeedback('MEDIUM');
    
    try {
      const data = await unifiedAppService.getDashboardData(walletAddress);
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const handleQuickAction = () => {
    const section = sections[currentSection];
    hapticFeedback('HEAVY');
    
    switch (section.id) {
      case 'performers':
        // Quick tip to favorite performer
        console.log('Quick tip action');
        break;
      case 'bounties':
        // Create quick bounty
        console.log('Quick bounty action');
        break;
      case 'activity':
        // Share recent activity
        console.log('Share activity action');
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (isConnected && walletAddress) {
      handleRefresh();
    }
  }, [isConnected, walletAddress]);

  const sections: DashboardSection[] = [
    {
      id: 'performers',
      title: 'Trending Performers',
      icon: '🎤',
      component: <PerformersSection dashboardData={dashboardData} />
    },
    {
      id: 'bounties',
      title: 'Active Bounties',
      icon: '🎯',
      component: <BountiesSection dashboardData={dashboardData} />
    },
    {
      id: 'activity',
      title: 'Recent Activity',
      icon: '📊',
      component: <ActivitySection dashboardData={dashboardData} />
    },
    {
      id: 'achievements',
      title: 'Achievements',
      icon: '🏆',
      component: <AchievementsSection dashboardData={dashboardData} />
    }
  ];

  if (!isConnected) {
    return (
      <div className={styles.container}>
        <div className={styles.connectPrompt}>
          <h2>Connect Your Wallet</h2>
          <p>Swipe and gesture your way through MegaVibe</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Pull to Refresh Indicator */}
      {isRefreshing && (
        <div className={styles.refreshIndicator}>
          <div className={styles.refreshSpinner}></div>
          <span>Refreshing...</span>
        </div>
      )}

      {/* Section Navigation */}
      <div className={styles.sectionNav}>
        {sections.map((section, index) => (
          <button
            key={section.id}
            className={`${styles.sectionButton} ${
              index === currentSection ? styles.active : ''
            }`}
            onClick={() => setCurrentSection(index)}
          >
            <span className={styles.sectionIcon}>{section.icon}</span>
            <span className={styles.sectionTitle}>{section.title}</span>
          </button>
        ))}
      </div>

      {/* Current Section Content */}
      <div className={styles.sectionContent}>
        <div 
          className={styles.sectionsContainer}
          style={{ transform: `translateX(-${currentSection * 100}%)` }}
        >
          {sections.map((section, index) => (
            <div key={section.id} className={styles.section}>
              {section.component}
            </div>
          ))}
        </div>
      </div>

      {/* Gesture Hints */}
      <div className={styles.gestureHints}>
        <div className={styles.hint}>
          <span className={styles.hintIcon}>👈👉</span>
          <span>Swipe to navigate sections</span>
        </div>
        <div className={styles.hint}>
          <span className={styles.hintIcon}>👆👆</span>
          <span>Double tap for quick actions</span>
        </div>
        <div className={styles.hint}>
          <span className={styles.hintIcon}>👇</span>
          <span>Pull down to refresh</span>
        </div>
      </div>

      {/* Gesture State Indicators */}
      {gestureState.isSwipeLeft && (
        <div className={styles.gestureIndicator}>
          <span className={styles.gestureIcon}>👈</span>
          <span>Next Section</span>
        </div>
      )}
      {gestureState.isSwipeRight && (
        <div className={styles.gestureIndicator}>
          <span className={styles.gestureIcon}>👉</span>
          <span>Previous Section</span>
        </div>
      )}
      {gestureState.isDoubleTap && (
        <div className={styles.gestureIndicator}>
          <span className={styles.gestureIcon}>⚡</span>
          <span>Quick Action</span>
        </div>
      )}
    </div>
  );
}

// Section Components
function PerformersSection({ dashboardData }: { dashboardData: unknown }) {
  const mockPerformers = [
    {
      id: '1',
      name: 'DJ Cosmic',
      genre: 'Electronic',
      isLive: true,
      tipAmount: '0.05',
      reputation: 4.8
    },
    {
      id: '2',
      name: 'Sarah Strings',
      genre: 'Acoustic',
      isLive: false,
      tipAmount: '0.02',
      reputation: 4.6
    },
    {
      id: '3',
      name: 'Beat Master',
      genre: 'Hip Hop',
      isLive: true,
      tipAmount: '0.08',
      reputation: 4.9
    }
  ];

  return (
    <div className={styles.sectionInner}>
      <h3 className={styles.sectionHeader}>Trending Performers</h3>
      <div className={styles.performersList}>
        {mockPerformers.map(performer => (
          <SwipeablePerformerCard
            key={performer.id}
            performer={performer}
            onTip={(id) => console.log('Tip performer:', id)}
            onFavorite={(id) => console.log('Favorite performer:', id)}
            onViewProfile={(id) => console.log('View profile:', id)}
            onShare={(id) => console.log('Share performer:', id)}
          />
        ))}
      </div>
    </div>
  );
}

function BountiesSection({ dashboardData }: { dashboardData: unknown }) {
  const mockBounties = [
    { id: '1', title: 'Epic Guitar Solo', reward: '0.1 ETH', deadline: '2 days' },
    { id: '2', title: 'Beat Drop Challenge', reward: '0.05 ETH', deadline: '5 days' },
    { id: '3', title: 'Vocal Cover Contest', reward: '0.08 ETH', deadline: '1 week' }
  ];

  return (
    <div className={styles.sectionInner}>
      <h3 className={styles.sectionHeader}>Active Bounties</h3>
      <div className={styles.bountiesList}>
        {mockBounties.map(bounty => (
          <GestureEnhancedCard
            key={bounty.id}
            onSwipeRight={() => console.log('Apply to bounty:', bounty.id)}
            onSwipeLeft={() => console.log('Save bounty:', bounty.id)}
            swipeRightAction={{ icon: '✅', label: 'Apply', color: '#10b981' }}
            swipeLeftAction={{ icon: '📌', label: 'Save', color: '#f59e0b' }}
          >
            <div className={styles.bountyCard}>
              <h4 className={styles.bountyTitle}>{bounty.title}</h4>
              <div className={styles.bountyDetails}>
                <span className={styles.bountyReward}>{bounty.reward}</span>
                <span className={styles.bountyDeadline}>{bounty.deadline} left</span>
              </div>
            </div>
          </GestureEnhancedCard>
        ))}
      </div>
    </div>
  );
}

function ActivitySection({ dashboardData }: { dashboardData: unknown }) {
  return (
    <div className={styles.sectionInner}>
      <h3 className={styles.sectionHeader}>Recent Activity</h3>
      <div className={styles.activityList}>
        <div className={styles.activityItem}>
          <span className={styles.activityIcon}>💰</span>
          <div className={styles.activityContent}>
            <span className={styles.activityText}>Tipped DJ Cosmic</span>
            <span className={styles.activityTime}>2 hours ago</span>
          </div>
          <span className={styles.activityAmount}>0.05 ETH</span>
        </div>
        <div className={styles.activityItem}>
          <span className={styles.activityIcon}>🎯</span>
          <div className={styles.activityContent}>
            <span className={styles.activityText}>Created bounty</span>
            <span className={styles.activityTime}>1 day ago</span>
          </div>
          <span className={styles.activityAmount}>0.1 ETH</span>
        </div>
      </div>
    </div>
  );
}

function AchievementsSection({ dashboardData }: { dashboardData: unknown }) {
  const achievements = [
    { id: '1', title: 'First Tip', icon: '🎉', unlocked: true },
    { id: '2', title: 'Generous Tipper', icon: '💎', unlocked: true },
    { id: '3', title: 'Bounty Hunter', icon: '🏹', unlocked: false },
    { id: '4', title: 'Event Regular', icon: '🎵', unlocked: false }
  ];

  return (
    <div className={styles.sectionInner}>
      <h3 className={styles.sectionHeader}>Achievements</h3>
      <div className={styles.achievementsList}>
        {achievements.map(achievement => (
          <div 
            key={achievement.id} 
            className={`${styles.achievementItem} ${
              achievement.unlocked ? styles.unlocked : styles.locked
            }`}
          >
            <span className={styles.achievementIcon}>{achievement.icon}</span>
            <span className={styles.achievementTitle}>{achievement.title}</span>
            {achievement.unlocked && <span className={styles.achievementBadge}>✓</span>}
          </div>
        ))}
      </div>
    </div>
  );
}