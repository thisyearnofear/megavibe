"use client";

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { unifiedAppService, UserProfile, UserActivity } from '@/services/unified/UnifiedAppService';
import styles from './UnifiedDashboard.module.css';
import MyContent from "./MyContent";


interface DashboardData {
  profile: UserProfile;
  recentActivity: UserActivity[];
  recommendations: any;
  achievements: string[];
  stats: {
    totalTipped: string;
    bountiesCreated: number;
    bountiesCompleted: number;
    eventsAttended: number;
  };
}

export default function UnifiedDashboard() {
  const { walletAddress, isConnected } = useWallet();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'recommendations' | 'my-content'>('overview');

  useEffect(() => {
    if (isConnected && walletAddress) {
      loadDashboardData();
    }
  }, [isConnected, walletAddress]);

  const loadDashboardData = async () => {
    if (!walletAddress) return;
    
    try {
      setLoading(true);
      const data = await unifiedAppService.getDashboardData(walletAddress);
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className={styles.connectPrompt}>
        <h2>Connect Your Wallet</h2>
        <p>Connect your wallet to see your personalized MegaVibe dashboard</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading your MegaVibe profile...</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className={styles.error}>
        <p>Failed to load dashboard data</p>
        <button onClick={loadDashboardData}>Retry</button>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Header with user stats */}
      <div className={styles.header}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {walletAddress.slice(0, 2).toUpperCase()}
          </div>
          <div className={styles.userDetails}>
            <h2>Welcome back!</h2>
            <p>{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
            <div className={styles.reputation}>
              <span className={styles.reputationScore}>
                {dashboardData.profile.reputation.total} Reputation
              </span>
            </div>
          </div>
        </div>
        
        <div className={styles.quickStats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{dashboardData.stats.totalTipped}</span>
            <span className={styles.statLabel}>ETH Tipped</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{dashboardData.stats.bountiesCreated}</span>
            <span className={styles.statLabel}>Bounties Created</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{dashboardData.stats.eventsAttended}</span>
            <span className={styles.statLabel}>Events Attended</span>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      


// ... (rest of the component)

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'activity' ? styles.active : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          Recent Activity
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'recommendations' ? styles.active : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          For You
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'my-content' ? styles.active : ''}`}
          onClick={() => setActiveTab('my-content')}
        >
          My Content
        </button>
      </div>

      {/* Tab content */}
      <div className={styles.content}>
        {activeTab === 'overview' && (
          <OverviewTab 
            profile={dashboardData.profile}
            achievements={dashboardData.achievements}
            stats={dashboardData.stats}
          />
        )}
        
        {activeTab === 'activity' && (
          <ActivityTab activities={dashboardData.recentActivity} />
        )}
        
        {activeTab === 'recommendations' && (
          <RecommendationsTab recommendations={dashboardData.recommendations} />
        )}

        {activeTab === 'my-content' && <MyContent />}
      </div>
// ... (rest of the component)
    </div>
  );
}

// Sub-components for each tab
function OverviewTab({ profile, achievements, stats }: {
  profile: UserProfile;
  achievements: string[];
  stats: any;
}) {
  return (
    <div className={styles.overview}>
      {/* Reputation breakdown */}
      <div className={styles.card}>
        <h3>Reputation Breakdown</h3>
        <div className={styles.reputationBreakdown}>
          <div className={styles.reputationItem}>
            <span>Tipping</span>
            <span>{profile.reputation.tipping}</span>
          </div>
          <div className={styles.reputationItem}>
            <span>Bounties</span>
            <span>{profile.reputation.bounties}</span>
          </div>
          <div className={styles.reputationItem}>
            <span>Social</span>
            <span>{profile.reputation.social}</span>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className={styles.card}>
        <h3>Achievements</h3>
        <div className={styles.achievements}>
          {achievements.length > 0 ? (
            achievements.map((achievement, index) => (
              <div key={index} className={styles.achievement}>
                🏆 {achievement.replace('_', ' ').toUpperCase()}
              </div>
            ))
          ) : (
            <p>Start tipping and creating bounties to earn achievements!</p>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className={styles.card}>
        <h3>Quick Actions</h3>
        <div className={styles.quickActions}>
          <button className={styles.actionButton}>
            💰 Send Tip
          </button>
          <button className={styles.actionButton}>
            🎯 Create Bounty
          </button>
          <button className={styles.actionButton}>
            📍 Find Events
          </button>
          <button className={styles.actionButton}>
            👥 Discover Performers
          </button>
        </div>
      </div>
    </div>
  );
}

function ActivityTab({ activities }: { activities: UserActivity[] }) {
  return (
    <div className={styles.activity}>
      <h3>Recent Activity</h3>
      {activities.length > 0 ? (
        <div className={styles.activityList}>
          {activities.map((activity, index) => (
            <div key={index} className={styles.activityItem}>
              <div className={styles.activityIcon}>
                {activity.type === 'tip' && '💰'}
                {activity.type === 'bounty_create' && '🎯'}
                {activity.type === 'bounty_submit' && '📝'}
                {activity.type === 'event_attend' && '📍'}
              </div>
              <div className={styles.activityDetails}>
                <p className={styles.activityDescription}>
                  {getActivityDescription(activity)}
                </p>
                <span className={styles.activityTime}>
                  {new Date(activity.timestamp).toLocaleDateString()}
                </span>
              </div>
              {activity.amount && (
                <span className={styles.activityAmount}>
                  {activity.amount} ETH
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p>No recent activity. Start exploring MegaVibe!</p>
      )}
    </div>
  );
}

function RecommendationsTab({ recommendations }: { recommendations: any }) {
  return (
    <div className={styles.recommendations}>
      <div className={styles.card}>
        <h3>Recommended for You</h3>
        <p>Personalized recommendations based on your activity</p>
        
        {/* This would be populated with actual recommendations */}
        <div className={styles.recommendationSections}>
          <div className={styles.recommendationSection}>
            <h4>🎤 Performers You Might Like</h4>
            <p>Discover new performers based on your tipping history</p>
          </div>
          
          <div className={styles.recommendationSection}>
            <h4>🎯 Bounties for You</h4>
            <p>Bounties that match your skills and interests</p>
          </div>
          
          <div className={styles.recommendationSection}>
            <h4>📅 Upcoming Events</h4>
            <p>Events near you that you might enjoy</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function getActivityDescription(activity: UserActivity): string {
  switch (activity.type) {
    case 'tip':
      return `Tipped performer ${activity.target}`;
    case 'bounty_create':
      return `Created bounty for ${activity.target}`;
    case 'bounty_submit':
      return `Submitted to bounty ${activity.target}`;
    case 'event_attend':
      return `Attended event ${activity.target}`;
    default:
      return 'Unknown activity';
  }
}