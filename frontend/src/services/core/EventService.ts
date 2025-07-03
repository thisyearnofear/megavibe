/**
 * EventService.ts
 * 
 * Service for handling event-related functionality, including
 * event listing, filtering, GPS-based venue detection, and
 * event lifecycle management.
 */

import { BaseService, ServiceResponse, ErrorCode } from './BaseService';

export enum EventState {
  UPCOMING = 'upcoming',
  LIVE = 'live',
  ENDED = 'ended'
}

export interface Speaker {
  id: string;
  name: string;
  walletAddress: string;
  title?: string;
  bio?: string;
  avatar?: string;
  socialLinks?: Record<string, string>;
  currentTalk?: string;
  tags?: string[];
  reputation?: number;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  venue: Venue;
  startTime: number; // Unix timestamp
  endTime: number; // Unix timestamp
  speakers: Speaker[];
  state: EventState;
  totalTips?: number;
  tags?: string[];
  bannerImage?: string;
  website?: string;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  radius?: number; // Venue geofence radius in meters
}

export interface EventFilter {
  search?: string;
  state?: EventState;
  tags?: string[];
  startDate?: number;
  endDate?: number;
  city?: string;
  country?: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export class EventService extends BaseService {
  private events: Event[] = [];
  private currentLocation: LocationData | null = null;
  private isLocationWatchActive = false;
  private locationWatchId: number | null = null;

  constructor() {
    super('EventService');
  }

  /**
   * Initialize the service
   */
  public async initialize(): Promise<ServiceResponse<boolean>> {
    return this.executeOperation(async () => {
      // In a full implementation, this would fetch events from an API or FilCDN
      await this.loadEvents();
      
      this.logInfo('EventService initialized successfully');
      return true;
    }, 'Failed to initialize EventService');
  }

  /**
   * Get all events
   */
  public async getEvents(filter?: EventFilter): Promise<ServiceResponse<Event[]>> {
    return this.executeOperation(async () => {
      this.logInfo('Fetching events', filter);
      
      // Apply filters
      let filteredEvents = [...this.events];
      
      if (filter) {
        if (filter.search) {
          const searchLower = filter.search.toLowerCase();
          filteredEvents = filteredEvents.filter(event => 
            event.name.toLowerCase().includes(searchLower) || 
            event.description.toLowerCase().includes(searchLower)
          );
        }
        
        if (filter.state) {
          filteredEvents = filteredEvents.filter(event => event.state === filter.state);
        }
        
        if (filter.tags && filter.tags.length > 0) {
          filteredEvents = filteredEvents.filter(event => 
            event.tags?.some(tag => filter.tags?.includes(tag))
          );
        }
        
        if (filter.startDate) {
          filteredEvents = filteredEvents.filter(event => event.startTime >= filter.startDate!);
        }
        
        if (filter.endDate) {
          filteredEvents = filteredEvents.filter(event => event.endTime <= filter.endDate!);
        }
        
        if (filter.city) {
          filteredEvents = filteredEvents.filter(event => 
            event.venue.city.toLowerCase() === filter.city?.toLowerCase()
          );
        }
        
        if (filter.country) {
          filteredEvents = filteredEvents.filter(event => 
            event.venue.country.toLowerCase() === filter.country?.toLowerCase()
          );
        }
      }
      
      // Update event states based on current time
      const now = Date.now();
      filteredEvents = filteredEvents.map(event => ({
        ...event,
        state: this.calculateEventState(event.startTime, event.endTime)
      }));
      
      return filteredEvents;
    }, 'Failed to fetch events');
  }

  /**
   * Get a specific event by ID
   */
  public async getEvent(eventId: string): Promise<ServiceResponse<Event | null>> {
    return this.executeOperation(async () => {
      this.logInfo(`Fetching event with ID ${eventId}`);
      
      const event = this.events.find(e => e.id === eventId);
      
      if (!event) {
        return null;
      }
      
      // Update event state based on current time
      return {
        ...event,
        state: this.calculateEventState(event.startTime, event.endTime)
      };
    }, `Failed to fetch event with ID ${eventId}`);
  }

  /**
   * Get speakers for a specific event
   */
  public async getEventSpeakers(eventId: string): Promise<ServiceResponse<Speaker[]>> {
    return this.executeOperation(async () => {
      this.logInfo(`Fetching speakers for event with ID ${eventId}`);
      
      const event = this.events.find(e => e.id === eventId);
      
      if (!event) {
        return [];
      }
      
      return event.speakers;
    }, `Failed to fetch speakers for event with ID ${eventId}`);
  }

  /**
   * Start GPS-based venue detection
   */
  public async startLocationWatch(): Promise<ServiceResponse<boolean>> {
    if (this.isLocationWatchActive) {
      return this.success(true);
    }

    return this.executeOperation(async () => {
      this.logInfo('Starting location watch');
      
      // Check if geolocation is available
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }
      
      // Start watching position
      this.locationWatchId = navigator.geolocation.watchPosition(
        (position) => {
          this.currentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          
          this.logInfo('Location updated', this.currentLocation);
          this.checkNearbyEvents();
        },
        (error) => {
          this.logError('Error getting location', error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 30000, // 30 seconds
          timeout: 27000 // 27 seconds
        }
      );
      
      this.isLocationWatchActive = true;
      return true;
    }, 'Failed to start location watch');
  }

  /**
   * Stop GPS-based venue detection
   */
  public async stopLocationWatch(): Promise<ServiceResponse<boolean>> {
    return this.executeOperation(async () => {
      this.logInfo('Stopping location watch');
      
      if (this.locationWatchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(this.locationWatchId);
        this.locationWatchId = null;
        this.isLocationWatchActive = false;
      }
      
      return true;
    }, 'Failed to stop location watch');
  }

  /**
   * Check if user is at a specific venue
   */
  public async checkUserAtVenue(venueId: string): Promise<ServiceResponse<boolean>> {
    return this.executeOperation(async () => {
      this.logInfo(`Checking if user is at venue ${venueId}`);
      
      if (!this.currentLocation) {
        return false;
      }
      
      const venue = this.events
        .map(event => event.venue)
        .find(venue => venue.id === venueId);
      
      if (!venue) {
        return false;
      }
      
      // Calculate distance between user and venue
      const distance = this.calculateDistance(
        this.currentLocation.latitude,
        this.currentLocation.longitude,
        venue.coordinates.latitude,
        venue.coordinates.longitude
      );
      
      // Check if user is within venue radius
      const radius = venue.radius || 100; // Default 100 meters
      return distance <= radius;
    }, `Failed to check if user is at venue ${venueId}`);
  }

  /**
   * Get nearby events based on user's current location
   */
  public async getNearbyEvents(radiusKm: number = 1): Promise<ServiceResponse<Event[]>> {
    return this.executeOperation(async () => {
      this.logInfo(`Finding events within ${radiusKm}km`);
      
      if (!this.currentLocation) {
        return [];
      }
      
      const nearbyEvents = this.events.filter(event => {
        const distance = this.calculateDistance(
          this.currentLocation!.latitude,
          this.currentLocation!.longitude,
          event.venue.coordinates.latitude,
          event.venue.coordinates.longitude
        );
        
        // Convert meters to kilometers
        return distance / 1000 <= radiusKm;
      });
      
      return nearbyEvents;
    }, `Failed to find nearby events`);
  }

  /**
   * Load events from storage or API
   * This is a placeholder that would be replaced with actual implementation
   */
  private async loadEvents(): Promise<void> {
    // In a real implementation, this would fetch from an API or FilCDN
    // For now, we'll use mock data
    this.events = [
      {
        id: 'eth-denver-2025',
        name: 'ETH Denver 2025',
        description: 'The premier Ethereum event in Denver',
        venue: {
          id: 'denver-convention-center',
          name: 'Denver Convention Center',
          address: '700 14th St',
          city: 'Denver',
          country: 'USA',
          coordinates: {
            latitude: 39.7435,
            longitude: -104.9951
          },
          radius: 200 // 200 meters
        },
        startTime: Date.now() - 86400000, // Yesterday
        endTime: Date.now() + 86400000, // Tomorrow
        speakers: [
          {
            id: 'vitalik-buterin',
            name: 'Vitalik Buterin',
            walletAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
            title: 'Ethereum Founder',
            bio: 'Creator of Ethereum',
            avatar: 'https://example.com/vitalik.jpg',
            currentTalk: 'The Future of Ethereum'
          },
          {
            id: 'juan-benet',
            name: 'Juan Benet',
            walletAddress: '0x5a7Ed99f38d4F8Df5a6182D56594A1C64d970983',
            title: 'Protocol Labs Founder',
            bio: 'Creator of IPFS and Filecoin',
            avatar: 'https://example.com/juan.jpg'
          }
        ],
        state: EventState.LIVE,
        tags: ['ethereum', 'web3', 'defi']
      },
      {
        id: 'devcon-2025',
        name: 'Devcon 2025',
        description: 'The annual Ethereum developer conference',
        venue: {
          id: 'bogota-convention-center',
          name: 'Bogotá Convention Center',
          address: 'Carrera 40 # 22A-68',
          city: 'Bogotá',
          country: 'Colombia',
          coordinates: {
            latitude: 4.6486,
            longitude: -74.0932
          },
          radius: 150 // 150 meters
        },
        startTime: Date.now() + 7776000000, // 90 days from now
        endTime: Date.now() + 7948800000, // 92 days from now
        speakers: [
          {
            id: 'vitalik-buterin',
            name: 'Vitalik Buterin',
            walletAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
            title: 'Ethereum Founder',
            bio: 'Creator of Ethereum',
            avatar: 'https://example.com/vitalik.jpg'
          }
        ],
        state: EventState.UPCOMING,
        tags: ['ethereum', 'web3', 'developers']
      }
    ];
  }

  /**
   * Calculate event state based on start and end times
   */
  private calculateEventState(startTime: number, endTime: number): EventState {
    const now = Date.now();
    
    if (now < startTime) {
      return EventState.UPCOMING;
    } else if (now > endTime) {
      return EventState.ENDED;
    } else {
      return EventState.LIVE;
    }
  }

  /**
   * Calculate distance between two coordinates using the Haversine formula
   * @returns Distance in meters
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Check for nearby events and emit notifications
   */
  private checkNearbyEvents(): void {
    if (!this.currentLocation) return;
    
    this.getNearbyEvents()
      .then(response => {
        if (response.success && response.data && response.data.length > 0) {
          this.logInfo(`Found ${response.data.length} nearby events`);
          // In a full implementation, this would emit an event or callback
          // For now, we'll just log
        }
      })
      .catch(err => {
        this.logError('Error checking nearby events', err);
      });
  }
}

export default new EventService();