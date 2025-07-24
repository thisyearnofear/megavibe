/**
 * Unified App Service - Central orchestrator for all MegaVibe features
 * Creates cohesive experience by connecting tipping, bounties, and reputation
 */

import { bountyService, tippingService, eventService } from '@/services/blockchain';
import { createRealFilCDNService } from '@/services/filcdn/realFilcdnService';
import { performerService } from '@/services/api/performerService';

// Initialize FilCDN service
const filcdnService = createRealFilCDNService();

export interface UserActivity {
  type: 'tip' | 'bounty_create' | 'bounty_submit' | 'event_attend';
  timestamp: number;
  amount?: string;
  target: string; // performer ID, event ID, etc.
  metadata: Record<string, unknown>;
}

export interface UserProfile {
  address: string;
  reputation: {
    total: number;
    tipping: number;
    bounties: number;
    social: number;
  };
  activities: UserActivity[];
  preferences: {
    favoriteGenres: string[];
    preferredTipAmounts: string[];
    notificationSettings: Record<string, boolean>;
  };
  achievements: string[];
}

export interface RecommendationEngine {
  recommendPerformers(userProfile: UserProfile): Promise<string[]>;
  recommendBounties(userProfile: UserProfile): Promise<string[]>;
  recommendEvents(userProfile: UserProfile): Promise<string[]>;
  getPersonalizedFeed(userProfile: UserProfile): Promise<unknown[]>;
}

export class UnifiedAppService {
  private userProfiles: Map<string, UserProfile> = new Map();
  
  /**
   * Initialize user profile with cross-feature data
   */
  async initializeUserProfile(walletAddress: string): Promise<UserProfile> {
    if (this.userProfiles.has(walletAddress)) {
      return this.userProfiles.get(walletAddress)!;
    }

    // Aggregate data from all services
    const [tippingHistory, bountyHistory, eventHistory] = await Promise.all([
      this.getTippingHistory(walletAddress),
      this.getBountyHistory(walletAddress),
      this.getEventHistory(walletAddress)
    ]);

    const profile: UserProfile = {
      address: walletAddress,
      reputation: this.calculateReputation(tippingHistory, bountyHistory, eventHistory),
      activities: [...tippingHistory, ...bountyHistory, ...eventHistory].sort(
        (a, b) => b.timestamp - a.timestamp
      ),
      preferences: await this.loadUserPreferences(walletAddress),
      achievements: this.calculateAchievements(tippingHistory, bountyHistory, eventHistory)
    };

    this.userProfiles.set(walletAddress, profile);
    return profile;
  }

  /**
   * Cross-feature recommendation engine
   */
  async getRecommendations(walletAddress: string): Promise<{
    performers: string[];
    bounties: string[];
    events: string[];
    personalizedFeed: unknown[];
  }> {
    const profile = await this.initializeUserProfile(walletAddress);
    
    return {
      performers: await this.recommendPerformers(profile),
      bounties: await this.recommendBounties(profile),
      events: await this.recommendEvents(profile),
      personalizedFeed: await this.getPersonalizedFeed(profile)
    };
  }

  /**
   * Unified action tracking across all features
   */
  async trackActivity(walletAddress: string, activity: UserActivity): Promise<void> {
    const profile = await this.initializeUserProfile(walletAddress);
    profile.activities.unshift(activity);
    
    // Update reputation based on activity
    profile.reputation = this.calculateReputation(
      profile.activities.filter(a => a.type === 'tip'),
      profile.activities.filter(a => a.type.startsWith('bounty')),
      profile.activities.filter(a => a.type === 'event_attend')
    );

    // Check for new achievements
    const newAchievements = this.calculateAchievements(
      profile.activities.filter(a => a.type === 'tip'),
      profile.activities.filter(a => a.type.startsWith('bounty')),
      profile.activities.filter(a => a.type === 'event_attend')
    );
    
    const achievementSet = new Set([...profile.achievements, ...newAchievements]);
    profile.achievements = Array.from(achievementSet);
    
    this.userProfiles.set(walletAddress, profile);
    
    // Store to FilCDN for persistence
    await this.persistUserProfile(profile);
  }

