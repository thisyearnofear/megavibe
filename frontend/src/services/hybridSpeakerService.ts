import { web3SocialService, Web3SpeakerProfile } from './web3SocialService';
import { api } from './api';

interface CuratedSpeaker {
  address: string;
  name: string;
  bio: string;
  profileImage: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
  featured: boolean;
  verified: boolean;
  addedBy: string; // admin who added
  addedAt: string;
  source: 'manual' | 'imported' | 'sync';
}

interface SpeakerProfile extends Web3SpeakerProfile {
  source: 'farcaster' | 'curated' | 'basic';
  featured?: boolean;
  curatedData?: CuratedSpeaker;
}

class HybridSpeakerService {
  private cache = new Map<string, { data: SpeakerProfile; expires: number }>();
  private readonly CACHE_DURATION = {
    farcaster: 24 * 60 * 60 * 1000, // 24 hours
    curated: 7 * 24 * 60 * 60 * 1000, // 7 days
    basic: 30 * 24 * 60 * 60 * 1000 // 30 days
  };

  /**
   * Get speaker profile with smart fallback system
   */
  async getSpeakerProfile(address: string): Promise<SpeakerProfile> {
    // Check cache first
    const cached = this.getCachedProfile(address);
    if (cached) return cached;

    try {
      // 1. Try Farcaster first (web3-native)
      console.log(`🟣 Attempting Farcaster lookup for ${address}`);
      const farcasterProfile = await web3SocialService.getWeb3SpeakerProfile(address);
      
      if (farcasterProfile.farcaster) {
        const profile: SpeakerProfile = {
          ...farcasterProfile,
          source: 'farcaster'
        };
        this.cacheProfile(address, profile, this.CACHE_DURATION.farcaster);
        console.log(`✅ Found Farcaster profile for ${address}`);
        return profile;
      }
    } catch (error) {
      console.warn(`⚠️ Farcaster lookup failed for ${address}:`, error);
    }

    try {
      // 2. Fallback to curated backend data
      console.log(`🗄️ Attempting curated backend lookup for ${address}`);
      const curatedData = await this.getCuratedSpeaker(address);
      
      if (curatedData) {
        const profile: SpeakerProfile = {
          address,
          ensName: undefined,
          farcaster: null,
          lens: null,
          onChainStats: {
            totalTipsReceived: '0',
            totalBountiesCreated: 0,
            totalBountiesClaimed: 0,
            eventsParticipated: 0,
            reputationScore: curatedData.verified ? 500 : 100
          },
          socialMetrics: {
            totalFollowers: 0,
            totalEngagement: 0,
            verifiedIdentity: curatedData.verified,
            primaryPlatform: 'address'
          },
          source: 'curated',
          featured: curatedData.featured,
          curatedData
        };
        
        this.cacheProfile(address, profile, this.CACHE_DURATION.curated);
        console.log(`✅ Found curated profile for ${address}`);
        return profile;
      }
    } catch (error) {
      console.warn(`⚠️ Curated lookup failed for ${address}:`, error);
    }

    // 3. Create basic profile as final fallback
    console.log(`🔄 Creating basic profile for ${address}`);
    const basicProfile: SpeakerProfile = {
      address,
      ensName: undefined,
      farcaster: null,
      lens: null,
      onChainStats: {
        totalTipsReceived: '0',
        totalBountiesCreated: 0,
        totalBountiesClaimed: 0,
        eventsParticipated: 0,
        reputationScore: 50
      },
      socialMetrics: {
        totalFollowers: 0,
        totalEngagement: 0,
        verifiedIdentity: false,
        primaryPlatform: 'address'
      },
      source: 'basic'
    };

    this.cacheProfile(address, basicProfile, this.CACHE_DURATION.basic);
    return basicProfile;
  }

