// Tip Storage Service - FilCDN Integration
import { FilCDNService } from '../filcdnService';

export interface TipRecord {
  id: string;
  eventId: string;
  speakerId: string;
  speakerName: string;
  tipper: string;
  tipperName?: string;
  amount: number;
  currency: string;
  message?: string;
  timestamp: number;
  txHash?: string;
  chainId?: number;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface StoredTipHistory {
  eventId: string;
  tips: TipRecord[];
  version: string;
  timestamp: number;
  lastUpdated: number;
}

export interface TipIndex {
  [eventId: string]: {
    cid: string;
    lastUpdated: number;
    tipCount: number;
    version: string;
  };
}

export class TipStorageService {
  private static readonly STORAGE_VERSION = '1.0';
  private static readonly INDEX_KEY = 'megavibe_tip_index';
  private static readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes (shorter for real-time data)

  constructor(private filcdn: FilCDNService) {}

  /**
   * Store tip history for an event on FilCDN
   */
  async storeTipHistory(eventId: string, tips: TipRecord[]): Promise<string> {
    try {
      console.log(`📤 Storing tip history for event: ${eventId} (${tips.length} tips)`);

      const storedTipHistory: StoredTipHistory = {
        eventId,
        tips: tips.sort((a, b) => b.timestamp - a.timestamp), // Sort by newest first
        version: TipStorageService.STORAGE_VERSION,
        timestamp: Date.now(),
        lastUpdated: Date.now()
      };

      // Store on FilCDN
      const result = await this.filcdn.storeData(storedTipHistory);
      
      // Update local index
      this.updateTipIndex(eventId, result.cid, storedTipHistory.lastUpdated, tips.length);
      
      console.log(`✅ Tip history stored with CID: ${result.cid}`);
      return result.cid;
      
    } catch (error) {
      console.error(`❌ Failed to store tip history for ${eventId}:`, error);
      throw new Error(`Tip storage failed: ${error.message}`);
    }
  }

  /**
   * Retrieve tip history for an event from FilCDN
   */
  async retrieveTipHistory(eventId: string): Promise<TipRecord[]> {
    try {
      const index = this.getTipIndex();
      const tipEntry = index[eventId];
      
      if (!tipEntry) {
        console.warn(`Tip history for event ${eventId} not found in index`);
        return [];
      }

      // Check cache first
      const cached = this.getCachedTipHistory(eventId);
      if (cached && this.isCacheValid(cached.lastUpdated)) {
        console.log(`📋 Using cached tip history: ${eventId}`);
        return cached.tips;
      }

      console.log(`📥 Retrieving tip history from FilCDN: ${eventId}`);
      
      // Retrieve from FilCDN
      const result = await this.filcdn.retrieveData(tipEntry.cid);
      const tipHistory = result.data as StoredTipHistory;
      
      // Cache the result
      this.cacheTipHistory(eventId, tipHistory);
      
      console.log(`✅ Retrieved ${tipHistory.tips.length} tips for event ${eventId}`);
      return tipHistory.tips;
      
    } catch (error) {
      console.error(`❌ Failed to retrieve tip history for ${eventId}:`, error);
      
      // Try to return cached version as fallback
      const cached = this.getCachedTipHistory(eventId);
      if (cached) {
        console.warn(`🔄 Using stale cached tip history: ${eventId}`);
        return cached.tips;
      }
      
      return [];
    }
  }

