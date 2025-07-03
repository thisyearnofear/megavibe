/**
 * useEvents.ts
 * 
 * Custom hook for events functionality, providing a clean interface
 * for components to interact with event-related services.
 */

import { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, Event, AppDispatch } from '../services/core/StateService';

interface EventQueryParams {
  searchTerm?: string;
  category?: string;
  dateRange?: [Date, Date];
  location?: {
    lat: number;
    lng: number;
    radius: number;
  };
  limit?: number;
  offset?: number;
}

interface EventResult {
  success: boolean;
  data?: any;
  error?: string;
}

export const useEvents = (autoRefresh = false) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use typed dispatch for thunks
  const dispatch = useDispatch<AppDispatch>();
  
  // Get state from Redux
  const events = useSelector((state: any) => {
    if (!state.entities) return [];
    return Object.values(state.entities.events || {}) as Event[];
  });
  
  const activeEventId = useSelector((state: any) => 
    state.events?.activeEvent || null
  );
  
  const nearbyEvents = useSelector((state: any) => {
    if (!state.events?.nearbyEvents || !state.entities?.events) return [];
    return state.events.nearbyEvents
      .map((id: string) => state.entities?.events?.[id])
      .filter(Boolean) as Event[];
  });
  
  const upcomingEvents = useSelector((state: any) => {
    if (!state.events?.upcomingEvents || !state.entities?.events) return [];
    return state.events.upcomingEvents
      .map((id: string) => state.entities?.events?.[id])
      .filter(Boolean) as Event[];
  });
  
  const pastEvents = useSelector((state: any) => {
    if (!state.events?.pastEvents || !state.entities?.events) return [];
    return state.events.pastEvents
      .map((id: string) => state.entities?.events?.[id])
      .filter(Boolean) as Event[];
  });
  
  // Auto-refresh events if enabled
  useEffect(() => {
    if (autoRefresh) {
      const intervalId = setInterval(() => {
        fetchNearbyEvents();
      }, 60000); // Refresh every minute
      
      // Initial load
      fetchNearbyEvents();
      
      // Cleanup
      return () => clearInterval(intervalId);
    }
  }, [autoRefresh]);
  
  /**
   * Set active event
   */
  const setActiveEvent = useCallback((eventId: string | null) => {
    // This would normally call an EventStateService method
    // For now, we'll just log it
    console.log('Setting active event:', eventId);
    
    /* Future implementation:
    dispatch(EventStateService.setActiveEvent(eventId));
    */
  }, [dispatch]);
  
  /**
   * Fetch nearby events based on location
   */
  const fetchNearbyEvents = useCallback(async (radius: number = 10): Promise<EventResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get current location
      const getCurrentPosition = (): Promise<GeolocationPosition> => {
        return new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by this browser'));
            return;
          }
          
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          });
        });
      };
      
      // Get current position
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;
      
      // This would normally call an EventStateService method
      // For now, we'll just return mock data
      
      // Mock data for demonstration
      const mockEvents = [
        {
          id: 'event-1',
          title: 'Ethereum Developer Conference',
          description: 'A conference for Ethereum developers',
          startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          endDate: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
          venueId: 'venue-1',
          speakers: ['speaker-1', 'speaker-2'],
          categories: ['ethereum', 'development'],
          imageUrl: 'https://example.com/ethereum-conf.jpg',
          attendance: 500
        },
        {
          id: 'event-2',
          title: 'NFT Art Exhibition',
          description: 'An exhibition showcasing NFT artwork',
          startDate: new Date(Date.now() + 432000000).toISOString(), // 5 days from now
          endDate: new Date(Date.now() + 518400000).toISOString(), // 6 days from now
          venueId: 'venue-2',
          speakers: ['speaker-3'],
          categories: ['nft', 'art'],
          imageUrl: 'https://example.com/nft-exhibition.jpg',
          attendance: 300
        }
      ];
      
      /* Future implementation:
      const result = await dispatch(EventStateService.fetchNearbyEvents({
        lat: latitude,
        lng: longitude,
        radius
      }));
      
      if (!result.success) {
        const errorMsg = result.error?.message || 'Failed to fetch nearby events';
        setError(errorMsg);
        return { 
          success: false, 
          error: errorMsg 
        };
      }
      
      return { 
        success: true, 
        data: result.data 
      };
      */
      
      // For now, just return mock data
      return {
        success: true,
        data: mockEvents
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);
  
  /**
   * Search events with filters
   */
  const searchEvents = useCallback(async (params: EventQueryParams): Promise<EventResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would normally call an EventStateService method
      // For now, we'll just return filtered mock data
      
      // Filter existing events based on search criteria
      const filteredEvents = events.filter(event => {
        // Filter by search term
        if (params.searchTerm && !event.title.toLowerCase().includes(params.searchTerm.toLowerCase())) {
          return false;
        }
        
        // Filter by category
        if (params.category && !event.categories.includes(params.category)) {
          return false;
        }
        
        // Filter by date range
        if (params.dateRange) {
          const eventStart = new Date(event.startDate);
          const [start, end] = params.dateRange;
          
          if (eventStart < start || eventStart > end) {
            return false;
          }
        }
        
        return true;
      });
      
      return {
        success: true,
        data: filteredEvents
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setIsLoading(false);
    }
  }, [events, dispatch]);
  
  /**
   * Get event details by ID
   */
  const getEventById = useCallback(async (eventId: string): Promise<EventResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if event exists in Redux store
      const event = events.find(e => e.id === eventId);
      
      if (event) {
        return {
          success: true,
          data: event
        };
      }
      
      // If not in store, this would normally call an EventStateService method
      // For now, we'll just return an error
      
      setError(`Event with ID ${eventId} not found`);
      return {
        success: false,
        error: `Event with ID ${eventId} not found`
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setIsLoading(false);
    }
  }, [events, dispatch]);
  
  /**
   * Register for an event
   */
  const registerForEvent = useCallback(async (eventId: string): Promise<EventResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would normally call an EventStateService method
      // For now, we'll just log it
      console.log('Registering for event:', eventId);
      
      /* Future implementation:
      const result = await dispatch(EventStateService.registerForEvent(eventId));
      
      if (!result.success) {
        const errorMsg = result.error?.message || 'Failed to register for event';
        setError(errorMsg);
        return { 
          success: false, 
          error: errorMsg 
        };
      }
      
      return { 
        success: true, 
        data: result.data 
      };
      */
      
      // For now, just return success
      return {
        success: true,
        data: { eventId, registered: true }
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);
  
  /**
   * Get active event
   */
  const getActiveEvent = useCallback((): Event | null => {
    if (!activeEventId) return null;
    
    return events.find(event => event.id === activeEventId) || null;
  }, [events, activeEventId]);
  
  return {
    // State
    isLoading,
    error,
    events,
    nearbyEvents,
    upcomingEvents,
    pastEvents,
    activeEventId,
    
    // Actions
    setActiveEvent,
    fetchNearbyEvents,
    searchEvents,
    getEventById,
    registerForEvent,
    
    // Helpers
    getActiveEvent,
    hasEvents: events.length > 0,
    hasNearbyEvents: nearbyEvents.length > 0
  };
};

export default useEvents;