// Speaker Storage Service - FilCDN Integration
import { FilCDNService } from '../filcdnService';
import { Speaker } from '../../contexts/EventContext';

export interface StoredSpeaker extends Speaker {
  version: string;
  timestamp: number;
  lastUpdated: number;
}

export interface SpeakerIndex {
  [speakerId: string]: {
    cid: string;
    lastUpdated: number;
    version: string;
  };
}

export class SpeakerStorageService {
  private static readonly STORAGE_VERSION = '1.0';
  private static readonly INDEX_KEY = 'megavibe_speaker_index';
  private static readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  constructor(private filcdn: FilCDNService) {}

  /**
   * Store a speaker profile on FilCDN
   */
  async storeSpeakerProfile(speaker: Speaker): Promise<string> {
    try {
      console.log(`📤 Storing speaker profile: ${speaker.name} (${speaker.id})`);

      const storedSpeaker: StoredSpeaker = {
        ...speaker,
        version: SpeakerStorageService.STORAGE_VERSION,
        timestamp: Date.now(),
        lastUpdated: Date.now()
      };

      // Store on FilCDN
      const result = await this.filcdn.storeData(storedSpeaker);
      
      // Update local index
      this.updateSpeakerIndex(speaker.id, result.cid, storedSpeaker.lastUpdated);
      
      console.log(`✅ Speaker profile stored with CID: ${result.cid}`);
      return result.cid;
      
    } catch (error) {
      console.error(`❌ Failed to store speaker ${speaker.id}:`, error);
      throw new Error(`Speaker storage failed: ${error.message}`);
    }
  }

  /**
   * Retrieve a speaker profile from FilCDN
   */
  async retrieveSpeakerProfile(speakerId: string): Promise<Speaker | null> {
    try {
      const index = this.getSpeakerIndex();
      const speakerEntry = index[speakerId];
      
      if (!speakerEntry) {
        console.warn(`Speaker ${speakerId} not found in index`);
        return null;
      }

      // Check cache first
      const cached = this.getCachedSpeaker(speakerId);
      if (cached && this.isCacheValid(cached.lastUpdated)) {
        console.log(`📋 Using cached speaker: ${speakerId}`);
        return cached;
      }

      console.log(`📥 Retrieving speaker from FilCDN: ${speakerId}`);
      
      // Retrieve from FilCDN
      const result = await this.filcdn.retrieveData(speakerEntry.cid);
      const speaker = result.data as StoredSpeaker;
      
      // Cache the result
      this.cacheSpeaker(speakerId, speaker);
      
      console.log(`✅ Speaker retrieved: ${speaker.name}`);
      return speaker;
      
    } catch (error) {
      console.error(`❌ Failed to retrieve speaker ${speakerId}:`, error);
      
      // Try to return cached version as fallback
      const cached = this.getCachedSpeaker(speakerId);
      if (cached) {
        console.warn(`🔄 Using stale cached speaker: ${speakerId}`);
        return cached;
      }
      
      return null;
    }
  }