  /**
   * Add a new tip to an event's history
   */
  async addTip(eventId: string, tip: TipRecord): Promise<string> {
    try {
      console.log(`📤 Adding tip to event ${eventId}: ${tip.amount} ${tip.currency} from ${tip.tipper}`);
      
      // Get existing tips
      const existingTips = await this.retrieveTipHistory(eventId);
      
      // Add new tip (avoid duplicates)
      const updatedTips = existingTips.filter(t => t.id !== tip.id);
      updatedTips.unshift(tip); // Add to beginning (newest first)
      
      // Store updated history
      const cid = await this.storeTipHistory(eventId, updatedTips);
      
      console.log(`✅ Tip added successfully`);
      return cid;
      
    } catch (error) {
      console.error(`❌ Failed to add tip to event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Update a tip's status (e.g., pending -> confirmed)
   */
  async updateTipStatus(eventId: string, tipId: string, status: TipRecord['status'], txHash?: string): Promise<string> {
    try {
      const tips = await this.retrieveTipHistory(eventId);
      const tipIndex = tips.findIndex(t => t.id === tipId);
      
      if (tipIndex === -1) {
        throw new Error(`Tip ${tipId} not found in event ${eventId}`);
      }
      
      // Update tip
      tips[tipIndex] = {
        ...tips[tipIndex],
        status,
        ...(txHash && { txHash })
      };
      
      return await this.storeTipHistory(eventId, tips);
      
    } catch (error) {
      console.error(`❌ Failed to update tip status:`, error);
      throw error;
    }
  }

  /**
   * Get tips for a specific speaker across all events
   */
  async getTipsForSpeaker(speakerId: string): Promise<TipRecord[]> {
    try {
      const index = this.getTipIndex();
      const allTips: TipRecord[] = [];
      
      // Get tips from all events
      for (const eventId of Object.keys(index)) {
        try {
          const eventTips = await this.retrieveTipHistory(eventId);
          const speakerTips = eventTips.filter(tip => tip.speakerId === speakerId);
          allTips.push(...speakerTips);
        } catch (error) {
          console.warn(`Failed to get tips for event ${eventId}:`, error);
        }
      }
      
      // Sort by timestamp (newest first)
      return allTips.sort((a, b) => b.timestamp - a.timestamp);
      
    } catch (error) {
      console.error(`❌ Failed to get tips for speaker ${speakerId}:`, error);
      return [];
    }
  }

  /**
   * Get recent tips across all events
   */
  async getRecentTips(limit: number = 50): Promise<TipRecord[]> {
    try {
      const index = this.getTipIndex();
      const allTips: TipRecord[] = [];
      
      // Get tips from all events
      for (const eventId of Object.keys(index)) {
        try {
          const eventTips = await this.retrieveTipHistory(eventId);
          allTips.push(...eventTips);
        } catch (error) {
          console.warn(`Failed to get tips for event ${eventId}:`, error);
        }
      }
      
      // Sort by timestamp and limit
      return allTips
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
        
    } catch (error) {
      console.error('❌ Failed to get recent tips:', error);
      return [];
    }
  }

  /**
   * Get tip statistics for an event
   */
  async getEventTipStats(eventId: string): Promise<{
    totalTips: number;
    totalAmount: number;
    uniqueTippers: number;
    topSpeakers: Array<{ speakerId: string; speakerName: string; amount: number; tipCount: number }>;
  }> {
    try {
      const tips = await this.retrieveTipHistory(eventId);
      const confirmedTips = tips.filter(tip => tip.status === 'confirmed');
      
      const totalTips = confirmedTips.length;
      const totalAmount = confirmedTips.reduce((sum, tip) => sum + tip.amount, 0);
      const uniqueTippers = new Set(confirmedTips.map(tip => tip.tipper)).size;
      
      // Calculate top speakers
      const speakerStats = new Map<string, { speakerName: string; amount: number; tipCount: number }>();
      
      confirmedTips.forEach(tip => {
        const existing = speakerStats.get(tip.speakerId) || { speakerName: tip.speakerName, amount: 0, tipCount: 0 };
        existing.amount += tip.amount;
        existing.tipCount += 1;
        speakerStats.set(tip.speakerId, existing);
      });
      
      const topSpeakers = Array.from(speakerStats.entries())
        .map(([speakerId, stats]) => ({ speakerId, ...stats }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);
      
      return {
        totalTips,
        totalAmount,
        uniqueTippers,
        topSpeakers
      };
      
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

  /**
   * Get tip storage statistics
   */
  getStats(): { totalEvents: number; totalTips: number; cachedEvents: number; indexSize: number } {
    const index = this.getTipIndex();
    const totalTips = Object.values(index).reduce((sum, entry) => sum + entry.tipCount, 0);
    const cachedEvents = Object.keys(localStorage).filter(key => 
      key.startsWith('megavibe_tip_cache_')
    ).length;
    
    return {
      totalEvents: Object.keys(index).length,
      totalTips,
      cachedEvents,
      indexSize: JSON.stringify(index).length
    };
  }

  /**
   * Clear all cached tip data
   */
  clearCache(): void {
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith('megavibe_tip_cache_')
    );
    
    keys.forEach(key => localStorage.removeItem(key));
    console.log(`🧹 Cleared ${keys.length} cached tip histories`);
  }

  // Private helper methods

  private updateTipIndex(eventId: string, cid: string, lastUpdated: number, tipCount: number): void {
    const index = this.getTipIndex();
    index[eventId] = {
      cid,
      lastUpdated,
      tipCount,
      version: TipStorageService.STORAGE_VERSION
    };
    
    localStorage.setItem(TipStorageService.INDEX_KEY, JSON.stringify(index));
  }

  private getTipIndex(): TipIndex {
    try {
      const stored = localStorage.getItem(TipStorageService.INDEX_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to parse tip index:', error);
      return {};
    }
  }

  private getCachedTipHistory(eventId: string): StoredTipHistory | null {
    try {
      const cached = localStorage.getItem(`megavibe_tip_cache_${eventId}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error(`Failed to parse cached tip history ${eventId}:`, error);
      return null;
    }
  }

  private cacheTipHistory(eventId: string, tipHistory: StoredTipHistory): void {
    try {
      localStorage.setItem(`megavibe_tip_cache_${eventId}`, JSON.stringify(tipHistory));
    } catch (error) {
      console.error(`Failed to cache tip history ${eventId}:`, error);
    }
  }

  private isCacheValid(lastUpdated: number): boolean {
    return Date.now() - lastUpdated < TipStorageService.CACHE_DURATION;
  }
}

export default TipStorageService;