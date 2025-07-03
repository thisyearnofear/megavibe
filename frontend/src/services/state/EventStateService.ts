/**
 * EventStateService.ts
 * 
 * Service for managing event-related state using Redux,
 * integrating the core EventService with state management.
 */

import EventServiceInstance, { 
  Event as CoreEvent,
  EventState,
  EventFilter
} from '../core/EventService';
import StateService, { 
  AppThunk, 
  Event as StateEvent, 
  RootState, 
  EventsState 
} from '../core/StateService';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { BaseService, ServiceResponse, ErrorCode } from '../core/BaseService';

// Initial events state
const initialState: EventsState = {
  activeEvent: null,
  nearbyEvents: [],
  upcomingEvents: [],
  pastEvents: [],
  isLoadingEvents: false,
  filters: {}
};

/**
 * Convert core Event type to state Event type
 */
function convertCoreEventToStateEvent(coreEvent: CoreEvent): StateEvent {
  return {
    id: coreEvent.id,
    title: coreEvent.name,
    description: coreEvent.description,
    startDate: coreEvent.startTime.toString(),
    endDate: coreEvent.endTime.toString(),
    venueId: coreEvent.venue.id,
    speakers: coreEvent.speakers.map(s => s.id),
    categories: coreEvent.tags || [],
    imageUrl: coreEvent.bannerImage,
    attendance: 0 // Default value, would be updated from actual data
  };
}

class EventStateServiceClass extends BaseService {
  private eventService: typeof EventServiceInstance;
  private slice: ReturnType<typeof createSlice>;

  constructor() {
    super('EventStateService');
    
    // Use the singleton instance of EventService
    this.eventService = EventServiceInstance;
    
    // Register the events slice
    this.slice = StateService.registerSlice({
      name: 'events',
      initialState,
      reducers: {
        // Active event management
        setActiveEvent: (state, action: PayloadAction<string | null>) => {
          state.activeEvent = action.payload;
        },
        
        // Nearby events management
        setNearbyEvents: (state, action: PayloadAction<string[]>) => {
          state.nearbyEvents = action.payload;
        },
        addNearbyEvent: (state, action: PayloadAction<string>) => {
          if (!state.nearbyEvents.includes(action.payload)) {
            state.nearbyEvents.push(action.payload);
          }
        },
        
        // Upcoming events management
        setUpcomingEvents: (state, action: PayloadAction<string[]>) => {
          state.upcomingEvents = action.payload;
        },
        addUpcomingEvent: (state, action: PayloadAction<string>) => {
          if (!state.upcomingEvents.includes(action.payload)) {
            state.upcomingEvents.push(action.payload);
          }
        },
        
        // Past events management
        setPastEvents: (state, action: PayloadAction<string[]>) => {
          state.pastEvents = action.payload;
        },
        addPastEvent: (state, action: PayloadAction<string>) => {
          if (!state.pastEvents.includes(action.payload)) {
            state.pastEvents.push(action.payload);
          }
        },
        
        // Loading state
        setLoading: (state, action: PayloadAction<boolean>) => {
          state.isLoadingEvents = action.payload;
        },
        
        // Filters management
        setFilters: (state, action: PayloadAction<Partial<EventsState['filters']>>) => {
          state.filters = { ...state.filters, ...action.payload };
        },
        clearFilters: (state) => {
          state.filters = {};
        },
        
        // Reset state
        resetState: (state) => {
          Object.assign(state, initialState);
        }
      },
      // Persist events data
      persist: {
        enabled: true,
        whitelist: ['activeEvent', 'upcomingEvents', 'pastEvents']
      }
    });
    
    this.logInfo('EventStateService initialized');
  }

  /**
   * Get actions from the slice
   */
  public get actions() {
    return this.slice.actions;
  }

  /**
   * Set the active event
   */
  public setActiveEvent = (eventId: string | null): AppThunk<ServiceResponse<boolean>> => {
    return async (dispatch) => {
      try {
        dispatch(this.actions.setActiveEvent(eventId));
        
        return {
          success: true,
          data: true,
          timestamp: Date.now()
        };
      } catch (error) {
        this.logError('Failed to set active event', error);
        
        return {
          success: false,
          error: {
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Failed to set active event',
            details: { error }
          },
          timestamp: Date.now()
        };
      }
    };
  };

