// Decentralized API Service - Replaces Backend with FilCDN
import { FilCDNService, createFilCDNService } from './filcdnService';
import { EventStorageService } from './storage/eventStorageService';
import { SpeakerStorageService } from './storage/speakerStorageService';
import { TipStorageService, TipRecord } from './storage/tipStorageService';
import { Event, Speaker } from '../contexts/EventContext';
import { env } from '../config/environment';

export interface DecentralizedApiConfig {
  filecoinPrivateKey: string;
  filecoinRpcUrl: string;
  enableCaching: boolean;
  enableFallback: boolean;
  withCDN: boolean;
}

export interface ApiStats {
  filcdn: any;
  events: any;
  speakers: any;
  tips: any;
  isReady: boolean;
  lastInitialized: number;
}

export class DecentralizedApiService {
  private filcdn: FilCDNService;
  private eventStorage: EventStorageService;
  private speakerStorage: SpeakerStorageService;
  private tipStorage: TipStorageService;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private config: DecentralizedApiConfig;

  constructor(config: DecentralizedApiConfig) {
    this.config = config;
    
    // Create FilCDN service
    this.filcdn = createFilCDNService({
      privateKey: config.filecoinPrivateKey,
      rpcURL: config.filecoinRpcUrl,
      withCDN: config.withCDN
    });

    // Create storage services
    this.eventStorage = new EventStorageService(this.filcdn);
    this.speakerStorage = new SpeakerStorageService(this.filcdn);
    this.tipStorage = new TipStorageService(this.filcdn);
  }

  /**
   * Initialize the decentralized API service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('✅ Decentralized API service already initialized');
      return;
    }

    if (this.initializationPromise) {
      console.log('⏳ Waiting for ongoing initialization...');
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      console.log('🚀 Initializing Decentralized API Service...');
      
      // Initialize FilCDN service
      await this.filcdn.initialize();
      
      this.isInitialized = true;
      console.log('✅ Decentralized API Service initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Decentralized API Service:', error);
      this.initializationPromise = null;
      throw new Error(`Decentralized API initialization failed: ${error.message}`);
    }
  }

  /**
   * Ensure service is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  // Event Management API

  /**
   * Get all events (replaces GET /api/events)
   */
  async getEvents(): Promise<Event[]> {
    await this.ensureInitialized();
    
    try {
      return await this.eventStorage.getAllEvents();
    } catch (error) {
      console.error('❌ Failed to get events:', error);
      if (this.config.enableFallback) {
        // Could fallback to cached data or mock data
        return this.getFallbackEvents();
      }
      throw error;
    }
  }

  /**
   * Get a specific event (replaces GET /api/events/:id)
   */
  async getEvent(eventId: string): Promise<Event | null> {
    await this.ensureInitialized();
    
    try {
      return await this.eventStorage.retrieveEvent(eventId);
    } catch (error) {
      console.error(`❌ Failed to get event ${eventId}:`, error);
      return null;
    }
  }

  /**
   * Create a new event (replaces POST /api/events)
   */
  async createEvent(event: Event): Promise<string> {
    await this.ensureInitialized();
    
    try {
      return await this.eventStorage.storeEvent(event);
    } catch (error) {
      console.error('❌ Failed to create event:', error);
      throw error;
    }
  }

  /**
   * Update an event (replaces PUT /api/events/:id)
   */
  async updateEvent(eventId: string, updates: Partial<Event>): Promise<string> {
    await this.ensureInitialized();
    
    try {
      return await this.eventStorage.updateEvent(eventId, updates);
    } catch (error) {
      console.error(`❌ Failed to update event ${eventId}:`, error);
      throw error;
    }
  }

  // Speaker Management API

  /**
   * Get speakers for an event (replaces GET /api/events/:id/speakers)
   */
  async getSpeakers(eventId: string): Promise<Speaker[]> {
    await this.ensureInitialized();
    
    try {
      const event = await this.getEvent(eventId);
      if (!event || !event.speakers) {
        return [];
      }

      return event.speakers;
    } catch (error) {
      console.error(`❌ Failed to get speakers for event ${eventId}:`, error);
      return [];
    }
  }

  /**
   * Get a specific speaker (replaces GET /api/speakers/:id)
   */
  async getSpeaker(speakerId: string): Promise<Speaker | null> {
    await this.ensureInitialized();
    
    try {
      return await this.speakerStorage.retrieveSpeakerProfile(speakerId);
    } catch (error) {
      console.error(`❌ Failed to get speaker ${speakerId}:`, error);
      return null;
    }
  }

  /**
   * Create a speaker profile (replaces POST /api/speakers)
   */
  async createSpeaker(speaker: Speaker): Promise<string> {
    await this.ensureInitialized();
    
    try {
      return await this.speakerStorage.storeSpeakerProfile(speaker);
    } catch (error) {
      console.error('❌ Failed to create speaker:', error);
      throw error;
    }
  }

  /**
   * Search speakers (replaces GET /api/speakers/search)
   */
  async searchSpeakers(query: string): Promise<Speaker[]> {
    await this.ensureInitialized();
    
    try {
      return await this.speakerStorage.searchSpeakers(query);
    } catch (error) {
      console.error(`❌ Failed to search speakers:`, error);
      return [];
    }
  }

  // Tip Management API

  /**
   * Get tip history for an event (replaces GET /api/events/:id/tips)
   */
  async getTipHistory(eventId: string): Promise<TipRecord[]> {
    await this.ensureInitialized();
    
    try {
      return await this.tipStorage.retrieveTipHistory(eventId);
    } catch (error) {
      console.error(`❌ Failed to get tip history for event ${eventId}:`, error);
      return [];
    }
  }

