import { ethers } from 'ethers';

// Neynar API Response Interfaces (matching their schema)
interface NeynarUser {
  object: 'user';
  fid: number;
  username: string;
  display_name: string;
  custody_address: string;
  pfp_url: string;
  profile: {
    bio: {
      text: string;
    };
    location?: {
      latitude: number;
      longitude: number;
      address: {
        city: string;
        state: string;
        country: string;
      };
    };
    banner_url?: string;
  };
  follower_count: number;
  following_count: number;
  verifications: string[];
  verified_addresses: {
    eth_addresses: string[];
    sol_addresses: string[];
  };
  verified_accounts: Array<{
    platform: string;
    username: string;
  }> | null;
  power_badge: boolean;
  viewer_context?: {
    following: boolean;
    followed_by: boolean;
    blocking: boolean;
    blocked_by: boolean;
  };
}

interface NeynarBulkUsersResponse {
  users: NeynarUser[];
}

interface NeynarUserSearchResponse {
  result: {
    users: NeynarUser[];
    next?: {
      cursor: string;
    };
  };
}

// Our internal interfaces
export interface FarcasterProfile {
  fid: number;
  username: string;
  displayName: string;
  bio: string;
  pfpUrl: string;
  followerCount: number;
  followingCount: number;
  verifications: string[];
  custodyAddress: string;
  powerBadge: boolean;
  location?: string;
  verifiedAccounts: Array<{
    platform: string;
    username: string;
  }>;
}

// Lens integration removed - focusing on Farcaster only

export interface Web3SpeakerProfile {
  // Core identity
  address: string;
  ensName?: string;
  error?: string;

  // Farcaster data
  farcaster?: FarcasterProfile;

  // On-chain reputation (from our contracts)
  onChainStats: {
    totalTipsReceived: string;
    totalBountiesCreated: number;
    totalBountiesClaimed: number;
    eventsParticipated: number;
    reputationScore: number;
  };

  // Aggregated social proof
  socialMetrics: {
    totalFollowers: number;
    totalEngagement: number;
    verifiedIdentity: boolean;
    primaryPlatform: 'farcaster' | 'ens' | 'address';
  };
}

class Web3SocialService {
  private neynarApiKey: string;
  private neynarBaseUrl = 'https://api.neynar.com/v2/farcaster';

  constructor() {
    this.neynarApiKey = import.meta.env.VITE_NEYNAR_API_KEY || import.meta.env.NEYNAR_API_KEY || '';
    if (!this.neynarApiKey) {
      console.warn('⚠️ VITE_NEYNAR_API_KEY or NEYNAR_API_KEY not configured. Farcaster profiles will not load.');
    }
  }

  /**
   * Get Farcaster profile by address using Neynar API
   */
  async getFarcasterProfile(address: string): Promise<FarcasterProfile | null> {
    if (!this.neynarApiKey) {
      console.warn('Neynar API key not configured');
      return null;
    }

    try {
      const response = await fetch(
        `${this.neynarBaseUrl}/user/bulk-by-address?addresses=${address}`,
        {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'x-api-key': this.neynarApiKey
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // No Farcaster profile found for this address
          return null;
        }
        throw new Error(`Neynar API error: ${response.status} ${response.statusText}`);
      }

      const data: { [key: string]: NeynarUser[] } = await response.json();
      const userArray = data[address.toLowerCase()];

      if (!userArray || userArray.length === 0) {
        return null;
      }

      return this.transformNeynarUser(userArray[0]);
    } catch (error) {
      console.error('Error fetching Farcaster profile:', error);
      return null;
    }
  }