  /**
   * Fetch nearby events based on location
   */
  public fetchNearbyEvents = (
    radius: number = 1
  ): AppThunk<ServiceResponse<StateEvent[]>> => {
    return async (dispatch, getState) => {
      dispatch(this.actions.setLoading(true));
      
      try {
        // Call EventService to get nearby events
        const result = await this.eventService.getNearbyEvents(radius);
        
        if (!result.success) {
          dispatch(this.actions.setLoading(false));
          return {
            success: false,
            error: result.error,
            timestamp: Date.now()
          };
        }
        
        const coreEvents = result.data || [];
        
        // Convert to state event format
        const stateEvents = coreEvents.map(convertCoreEventToStateEvent);
        
        // Add events to entities store
        stateEvents.forEach(event => {
          dispatch({
            type: 'entities/addEntity',
            payload: {
              entityType: 'events',
              entity: event
            }
          });
        });
        
        // Update nearbyEvents list with event IDs
        dispatch(this.actions.setNearbyEvents(stateEvents.map(event => event.id)));
        
        // Update upcoming and past events lists
        const now = new Date();
        
        const upcomingEventIds = stateEvents
          .filter(event => new Date(event.startDate) > now)
          .map(event => event.id);
          
        const pastEventIds = stateEvents
          .filter(event => new Date(event.endDate) < now)
          .map(event => event.id);
        
        dispatch(this.actions.setUpcomingEvents(upcomingEventIds));
        dispatch(this.actions.setPastEvents(pastEventIds));
        
        dispatch(this.actions.setLoading(false));
        
        return {
          success: true,
          data: stateEvents,
          timestamp: Date.now()
        };
      } catch (error) {
        dispatch(this.actions.setLoading(false));
        this.logError('Failed to fetch nearby events', error);
        
        return {
          success: false,
          error: {
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Failed to fetch nearby events',
            details: { error }
          },
          timestamp: Date.now()
        };
      }
    };
  };

  /**
   * Get event by ID
   */
  public getEventById = (eventId: string): AppThunk<ServiceResponse<StateEvent | null>> => {
    return async (dispatch, getState) => {
      try {
        // Check if event exists in entities
        const state = getState() as any;
        const event = state.entities?.events?.[eventId];
        
        if (event) {
          return {
            success: true,
            data: event,
            timestamp: Date.now()
          };
        }
        
        // If not found, fetch from EventService
        const result = await this.eventService.getEvent(eventId);
        
        if (!result.success) {
          return {
            success: false,
            error: result.error,
            timestamp: Date.now()
          };
        }
        
        const fetchedEvent = result.data;
        
        if (fetchedEvent) {
          // Convert core event to state event
          const stateEvent = convertCoreEventToStateEvent(fetchedEvent);
          
          // Add event to entities
          dispatch({
            type: 'entities/addEntity',
            payload: {
              entityType: 'events',
              entity: stateEvent
            }
          });
          
          return {
            success: true,
            data: stateEvent,
            timestamp: Date.now()
          };
        }
        
        return {
          success: true,
          data: null,
          timestamp: Date.now()
        };
      } catch (error) {
        this.logError('Failed to get event by ID', error);
        
        return {
          success: false,
          error: {
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Failed to get event by ID',
            details: { error }
          },
          timestamp: Date.now()
        };
      }
    };
  };