  /**
   * Add a new tip (replaces POST /api/tips)
   */
  async addTip(tip: TipRecord): Promise<string> {
    await this.ensureInitialized();
    
    try {
      return await this.tipStorage.addTip(tip.eventId, tip);
    } catch (error) {
      console.error('❌ Failed to add tip:', error);
      throw error;
    }
  }

  /**
   * Update tip status (replaces PUT /api/tips/:id)
   */
  async updateTipStatus(eventId: string, tipId: string, status: TipRecord['status'], txHash?: string): Promise<string> {
    await this.ensureInitialized();
    
    try {
      return await this.tipStorage.updateTipStatus(eventId, tipId, status, txHash);
    } catch (error) {
      console.error('❌ Failed to update tip status:', error);
      throw error;
    }
  }

  /**
   * Get recent tips across all events (replaces GET /api/tips/recent)
   */
  async getRecentTips(limit: number = 50): Promise<TipRecord[]> {
    await this.ensureInitialized();
    
    try {
      return await this.tipStorage.getRecentTips(limit);
    } catch (error) {
      console.error('❌ Failed to get recent tips:', error);
      return [];
    }
  }

  /**
   * Get tips for a specific speaker (replaces GET /api/speakers/:id/tips)
   */
  async getTipsForSpeaker(speakerId: string): Promise<TipRecord[]> {
    await this.ensureInitialized();
    
    try {
      return await this.tipStorage.getTipsForSpeaker(speakerId);
    } catch (error) {
      console.error(`❌ Failed to get tips for speaker ${speakerId}:`, error);
      return [];
    }
  }

  /**
   * Get tip statistics for an event (replaces GET /api/events/:id/stats)
   */
  async getEventTipStats(eventId: string): Promise<any> {
    await this.ensureInitialized();
    
    try {
      return await this.tipStorage.getEventTipStats(eventId);
    } catch (error) {
      console.error(`❌ Failed to get tip stats for event ${eventId}:`, error);
      return {
        totalTips: 0,
        totalAmount: 0,
        uniqueTippers: 0,
        topSpeakers: []
      };
    }
  }

  // Real-time Updates (P2P simulation)

  /**
   * Subscribe to real-time updates for an event
   */
  subscribeToUpdates(eventId: string, callback: (update: any) => void): () => void {
    console.log(`📡 Subscribing to updates for event: ${eventId}`);
    
    // For now, implement polling-based updates
    // In the future, this could use WebRTC or other P2P protocols
    const interval = setInterval(async () => {
      try {
        const tips = await this.getTipHistory(eventId);
        callback({ type: 'tips', data: tips });
      } catch (error) {
        console.error('Failed to fetch updates:', error);
      }
    }, 10000); // Poll every 10 seconds

    // Return unsubscribe function
    return () => {
      clearInterval(interval);
      console.log(`📡 Unsubscribed from updates for event: ${eventId}`);
    };
  }

  // Utility Methods

  /**
   * Get comprehensive API statistics
   */
  async getStats(): Promise<ApiStats> {
    try {
      const filcdnStats = await this.filcdn.getStats();
      const eventStats = this.eventStorage.getStats();
      const speakerStats = this.speakerStorage.getStats();
      const tipStats = this.tipStorage.getStats();

      return {
        filcdn: filcdnStats,
        events: eventStats,
        speakers: speakerStats,
        tips: tipStats,
        isReady: this.isInitialized,
        lastInitialized: Date.now()
      };
    } catch (error) {
      console.error('❌ Failed to get API stats:', error);
      return {
        filcdn: null,
        events: { totalEvents: 0, cachedEvents: 0, indexSize: 0 },
        speakers: { totalSpeakers: 0, cachedSpeakers: 0, indexSize: 0 },
        tips: { totalEvents: 0, totalTips: 0, cachedEvents: 0, indexSize: 0 },
        isReady: false,
        lastInitialized: 0
      };
    }
  }

  /**
   * Clear all cached data
   */
  clearAllCache(): void {
    this.eventStorage.clearCache();
    this.speakerStorage.clearCache();
    this.tipStorage.clearCache();
    console.log('🧹 All cache cleared');
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.filcdn.isReady();
  }

  // Fallback methods for when FilCDN is unavailable

  private getFallbackEvents(): Event[] {
    // Return mock events or cached events
    console.warn('🔄 Using fallback events');
    return [
      {
        id: 'devcon-7-bangkok',
        name: 'DevCon 7 Bangkok',
        description: 'The premier Ethereum developer conference',
        venue: 'Queen Sirikit National Convention Center',
        date: new Date().toLocaleDateString(),
        status: 'live',
        speakers: [],
        totalTips: 0,
        totalBounties: 0,
        attendeeCount: 0,
      }
    ];
  }
}

// Factory function to create service instance
export const createDecentralizedApiService = (config?: Partial<DecentralizedApiConfig>): DecentralizedApiService => {
  const fullConfig: DecentralizedApiConfig = {
    filecoinPrivateKey: config?.filecoinPrivateKey || env.filcdn.privateKey,
    filecoinRpcUrl: config?.filecoinRpcUrl || env.filcdn.rpcUrl,
    enableCaching: config?.enableCaching ?? true,
    enableFallback: config?.enableFallback ?? true,
    withCDN: config?.withCDN ?? true
  };

  return new DecentralizedApiService(fullConfig);
};

export default DecentralizedApiService;