import { calculateDistance, formatDistance } from '@/hooks/useLocation';

export interface PerformerProfile {
  id: string;
  name: string;
  type: string;
  description: string;
  genres: string[];
  location: {
    lat: number;
    lng: number;
    address: string;
    venue?: string;
  };
  status: 'offline' | 'live' | 'break' | 'finished';
  preferences: {
    acceptsTips: boolean;
    acceptsRequests: boolean;
    requestTypes: string[];
    minimumTip: number;
    minimumRequest: number;
  };
  socialLinks: {
    instagram?: string;
    twitter?: string;
    website?: string;
  };
  stats: {
    totalEarnings: number;
    totalTips: number;
    totalRequests: number;
    averageRating: number;
    performanceCount: number;
  };
  avatar?: string;
  qrCode?: string;
  walletAddress?: string;
  createdAt: number;
  lastActiveAt: number;
}

export interface PerformerRegistration {
  performerId: string;
  qrCode: string;
  deepLink: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface NearbyPerformersQuery {
  lat: number;
  lng: number;
  radius: number; // in kilometers
  status?: 'live' | 'break' | 'all';
  type?: string;
  limit?: number;
}

class PerformerService {
  private baseUrl: string;
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private cacheTimeout = 30000; // 30 seconds

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  }

  async registerPerformer(profile: Omit<PerformerProfile, 'id' | 'stats' | 'createdAt' | 'lastActiveAt'>): Promise<PerformerRegistration> {
    try {
      // For now, simulate API call with local storage
      const performerId = `performer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const fullProfile: PerformerProfile = {
        ...profile,
        id: performerId,
        stats: {
          totalEarnings: 0,
          totalTips: 0,
          totalRequests: 0,
          averageRating: 0,
          performanceCount: 0
        },
        createdAt: Date.now(),
        lastActiveAt: Date.now()
      };

      // Store in local storage (temporary solution)
      this.storePerformerProfile(fullProfile);

      // Generate QR code and deep link
      const qrCode = await this.generateQRCode(performerId);
      const deepLink = this.generateDeepLink(performerId);

      return {
        performerId,
        qrCode,
        deepLink,
        status: 'approved' // Auto-approve for demo
      };
    } catch (error) {
      console.error('Failed to register performer:', error);
      throw new Error('Registration failed');
    }
  }

  async getNearbyPerformers(query: NearbyPerformersQuery): Promise<PerformerProfile[]> {
    try {
      // Check cache first
      const cacheKey = `nearby_${query.lat}_${query.lng}_${query.radius}_${query.status}`;
      const cached = this.getFromCache(cacheKey);
      if (cached && Array.isArray(cached)) return cached as PerformerProfile[];

      // Get all performers from storage
      const allPerformers = this.getAllPerformers();
      
      // Filter by distance and status
      const nearbyPerformers = allPerformers
        .map(performer => {
          const distance = calculateDistance(
            query.lat,
            query.lng,
            performer.location.lat,
            performer.location.lng
          );
          
          return {
            ...performer,
            distance: formatDistance(distance),
            distanceKm: distance
          };
        })
        .filter(performer => {
          // Filter by radius
          if (performer.distanceKm > query.radius) return false;
          
          // Filter by status
          if (query.status && query.status !== 'all' && performer.status !== query.status) return false;
          
          // Filter by type
          if (query.type && performer.type !== query.type) return false;
          
          return true;
        })
        .sort((a, b) => a.distanceKm - b.distanceKm) // Sort by distance
        .slice(0, query.limit || 50); // Limit results

      // Cache the results
      this.setCache(cacheKey, nearbyPerformers);
      
      return nearbyPerformers;
    } catch (error) {
      console.error('Failed to get nearby performers:', error);
      return [];
    }
  }

  async getPerformerById(performerId: string): Promise<PerformerProfile | null> {
    try {
      // Check cache first
      const cached = this.getFromCache(`performer_${performerId}`);
      if (cached && typeof cached === 'object' && cached !== null) return cached as PerformerProfile;

      // Get from storage
      const performer = this.getPerformerProfile(performerId);
      if (performer) {
        this.setCache(`performer_${performerId}`, performer);
      }
      
      return performer;
    } catch (error) {
      console.error('Failed to get performer:', error);
      return null;
    }
  }

  async updatePerformerStatus(performerId: string, status: PerformerProfile['status']): Promise<void> {
    try {
      const performer = this.getPerformerProfile(performerId);
      if (!performer) {
        throw new Error('Performer not found');
      }

      performer.status = status;
      performer.lastActiveAt = Date.now();
      
      this.storePerformerProfile(performer);
      
      // Clear cache
      this.clearCache(`performer_${performerId}`);
      this.clearCacheByPattern('nearby_');
      
      // In production, this would also broadcast to real-time subscribers
      this.broadcastStatusUpdate(performerId, status);
    } catch (error) {
      console.error('Failed to update performer status:', error);
      throw error;
    }
  }

  async updatePerformerLocation(performerId: string, lat: number, lng: number, address?: string): Promise<void> {
    try {
      const performer = this.getPerformerProfile(performerId);
      if (!performer) {
        throw new Error('Performer not found');
      }

      performer.location.lat = lat;
      performer.location.lng = lng;
      if (address) performer.location.address = address;
      performer.lastActiveAt = Date.now();
      
      this.storePerformerProfile(performer);
      
      // Clear location-based cache
      this.clearCacheByPattern('nearby_');
    } catch (error) {
      console.error('Failed to update performer location:', error);
      throw error;
    }
  }

  async validatePerformer(performerId: string): Promise<boolean> {
    try {
      const performer = this.getPerformerProfile(performerId);
      return performer !== null;
    } catch (error) {
      console.error('Failed to validate performer:', error);
      return false;
    }
  }

  // QR Code and Deep Link generation
  private async generateQRCode(performerId: string): Promise<string> {
    // In production, this would generate a real QR code
    // For now, return a placeholder URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://megavibe.vercel.app';
    return `${baseUrl}/performer/${performerId}`;
  }

  private generateDeepLink(performerId: string): string {
    return `megavibe://performer/${performerId}`;
  }

  // Local storage methods (temporary - replace with real API)
  private storePerformerProfile(performer: PerformerProfile): void {
    const performers = this.getAllPerformers();
    const existingIndex = performers.findIndex(p => p.id === performer.id);
    
    if (existingIndex !== -1) {
      performers[existingIndex] = performer;
    } else {
      performers.push(performer);
    }
    
    localStorage.setItem('megavibe_performers', JSON.stringify(performers));
  }

  private getPerformerProfile(performerId: string): PerformerProfile | null {
    const performers = this.getAllPerformers();
    return performers.find(p => p.id === performerId) || null;
  }

  private getAllPerformers(): PerformerProfile[] {
    try {
      const stored = localStorage.getItem('megavibe_performers');
      return stored ? JSON.parse(stored) : this.getDefaultPerformers();
    } catch (error) {
      console.error('Failed to parse performers:', error);
      return this.getDefaultPerformers();
    }
  }

  private getDefaultPerformers(): PerformerProfile[] {
    // Default performers for demo
    return [
      {
        id: "performer_demo_1",
        name: "Jake Blues",
        type: "Musician",
        description: "Blues and classic rock guitarist",
        genres: ["Blues", "Rock", "Classic Rock"],
        location: {
          lat: 37.7749,
          lng: -122.4194,
          address: "Union Square, San Francisco, CA",
          venue: "Street Corner"
        },
        status: "live",
        preferences: {
          acceptsTips: true,
          acceptsRequests: true,
          requestTypes: ["Song Requests", "Dedications"],
          minimumTip: 1,
          minimumRequest: 5
        },
        socialLinks: {
          instagram: "@jakeblues_music"
        },
        stats: {
          totalEarnings: 245.50,
          totalTips: 48,
          totalRequests: 12,
          averageRating: 4.8,
          performanceCount: 23
        },
        avatar: "🎸",
        createdAt: Date.now() - 86400000, // 1 day ago
        lastActiveAt: Date.now() - 300000 // 5 minutes ago
      },
      {
        id: "performer_demo_2",
        name: "Sarah Comedy",
        type: "Comedian",
        description: "Stand-up comedian specializing in observational humor",
        genres: ["Stand-up", "Observational", "Clean Comedy"],
        location: {
          lat: 37.7849,
          lng: -122.4094,
          address: "Comedy Club, San Francisco, CA",
          venue: "The Punchline"
        },
        status: "break",
        preferences: {
          acceptsTips: true,
          acceptsRequests: true,
          requestTypes: ["Shoutouts", "Custom Jokes"],
          minimumTip: 2,
          minimumRequest: 10
        },
        socialLinks: {
          instagram: "@sarahcomedy",
          website: "sarahcomedy.com"
        },
        stats: {
          totalEarnings: 189.25,
          totalTips: 32,
          totalRequests: 8,
          averageRating: 4.6,
          performanceCount: 15
        },
        avatar: "🎭",
        createdAt: Date.now() - 172800000, // 2 days ago
        lastActiveAt: Date.now() - 900000 // 15 minutes ago
      }
    ];
  }

  // Cache management
  private getFromCache(key: string): unknown {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: unknown): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private clearCache(key: string): void {
    this.cache.delete(key);
  }

  private clearCacheByPattern(pattern: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Real-time updates using WebSocket
  private broadcastStatusUpdate(performerId: string, status: string): void {
    const socket = new WebSocket('wss://example.com/socket');
  
    socket.onopen = () => {
      console.log('WebSocket connection established');
      socket.send(JSON.stringify({ performerId, status }));
    };
  
    socket.onmessage = (event) => {
      console.log('Message from server:', event.data);
    };
  
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  
    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };
    // In production, this would broadcast via WebSocket
    console.log(`Broadcasting status update: ${performerId} -> ${status}`);
    
    // Simulate real-time update for demo
    window.dispatchEvent(new CustomEvent('performerStatusUpdate', {
      detail: { performerId, status }
    }));
  }

  // Subscription management for real-time updates
  subscribeToPerformerUpdates(callback: (update: { performerId: string; status: string }) => void): () => void {
    const handler = (event: CustomEvent) => {
      callback(event.detail);
    };

    window.addEventListener('performerStatusUpdate', handler as EventListener);
    
    return () => {
      window.removeEventListener('performerStatusUpdate', handler as EventListener);
    };
  }

  subscribeToTipUpdates(callback: (update: unknown) => void): () => void {
    const handler = (event: CustomEvent) => {
      callback(event.detail);
    };

    window.addEventListener('tipUpdate', handler as EventListener);
    
    return () => {
      window.removeEventListener('tipUpdate', handler as EventListener);
    };
  }
}

export const performerService = new PerformerService();