  /**
   * Get curated speaker from backend
   */
  private async getCuratedSpeaker(address: string): Promise<CuratedSpeaker | null> {
    try {
      const response = await api.get(`/api/speakers/curated/${address}`);
      return response.data;
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error fetching curated speaker:', error);
      }
      return null;
    }
  }

  /**
   * Search speakers across all sources
   */
  async searchSpeakers(query: string, limit: number = 10): Promise<SpeakerProfile[]> {
    const results: SpeakerProfile[] = [];

    try {
      // Search Farcaster
      const farcasterResults = await web3SocialService.searchSpeakers(query);
      results.push(...farcasterResults.map(profile => ({ ...profile, source: 'farcaster' as const })));
    } catch (error) {
      console.warn('Farcaster search failed:', error);
    }

    try {
      // Search curated backend
      const curatedResults = await this.searchCuratedSpeakers(query);
      results.push(...curatedResults);
    } catch (error) {
      console.warn('Curated search failed:', error);
    }

    // Remove duplicates and limit results
    const uniqueResults = results.filter((profile, index, self) => 
      self.findIndex && Array.isArray(self) && self.findIndex(p => p.address.toLowerCase() === profile.address.toLowerCase()) === index
    );

    return uniqueResults.slice(0, limit);
  }

  /**
   * Search curated speakers
   */
  private async searchCuratedSpeakers(query: string): Promise<SpeakerProfile[]> {
    try {
      const response = await api.get(`/api/speakers/search?q=${encodeURIComponent(query)}`);
      return response.data.map((curatedData: CuratedSpeaker) => ({
        address: curatedData.address,
        ensName: undefined,
        farcaster: null,
        lens: null,
        onChainStats: {
          totalTipsReceived: '0',
          totalBountiesCreated: 0,
          totalBountiesClaimed: 0,
          eventsParticipated: 0,
          reputationScore: curatedData.verified ? 500 : 100
        },
        socialMetrics: {
          totalFollowers: 0,
          totalEngagement: 0,
          verifiedIdentity: curatedData.verified,
          primaryPlatform: 'address' as const
        },
        source: 'curated' as const,
        featured: curatedData.featured,
        curatedData
      }));
    } catch (error) {
      console.error('Error searching curated speakers:', error);
      return [];
    }
  }

  /**
   * Get featured speakers (mix of Farcaster + curated)
   */
  async getFeaturedSpeakers(limit: number = 6): Promise<SpeakerProfile[]> {
    try {
      // Get featured curated speakers
      const response = await api.get(`/api/speakers/featured?limit=${limit}`);
      const featuredAddresses = response.data.map((speaker: CuratedSpeaker) => speaker.address);
      
      // Get full profiles for featured speakers
      const profiles = await Promise.all(
        featuredAddresses.map(address => this.getSpeakerProfile(address))
      );
      
      return profiles.filter(profile => profile !== null);
    } catch (error) {
      console.error('Error fetching featured speakers:', error);
      return [];
    }
  }

  /**
   * Cache management
   */
  private getCachedProfile(address: string): SpeakerProfile | null {
    const cached = this.cache.get(address.toLowerCase());
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    this.cache.delete(address.toLowerCase());
    return null;
  }

  private cacheProfile(address: string, profile: SpeakerProfile, duration: number): void {
    this.cache.set(address.toLowerCase(), {
      data: profile,
      expires: Date.now() + duration
    });
  }

  /**
   * Admin methods
   */
  async addCuratedSpeaker(speakerData: Omit<CuratedSpeaker, 'addedBy' | 'addedAt'>): Promise<CuratedSpeaker> {
    try {
      const response = await api.post('/api/admin/speakers', speakerData);
      // Clear cache for this address
      this.cache.delete(speakerData.address.toLowerCase());
      return response.data;
    } catch (error) {
      console.error('Error adding curated speaker:', error);
      throw error;
    }
  }

  async updateCuratedSpeaker(address: string, updates: Partial<CuratedSpeaker>): Promise<CuratedSpeaker> {
    try {
      const response = await api.put(`/api/admin/speakers/${address}`, updates);
      // Clear cache for this address
      this.cache.delete(address.toLowerCase());
      return response.data;
    } catch (error) {
      console.error('Error updating curated speaker:', error);
      throw error;
    }
  }

  /**
   * Get display name with source priority
   */
  getDisplayName(profile: SpeakerProfile): string {
    if (profile.source === 'farcaster' && profile.farcaster) {
      return web3SocialService.getDisplayName(profile);
    }
    if (profile.source === 'curated' && profile.curatedData) {
      return profile.curatedData.name;
    }
    return `${profile.address.slice(0, 6)}...${profile.address.slice(-4)}`;
  }

  /**
   * Get profile picture with source priority
   */
  getProfilePicture(profile: SpeakerProfile): string {
    if (profile.source === 'farcaster' && profile.farcaster) {
      return web3SocialService.getProfilePicture(profile);
    }
    if (profile.source === 'curated' && profile.curatedData?.profileImage) {
      return profile.curatedData.profileImage;
    }
    return '/api/placeholder/60/60';
  }

  /**
   * Get bio with source priority
   */
  getBio(profile: SpeakerProfile): string {
    if (profile.source === 'farcaster' && profile.farcaster) {
      return web3SocialService.getBio(profile);
    }
    if (profile.source === 'curated' && profile.curatedData?.bio) {
      return profile.curatedData.bio;
    }
    return 'Speaker';
  }
}

export const hybridSpeakerService = new HybridSpeakerService();
export default hybridSpeakerService;