  /**
   * Get unified dashboard data
   */
  async getDashboardData(walletAddress: string): Promise<{
    profile: UserProfile;
    recentActivity: UserActivity[];
    recommendations: unknown;
    achievements: string[];
    stats: {
      totalTipped: string;
      bountiesCreated: number;
      bountiesCompleted: number;
      eventsAttended: number;
    };
  }> {
    const profile = await this.initializeUserProfile(walletAddress);
    const recommendations = await this.getRecommendations(walletAddress);
    
    return {
      profile,
      recentActivity: profile.activities.slice(0, 10),
      recommendations,
      achievements: profile.achievements,
      stats: this.calculateStats(profile.activities)
    };
  }

  // Private helper methods
  private async getTippingHistory(address: string): Promise<UserActivity[]> {
    // Implementation would fetch from tipping service
    return [];
  }

  private async getBountyHistory(address: string): Promise<UserActivity[]> {
    // Implementation would fetch from bounty service
    return [];
  }

  private async getEventHistory(address: string): Promise<UserActivity[]> {
    // Implementation would fetch from event service
    return [];
  }

  private calculateReputation(tips: UserActivity[], bounties: UserActivity[], events: UserActivity[]): UserProfile['reputation'] {
    return {
      total: tips.length * 10 + bounties.length * 25 + events.length * 5,
      tipping: tips.length * 10,
      bounties: bounties.length * 25,
      social: events.length * 5
    };
  }

  private calculateAchievements(tips: UserActivity[], bounties: UserActivity[], events: UserActivity[]): string[] {
    const achievements: string[] = [];
    
    if (tips.length >= 1) achievements.push('first_tip');
    if (tips.length >= 10) achievements.push('generous_tipper');
    if (bounties.length >= 1) achievements.push('bounty_hunter');
    if (events.length >= 5) achievements.push('event_regular');
    
    return achievements;
  }

  private async loadUserPreferences(address: string): Promise<UserProfile['preferences']> {
    // Load from FilCDN or return defaults
    return {
      favoriteGenres: [],
      preferredTipAmounts: ['0.01', '0.05', '0.1'],
      notificationSettings: {
        newBounties: true,
        tipReceived: true,
        eventReminders: true
      }
    };
  }

  private async recommendPerformers(profile: UserProfile): Promise<string[]> {
    // AI-powered recommendations based on tipping history
    return [];
  }

  private async recommendBounties(profile: UserProfile): Promise<string[]> {
    // Recommend bounties based on skills and interests
    return [];
  }

  private async recommendEvents(profile: UserProfile): Promise<string[]> {
    // Recommend events based on attendance history
    return [];
  }

  private async getPersonalizedFeed(profile: UserProfile): Promise<unknown[]> {
    // Create personalized feed mixing all content types
    return [];
  }

  private calculateStats(activities: UserActivity[]): Record<string, unknown> {
    return {
      totalTipped: activities
        .filter(a => a.type === 'tip')
        .reduce((sum, a) => sum + parseFloat(a.amount || '0'), 0)
        .toString(),
      bountiesCreated: activities.filter(a => a.type === 'bounty_create').length,
      bountiesCompleted: activities.filter(a => a.type === 'bounty_submit').length,
      eventsAttended: activities.filter(a => a.type === 'event_attend').length
    };
  }

  private async persistUserProfile(profile: UserProfile): Promise<void> {
    // Store profile to FilCDN for decentralized persistence
    try {
      await filcdnService.storeData({
        type: 'user_profile',
        address: profile.address,
        data: profile,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to persist user profile:', error);
    }
  }
}

export const unifiedAppService = new UnifiedAppService();
export default unifiedAppService;