  /**
   * Search events with filters
   */
  public searchEvents = (
    filters: Partial<EventsState['filters']>
  ): AppThunk<ServiceResponse<StateEvent[]>> => {
    return async (dispatch, getState) => {
      dispatch(this.actions.setLoading(true));
      
      try {
        // Update filters
        dispatch(this.actions.setFilters(filters));
        
        // Convert our state filters to core EventFilter
        const eventFilter: EventFilter = {};
        
        if (filters.searchTerm) {
          eventFilter.search = filters.searchTerm;
        }
        
        if (filters.dateRange) {
          eventFilter.startDate = filters.dateRange[0].getTime();
          eventFilter.endDate = filters.dateRange[1].getTime();
        }
        
        if (filters.category) {
          eventFilter.tags = [filters.category];
        }
        
        if (filters.location) {
          // This doesn't map directly to EventFilter
          // We'd need to implement custom filtering here
        }
        
        // Call EventService to search events
        const result = await this.eventService.getEvents(eventFilter);
        
        if (!result.success) {
          dispatch(this.actions.setLoading(false));
          return {
            success: false,
            error: result.error,
            timestamp: Date.now()
          };
        }
        
        const coreEvents = result.data || [];
        
        // Convert to state event format
        const stateEvents = coreEvents.map(convertCoreEventToStateEvent);
        
        // Add events to entities store
        stateEvents.forEach(event => {
          dispatch({
            type: 'entities/addEntity',
            payload: {
              entityType: 'events',
              entity: event
            }
          });
        });
        
        dispatch(this.actions.setLoading(false));
        
        return {
          success: true,
          data: stateEvents,
          timestamp: Date.now()
        };
      } catch (error) {
        dispatch(this.actions.setLoading(false));
        this.logError('Failed to search events', error);
        
        return {
          success: false,
          error: {
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Failed to search events',
            details: { error }
          },
          timestamp: Date.now()
        };
      }
    };
  };

  /**
   * Register for an event
   * This is a mock implementation since the core service doesn't have this feature yet
   */
  public registerForEvent = (
    eventId: string
  ): AppThunk<ServiceResponse<boolean>> => {
    return async (dispatch, getState) => {
      try {
        // This is a mock implementation
        // In a real app, we would call an API to register for the event
        
        // Update the event in entities if needed
        const state = getState() as any;
        const event = state.entities?.events?.[eventId];
        
        if (event) {
          dispatch({
            type: 'entities/updateEntity',
            payload: {
              entityType: 'events',
              id: eventId,
              changes: {
                // Add registration info
                registered: true
              }
            }
          });
        }
        
        return {
          success: true,
          data: true,
          timestamp: Date.now()
        };
      } catch (error) {
        this.logError('Failed to register for event', error);
        
        return {
          success: false,
          error: {
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Failed to register for event',
            details: { error }
          },
          timestamp: Date.now()
        };
      }
    };
  };

  /**
   * Get all stored events
   */
  public getAllEvents(): StateEvent[] {
    const state = StateService.getState() as any;
    return state.entities?.events ? Object.values(state.entities.events) : [];
  }

  /**
   * Get nearby events
   */
  public getNearbyEvents(): StateEvent[] {
    const state = StateService.getState() as any;
    
    if (!state.events?.nearbyEvents || !state.entities?.events) {
      return [];
    }
    
    return state.events.nearbyEvents
      .map((id: string) => state.entities?.events?.[id])
      .filter(Boolean) as StateEvent[];
  }

  /**
   * Get upcoming events
   */
  public getUpcomingEvents(): StateEvent[] {
    const state = StateService.getState() as any;
    
    if (!state.events?.upcomingEvents || !state.entities?.events) {
      return [];
    }
    
    return state.events.upcomingEvents
      .map((id: string) => state.entities?.events?.[id])
      .filter(Boolean) as StateEvent[];
  }

  /**
   * Get past events
   */
  public getPastEvents(): StateEvent[] {
    const state = StateService.getState() as any;
    
    if (!state.events?.pastEvents || !state.entities?.events) {
      return [];
    }
    
    return state.events.pastEvents
      .map((id: string) => state.entities?.events?.[id])
      .filter(Boolean) as StateEvent[];
  }

  /**
   * Clear event filters
   */
  public clearFilters(): void {
    // Dispatch action directly using the action type
    StateService.dispatch({
      type: 'events/clearFilters'
    });
  }
}

// Export singleton instance
const EventStateService = new EventStateServiceClass();
export default EventStateService;