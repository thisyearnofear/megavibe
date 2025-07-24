import React from 'react';

// Simple in-memory cache implementation (avoiding external dependency)
class SimpleCache<K, V> {
  private cache = new Map<K, { value: V; expiry: number }>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize: number = 1000, ttl: number = 3600000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value;
  }

  set(key: K, value: V): void {
    // Clean expired items
    this.cleanup();
    
    // Remove oldest items if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl
    });
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  get max(): number {
    return this.maxSize;
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: K[] = [];
    
    this.cache.forEach((item, key) => {
      if (now > item.expiry) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

export interface ResolvedIdentity {
  address: string;
  ensName?: string;
  displayName: string;
  avatar?: string;
  description?: string;
  platforms: string[];
  social?: {
    twitter?: string;
    github?: string;
    farcaster?: string;
    lens?: string;
  };
  links?: {
    website?: string;
    [key: string]: string | undefined;
  };
}

export interface AddressResolverOptions {
  enableFarcaster?: boolean;
  enableLens?: boolean;
  enableBasenames?: boolean;
  cacheSize?: number;
  cacheTTL?: number; // milliseconds
}

class AddressResolverService {
  private cache: SimpleCache<string, ResolvedIdentity>;
  private options: Required<AddressResolverOptions>;

  constructor(options: AddressResolverOptions = {}) {
    this.options = {
      enableFarcaster: true,
      enableLens: true,
      enableBasenames: true,
      cacheSize: 1000,
      cacheTTL: 1000 * 60 * 60, // 1 hour
      ...options
    };

    this.cache = new SimpleCache(
      this.options.cacheSize,
      this.options.cacheTTL
    );
  }

  /**
   * Resolve an address or ENS name to a comprehensive identity
   */
  async resolveAddress(addressOrEns: string): Promise<ResolvedIdentity> {
    const cacheKey = addressOrEns.toLowerCase();
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Try multiple resolution strategies
      const identity = await this.resolveWithFallback(addressOrEns);
      
      // Cache the result
      this.cache.set(cacheKey, identity);
      
      return identity;
    } catch (error) {
      console.warn('Address resolution failed:', error);
      
      // Return fallback identity
      const fallback = this.createFallbackIdentity(addressOrEns);
      this.cache.set(cacheKey, fallback);
      
      return fallback;
    }
  }

  /**
   * Resolve using multiple strategies with fallbacks
   */
  private async resolveWithFallback(addressOrEns: string): Promise<ResolvedIdentity> {
    // Strategy 1: Try ensdata.net (free, reliable)
    try {
      const ensdataResult = await this.resolveWithEnsdata(addressOrEns);
      if (ensdataResult) {
        return ensdataResult;
      }
    } catch (error) {
      console.warn('ensdata.net resolution failed:', error);
    }

    // Strategy 2: Try web3.bio (more comprehensive)
    try {
      const web3bioResult = await this.resolveWithWeb3Bio(addressOrEns);
      if (web3bioResult) {
        return web3bioResult;
      }
    } catch (error) {
      console.warn('web3.bio resolution failed:', error);
    }

    // Strategy 3: Basic ENS resolution (if available)
    try {
      const basicEnsResult = await this.resolveBasicEns(addressOrEns);
      if (basicEnsResult) {
        return basicEnsResult;
      }
    } catch (error) {
      console.warn('Basic ENS resolution failed:', error);
    }

    // Fallback: Return formatted address
    return this.createFallbackIdentity(addressOrEns);
  }

  /**
   * Resolve using ensdata.net API
   */
  private async resolveWithEnsdata(addressOrEns: string): Promise<ResolvedIdentity | null> {
    const baseUrl = 'https://ensdata.net';
    const params = new URLSearchParams();
    
    if (this.options.enableFarcaster) {
      params.append('farcaster', 'true');
    }

    const url = `${baseUrl}/${addressOrEns}${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`ensdata.net API error: ${response.status}`);
    }

    const data = await response.json();
    
    return this.parseEnsdataResponse(data, addressOrEns);
  }

  /**
   * Resolve using web3.bio API
   */
  private async resolveWithWeb3Bio(addressOrEns: string): Promise<ResolvedIdentity | null> {
    const baseUrl = 'https://api.web3.bio';
    const url = `${baseUrl}/profile/${addressOrEns}`;
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    // Add API key if available (for higher rate limits)
    const apiKey = process.env.NEXT_PUBLIC_WEB3_BIO_API_KEY;
    if (apiKey) {
      headers['X-API-KEY'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`web3.bio API error: ${response.status}`);
    }

    const data = await response.json();
    
    return this.parseWeb3BioResponse(data, addressOrEns);
  }

  /**
   * Basic ENS resolution using ethers (if available)
   */
  private async resolveBasicEns(addressOrEns: string): Promise<ResolvedIdentity | null> {
    // This would require ethers.js integration
    // For now, return null to use other strategies
    return null;
  }

  /**
   * Parse ensdata.net response
   */
  private parseEnsdataResponse(data: unknown, originalInput: string): ResolvedIdentity {
    const address = data.address || originalInput;
    const ensName = data.ens_primary || data.name;
    
    return {
      address,
      ensName,
      displayName: ensName || this.formatAddress(address),
      avatar: data.avatar_url || data.avatar,
      description: data.description,
      platforms: this.extractPlatforms(data),
      social: {
        twitter: data.twitter,
        github: data.github,
        farcaster: data.farcaster?.username,
      },
      links: {
        website: data.url || data.website,
      },
    };
  }

  /**
   * Parse web3.bio response
   */
  private parseWeb3BioResponse(data: unknown[], originalInput: string): ResolvedIdentity {
    if (!Array.isArray(data) || data.length === 0) {
      return this.createFallbackIdentity(originalInput);
    }

    // Primary profile (usually ENS)
    const primary = data[0];
    const platforms: string[] = [];
    const social: ResolvedIdentity['social'] = {};
    const links: ResolvedIdentity['links'] = {};

    // Aggregate data from all platforms
    data.forEach(profile => {
      platforms.push(profile.platform);
      
      if (profile.links) {
        Object.assign(links, profile.links);
        
        // Extract social links
        if (profile.links.twitter) {
          social.twitter = profile.links.twitter.handle;
        }
        if (profile.links.github) {
          social.github = profile.links.github.handle;
        }
        if (profile.links.farcaster) {
          social.farcaster = profile.links.farcaster.handle;
        }
      }
    });

    return {
      address: primary.address,
      ensName: primary.platform === 'ens' ? primary.identity : undefined,
      displayName: primary.displayName || this.formatAddress(primary.address),
      avatar: primary.avatar,
      description: primary.description,
      platforms: Array.from(new Set(platforms)), // Remove duplicates
      social,
      links,
    };
  }

  /**
   * Extract platforms from ensdata response
   */
  private extractPlatforms(data: Record<string, unknown>): string[] {
    const platforms: string[] = [];
    
    if (data.ens_primary || data.name) platforms.push('ens');
    if (data.farcaster) platforms.push('farcaster');
    if (data.lens) platforms.push('lens');
    if (data.twitter) platforms.push('twitter');
    if (data.github) platforms.push('github');
    
    return platforms;
  }

  /**
   * Create fallback identity for failed resolutions
   */
  private createFallbackIdentity(addressOrEns: string): ResolvedIdentity {
    const isAddress = addressOrEns.startsWith('0x');
    
    return {
      address: isAddress ? addressOrEns : '',
      ensName: !isAddress ? addressOrEns : undefined,
      displayName: isAddress ? this.formatAddress(addressOrEns) : addressOrEns,
      platforms: [],
    };
  }

  /**
   * Format address for display (0x1234...5678)
   */
  private formatAddress(address: string): string {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      max: this.cache.max,
      ttl: this.options.cacheTTL,
    };
  }
}

// Export singleton instance
export const addressResolver = new AddressResolverService();

// Export hook for React components
export function useAddressResolver(addressOrEns?: string) {
  const [identity, setIdentity] = React.useState<ResolvedIdentity | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!addressOrEns) {
      setIdentity(null);
      return;
    }

    setLoading(true);
    setError(null);

    addressResolver.resolveAddress(addressOrEns)
      .then(setIdentity)
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Unknown error";
        setError(message);
        setIdentity(addressResolver['createFallbackIdentity'](addressOrEns));
      })
      .finally(() => setLoading(false));
  }, [addressOrEns]);

  return { identity, loading, error };
}

export default AddressResolverService;