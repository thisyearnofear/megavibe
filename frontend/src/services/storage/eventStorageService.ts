// Event Storage Service - FilCDN Integration
import { FilCDNService } from '../filcdnService';
import { Event } from '../../contexts/EventContext';

export interface StoredEvent extends Event {
  version: string;
  timestamp: number;
  lastUpdated: number;
}

export interface EventIndex {
  [eventId: string]: {
    cid: string;
    lastUpdated: number;
    version: string;
  };
}

export class EventStorageService {
  private static readonly STORAGE_VERSION = '1.0';
  private static readonly INDEX_KEY = 'megavibe_event_index';
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(private filcdn: FilCDNService) {}

  /**
   * Store an event on FilCDN
   */
  async storeEvent(event: Event): Promise<string> {
    try {
      console.log(`📤 Storing event: ${event.name} (${event.id})`);

      const storedEvent: StoredEvent = {
        ...event,
        version: EventStorageService.STORAGE_VERSION,
        timestamp: Date.now(),
        lastUpdated: Date.now()
      };

      // Store on FilCDN
      const result = await this.filcdn.storeData(storedEvent);
      
      // Update local index
      this.updateEventIndex(event.id, result.cid, storedEvent.lastUpdated);
      
      console.log(`✅ Event stored with CID: ${result.cid}`);
      return result.cid;
      
    } catch (error) {
      console.error(`❌ Failed to store event ${event.id}:`, error);
      throw new Error(`Event storage failed: ${error.message}`);
    }
  }

  /**
   * Retrieve an event from FilCDN
   */
  async retrieveEvent(eventId: string): Promise<Event | null> {
    try {
      const index = this.getEventIndex();
      const eventEntry = index[eventId];
      
      if (!eventEntry) {
        console.warn(`Event ${eventId} not found in index`);
        return null;
      }

      // Check cache first
      const cached = this.getCachedEvent(eventId);
      if (cached && this.isCacheValid(cached.lastUpdated)) {
        console.log(`📋 Using cached event: ${eventId}`);
        return cached;
      }

      console.log(`📥 Retrieving event from FilCDN: ${eventId}`);
      
      // Retrieve from FilCDN
      const result = await this.filcdn.retrieveData(eventEntry.cid);
      const event = result.data as StoredEvent;
      
      // Cache the result
      this.cacheEvent(eventId, event);
      
      console.log(`✅ Event retrieved: ${event.name}`);
      return event;
      
    } catch (error) {
      console.error(`❌ Failed to retrieve event ${eventId}:`, error);
      
      // Try to return cached version as fallback
      const cached = this.getCachedEvent(eventId);
      if (cached) {
        console.warn(`🔄 Using stale cached event: ${eventId}`);
        return cached;
      }
      
      return null;
    }
  }

  /**
   * Get all events from FilCDN
   */
  async getAllEvents(): Promise<Event[]> {
    try {
      console.log('📥 Retrieving all events...');
      
      const index = this.getEventIndex();
      const events: Event[] = [];
      
      // Retrieve events in parallel with error handling
      const eventPromises = Object.entries(index).map(async ([eventId, entry]) => {
        try {
          const event = await this.retrieveEvent(eventId);
          return event;
        } catch (error) {
          console.warn(`Failed to load event ${eventId}:`, error);
          return null;
        }
      });
      
      const results = await Promise.allSettled(eventPromises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          events.push(result.value);
        }
      });
      
      // Sort by start time (newest first)
      events.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      
      console.log(`✅ Retrieved ${events.length} events`);
      return events;
      
    } catch (error) {
      console.error('❌ Failed to retrieve events:', error);
      
      // Return cached events as fallback
      const cachedEvents = this.getAllCachedEvents();
      if (cachedEvents.length > 0) {
        console.warn(`🔄 Using ${cachedEvents.length} cached events`);
        return cachedEvents;
      }
      
      return [];
    }
  }

  /**
   * Update an existing event
   */
  async updateEvent(eventId: string, updates: Partial<Event>): Promise<string> {
    try {
      const existingEvent = await this.retrieveEvent(eventId);
      if (!existingEvent) {
        throw new Error(`Event ${eventId} not found`);
      }

      const updatedEvent: Event = {
        ...existingEvent,
        ...updates,
        id: eventId // Ensure ID doesn't change
      };

      return await this.storeEvent(updatedEvent);
      
    } catch (error) {
      console.error(`❌ Failed to update event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Delete an event (remove from index)
   */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      const index = this.getEventIndex();
      delete index[eventId];
      
      localStorage.setItem(EventStorageService.INDEX_KEY, JSON.stringify(index));
      this.removeCachedEvent(eventId);
      
      console.log(`✅ Event ${eventId} removed from index`);
      
    } catch (error) {
      console.error(`❌ Failed to delete event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Get event statistics
   */
  getStats(): { totalEvents: number; cachedEvents: number; indexSize: number } {
    const index = this.getEventIndex();
    const cached = this.getAllCachedEvents();
    
    return {
      totalEvents: Object.keys(index).length,
      cachedEvents: cached.length,
      indexSize: JSON.stringify(index).length
    };
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith('megavibe_event_cache_')
    );
    
    keys.forEach(key => localStorage.removeItem(key));
    console.log(`🧹 Cleared ${keys.length} cached events`);
  }

  // Private helper methods

  private updateEventIndex(eventId: string, cid: string, lastUpdated: number): void {
    const index = this.getEventIndex();
    index[eventId] = {
      cid,
      lastUpdated,
      version: EventStorageService.STORAGE_VERSION
    };
    
    localStorage.setItem(EventStorageService.INDEX_KEY, JSON.stringify(index));
  }

  private getEventIndex(): EventIndex {
    try {
      const stored = localStorage.getItem(EventStorageService.INDEX_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to parse event index:', error);
      return {};
    }
  }

  private getCachedEvent(eventId: string): StoredEvent | null {
    try {
      const cached = localStorage.getItem(`megavibe_event_cache_${eventId}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error(`Failed to parse cached event ${eventId}:`, error);
      return null;
    }
  }

  private cacheEvent(eventId: string, event: StoredEvent): void {
    try {
      localStorage.setItem(`megavibe_event_cache_${eventId}`, JSON.stringify(event));
    } catch (error) {
      console.error(`Failed to cache event ${eventId}:`, error);
    }
  }

  private removeCachedEvent(eventId: string): void {
    localStorage.removeItem(`megavibe_event_cache_${eventId}`);
  }

  private getAllCachedEvents(): Event[] {
    const events: Event[] = [];
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith('megavibe_event_cache_')
    );
    
    keys.forEach(key => {
      try {
        const event = JSON.parse(localStorage.getItem(key) || '');
        if (event) events.push(event);
      } catch (error) {
        console.error(`Failed to parse cached event from ${key}:`, error);
      }
    });
    
    return events.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  private isCacheValid(lastUpdated: number): boolean {
    return Date.now() - lastUpdated < EventStorageService.CACHE_DURATION;
  }
}

export default EventStorageService;