  /**
   * Search for Farcaster users by username
   */
  async searchFarcasterUsers(query: string, limit: number = 5): Promise<FarcasterProfile[]> {
    if (!this.neynarApiKey) {
      console.warn('Neynar API key not configured');
      return [];
    }

    try {
      const response = await fetch(
        `${this.neynarBaseUrl}/user/search?q=${encodeURIComponent(query)}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'x-api-key': this.neynarApiKey
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Neynar API error: ${response.status} ${response.statusText}`);
      }

      const data: NeynarUserSearchResponse = await response.json();

      return data.result.users.map(user => this.transformNeynarUser(user));
    } catch (error) {
      console.error('Error searching Farcaster users:', error);
      return [];
    }
  }

  /**
   * Get Farcaster profile by username
   */
  async getFarcasterProfileByUsername(username: string): Promise<FarcasterProfile | null> {
    if (!this.neynarApiKey) {
      console.warn('Neynar API key not configured');
      return null;
    }

    try {
      const response = await fetch(
        `${this.neynarBaseUrl}/user/by_username?username=${encodeURIComponent(username)}`,
        {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'x-api-key': this.neynarApiKey
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Neynar API error: ${response.status} ${response.statusText}`);
      }

      const data: { user: NeynarUser } = await response.json();

      return this.transformNeynarUser(data.user);
    } catch (error) {
      console.error('Error fetching Farcaster profile by username:', error);
      return null;
    }
  }

  /**
   * Get multiple Farcaster profiles by FIDs
   */
  async getFarcasterProfilesByFids(fids: number[]): Promise<FarcasterProfile[]> {
    if (!this.neynarApiKey) {
      console.warn('Neynar API key not configured');
      return [];
    }

    try {
      const fidsParam = fids.join(',');
      const response = await fetch(
        `${this.neynarBaseUrl}/user/bulk?fids=${fidsParam}`,
        {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'x-api-key': this.neynarApiKey
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Neynar API error: ${response.status} ${response.statusText}`);
      }

      const data: NeynarBulkUsersResponse = await response.json();

      return data.users.map(user => this.transformNeynarUser(user));
    } catch (error) {
      console.error('Error fetching Farcaster profiles by FIDs:', error);
      return [];
    }
  }

  /**
   * Transform Neynar API response to our internal format
   */
  private transformNeynarUser(neynarUser: NeynarUser): FarcasterProfile {
    const location = neynarUser.profile?.location?.address
      ? `${neynarUser.profile.location.address.city}, ${neynarUser.profile.location.address.state}`
      : undefined;

    return {
      fid: neynarUser.fid,
      username: neynarUser.username,
      displayName: neynarUser.display_name,
      bio: neynarUser.profile?.bio?.text || '',
      pfpUrl: neynarUser.pfp_url || '/api/placeholder/60/60',
      followerCount: neynarUser.follower_count,
      followingCount: neynarUser.following_count,
      verifications: neynarUser.verifications || [],
      custodyAddress: neynarUser.custody_address,
      powerBadge: neynarUser.power_badge,
      location,
      verifiedAccounts: neynarUser.verified_accounts || []
    };
  }

  /**
   * Lens integration removed - focusing on Farcaster only
   */
  async getLensProfile(address: string): Promise<null> {
    // Lens integration removed to focus on Farcaster
    return null;
  }

  /**
   * Get ENS name for address
   */
  async getENSName(address: string): Promise<string | null> {
    try {
      // Use a public ENS resolver
      const response = await fetch(`https://api.ensideas.com/ens/resolve/${address}`);
      if (!response.ok) return null;

      const data = await response.json();
      return data.name || null;
    } catch (error) {
      console.error('Error fetching ENS name:', error);
      return null;
    }
  }

  /**
   * Get comprehensive Web3 profile for a speaker (Farcaster focused)
   */
  async getWeb3SpeakerProfile(address: string): Promise<Web3SpeakerProfile> {
    if (!this.neynarApiKey) {
      return {
        address,
        error: 'Neynar API key not configured',
        onChainStats: {
          totalTipsReceived: '0',
          totalBountiesCreated: 0,
          totalBountiesClaimed: 0,
          eventsParticipated: 0,
          reputationScore: 0
        },
        socialMetrics: {
          totalFollowers: 0,
          totalEngagement: 0,
          verifiedIdentity: false,
          primaryPlatform: 'address'
        }
      };
    }
    const [farcaster, ensName] = await Promise.all([
      this.getFarcasterProfile(address),
      this.getENSName(address)
    ]);

    // Calculate aggregated social metrics (Farcaster focused)
    const totalFollowers = farcaster?.followerCount || 0;
    const totalEngagement = farcaster?.followerCount || 0;
    const verifiedIdentity = !!(farcaster || ensName);

    let primaryPlatform: 'farcaster' | 'ens' | 'address' = 'address';
    if (farcaster) {
      primaryPlatform = 'farcaster';
    } else if (ensName) {
      primaryPlatform = 'ens';
    }

    return {
      address,
      ensName,
      farcaster,
      onChainStats: {
        totalTipsReceived: '0', // Will be populated from contract
        totalBountiesCreated: 0,
        totalBountiesClaimed: 0,
        eventsParticipated: 0,
        reputationScore: this.calculateReputationScore({
          address,
          ensName,
          farcaster,
          onChainStats: {
            totalTipsReceived: '0',
            totalBountiesCreated: 0,
            totalBountiesClaimed: 0,
            eventsParticipated: 0,
            reputationScore: 0
          },
          socialMetrics: {
            totalFollowers,
            totalEngagement,
            verifiedIdentity,
            primaryPlatform
          }
        })
      },
      socialMetrics: {
        totalFollowers,
        totalEngagement,
        verifiedIdentity,
        primaryPlatform
      }
    };
  }

  /**
   * Search for speakers across platforms
   */
  async searchSpeakers(query: string): Promise<Web3SpeakerProfile[]> {
    try {
      // Search Farcaster first
      const farcasterResults = await this.searchFarcasterUsers(query, 10);

      // Convert Farcaster results to Web3SpeakerProfiles
      const profiles = await Promise.all(
        farcasterResults.map(async (fc) => {
          // Get the primary ETH address from verifications
          const primaryAddress = fc.verifications[0] || fc.custodyAddress;

          // Get ENS name for the address if available
          const ensName = await this.getENSName(primaryAddress);

          return {
            address: primaryAddress,
            ensName,
            farcaster: fc,
            onChainStats: {
              totalTipsReceived: '0',
              totalBountiesCreated: 0,
              totalBountiesClaimed: 0,
              eventsParticipated: 0,
              reputationScore: 0
            },
            socialMetrics: {
              totalFollowers: fc.followerCount,
              totalEngagement: fc.followerCount,
              verifiedIdentity: true,
              primaryPlatform: 'farcaster' as const
            }
          };
        })
      );

      return profiles;
    } catch (error) {
      console.error('Error searching speakers:', error);
      return [];
    }
  }

  /**
   * Get display name with fallback priority (Farcaster focused)
   */
  getDisplayName(profile: Web3SpeakerProfile): string {
    if (profile.farcaster?.displayName) return profile.farcaster.displayName;
    if (profile.ensName) return profile.ensName;
    if (profile.farcaster?.username) return `@${profile.farcaster.username}`;
    return `${profile.address.slice(0, 6)}...${profile.address.slice(-4)}`;
  }

  /**
   * Get profile picture with fallback (Farcaster focused)
   */
  getProfilePicture(profile: Web3SpeakerProfile): string {
    if (profile.farcaster?.pfpUrl && profile.farcaster.pfpUrl !== '/api/placeholder/60/60') {
      return profile.farcaster.pfpUrl;
    }
    // Generate a consistent avatar based on address
    return `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.address}&backgroundColor=8A63D2`;
  }

  /**
   * Get bio with fallback (Farcaster focused)
   */
  getBio(profile: Web3SpeakerProfile): string {
    if (profile.farcaster?.bio) return profile.farcaster.bio;
    return 'Web3 Builder & Creator';
  }

  /**
   * Get social platform links
   */
  getSocialLinks(profile: Web3SpeakerProfile): Array<{
    platform: string;
    url: string;
    username: string;
    followers?: number;
  }> {
    const links = [];

    if (profile.farcaster) {
      links.push({
        platform: 'farcaster',
        url: `https://warpcast.com/${profile.farcaster.username}`,
        username: profile.farcaster.username,
        followers: profile.farcaster.followerCount
      });
    }

    // Lens integration removed - focusing on Farcaster only

    // Add verified accounts from Farcaster
    if (profile.farcaster?.verifiedAccounts) {
      profile.farcaster.verifiedAccounts.forEach(account => {
        if (account.platform === 'x') {
          links.push({
            platform: 'twitter',
            url: `https://twitter.com/${account.username}`,
            username: account.username
          });
        }
      });
    }

    return links;
  }

  /**
   * Check if address has verified Farcaster profile
   */
  async hasVerifiedFarcasterProfile(address: string): Promise<boolean> {
    const profile = await this.getFarcasterProfile(address);
    return !!profile;
  }

  /**
   * Get reputation score based on social metrics
   */
  calculateReputationScore(profile: Web3SpeakerProfile): number {
    let score = 0;

    // Base score for having a profile
    if (profile.farcaster) score += 200;
    if (profile.ensName) score += 50;

    // Follower-based scoring (Farcaster focused)
    const totalFollowers = profile.socialMetrics.totalFollowers;
    if (totalFollowers > 10000) score += 600;
    else if (totalFollowers > 5000) score += 400;
    else if (totalFollowers > 1000) score += 250;
    else if (totalFollowers > 500) score += 150;
    else if (totalFollowers > 100) score += 75;

    // Power badge bonus
    if (profile.farcaster?.powerBadge) score += 200;

    // Verification bonus
    if (profile.farcaster?.verifications.length > 0) score += 100;

    return Math.min(score, 1000); // Cap at 1000
  }
}

export const web3SocialService = new Web3SocialService();
export default web3SocialService;