  /**
   * Get multiple speakers by IDs
   */
  async getSpeakersByIds(speakerIds: string[]): Promise<Speaker[]> {
    try {
      console.log(`📥 Retrieving ${speakerIds.length} speakers...`);
      
      // Retrieve speakers in parallel with error handling
      const speakerPromises = speakerIds.map(async (speakerId) => {
        try {
          return await this.retrieveSpeakerProfile(speakerId);
        } catch (error) {
          console.warn(`Failed to load speaker ${speakerId}:`, error);
          return null;
        }
      });
      
      const results = await Promise.allSettled(speakerPromises);
      const speakers: Speaker[] = [];
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          speakers.push(result.value);
        }
      });
      
      console.log(`✅ Retrieved ${speakers.length}/${speakerIds.length} speakers`);
      return speakers;
      
    } catch (error) {
      console.error('❌ Failed to retrieve speakers:', error);
      return [];
    }
  }

  /**
   * Get all speakers from FilCDN
   */
  async getAllSpeakers(): Promise<Speaker[]> {
    try {
      console.log('📥 Retrieving all speakers...');
      
      const index = this.getSpeakerIndex();
      const speakerIds = Object.keys(index);
      
      return await this.getSpeakersByIds(speakerIds);
      
    } catch (error) {
      console.error('❌ Failed to retrieve all speakers:', error);
      
      // Return cached speakers as fallback
      const cachedSpeakers = this.getAllCachedSpeakers();
      if (cachedSpeakers.length > 0) {
        console.warn(`🔄 Using ${cachedSpeakers.length} cached speakers`);
        return cachedSpeakers;
      }
      
      return [];
    }
  }

  /**
   * Update an existing speaker profile
   */
  async updateSpeakerProfile(speakerId: string, updates: Partial<Speaker>): Promise<string> {
    try {
      const existingSpeaker = await this.retrieveSpeakerProfile(speakerId);
      if (!existingSpeaker) {
        throw new Error(`Speaker ${speakerId} not found`);
      }

      const updatedSpeaker: Speaker = {
        ...existingSpeaker,
        ...updates,
        id: speakerId // Ensure ID doesn't change
      };

      return await this.storeSpeakerProfile(updatedSpeaker);
      
    } catch (error) {
      console.error(`❌ Failed to update speaker ${speakerId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a speaker profile (remove from index)
   */
  async deleteSpeakerProfile(speakerId: string): Promise<void> {
    try {
      const index = this.getSpeakerIndex();
      delete index[speakerId];
      
      localStorage.setItem(SpeakerStorageService.INDEX_KEY, JSON.stringify(index));
      this.removeCachedSpeaker(speakerId);
      
      console.log(`✅ Speaker ${speakerId} removed from index`);
      
    } catch (error) {
      console.error(`❌ Failed to delete speaker ${speakerId}:`, error);
      throw error;
    }
  }

  /**
   * Search speakers by name or title
   */
  async searchSpeakers(query: string): Promise<Speaker[]> {
    try {
      const allSpeakers = await this.getAllSpeakers();
      const lowercaseQuery = query.toLowerCase();
      
      return allSpeakers.filter(speaker => 
        speaker.name.toLowerCase().includes(lowercaseQuery) ||
        (speaker.title && speaker.title.toLowerCase().includes(lowercaseQuery)) ||
        (speaker.bio && speaker.bio.toLowerCase().includes(lowercaseQuery))
      );
      
    } catch (error) {
      console.error('❌ Failed to search speakers:', error);
      return [];
    }
  }

  /**
   * Get speaker statistics
   */
  getStats(): { totalSpeakers: number; cachedSpeakers: number; indexSize: number } {
    const index = this.getSpeakerIndex();
    const cached = this.getAllCachedSpeakers();
    
    return {
      totalSpeakers: Object.keys(index).length,
      cachedSpeakers: cached.length,
      indexSize: JSON.stringify(index).length
    };
  }

  /**
   * Clear all cached speaker data
   */
  clearCache(): void {
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith('megavibe_speaker_cache_')
    );
    
    keys.forEach(key => localStorage.removeItem(key));
    console.log(`🧹 Cleared ${keys.length} cached speakers`);
  }

  // Private helper methods

  private updateSpeakerIndex(speakerId: string, cid: string, lastUpdated: number): void {
    const index = this.getSpeakerIndex();
    index[speakerId] = {
      cid,
      lastUpdated,
      version: SpeakerStorageService.STORAGE_VERSION
    };
    
    localStorage.setItem(SpeakerStorageService.INDEX_KEY, JSON.stringify(index));
  }

  private getSpeakerIndex(): SpeakerIndex {
    try {
      const stored = localStorage.getItem(SpeakerStorageService.INDEX_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to parse speaker index:', error);
      return {};
    }
  }

  private getCachedSpeaker(speakerId: string): StoredSpeaker | null {
    try {
      const cached = localStorage.getItem(`megavibe_speaker_cache_${speakerId}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error(`Failed to parse cached speaker ${speakerId}:`, error);
      return null;
    }
  }

  private cacheSpeaker(speakerId: string, speaker: StoredSpeaker): void {
    try {
      localStorage.setItem(`megavibe_speaker_cache_${speakerId}`, JSON.stringify(speaker));
    } catch (error) {
      console.error(`Failed to cache speaker ${speakerId}:`, error);
    }
  }

  private removeCachedSpeaker(speakerId: string): void {
    localStorage.removeItem(`megavibe_speaker_cache_${speakerId}`);
  }

  private getAllCachedSpeakers(): Speaker[] {
    const speakers: Speaker[] = [];
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith('megavibe_speaker_cache_')
    );
    
    keys.forEach(key => {
      try {
        const speaker = JSON.parse(localStorage.getItem(key) || '');
        if (speaker) speakers.push(speaker);
      } catch (error) {
        console.error(`Failed to parse cached speaker from ${key}:`, error);
      }
    });
    
    return speakers.sort((a, b) => a.name.localeCompare(b.name));
  }

  private isCacheValid(lastUpdated: number): boolean {
    return Date.now() - lastUpdated < SpeakerStorageService.CACHE_DURATION;
  }
}

export default SpeakerStorageService;