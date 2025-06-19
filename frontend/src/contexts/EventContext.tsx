import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { api } from '../services/api';
import realtimeService from '../services/realtimeService';
import { mockDataService, MOCK_EVENTS, MOCK_SPEAKERS } from '../services/mockDataService';

// Types
interface Speaker {
  id: string;
  name: string;
  title?: string;
  avatar?: string;
  walletAddress?: string;
  currentTalk?: string;
  todayEarnings?: number;
  tipCount?: number;
  reputation?: number;
  isActive?: boolean;
}

interface Event {
  id: string;
  name: string;
  venue: string;
  date: string;
  status: 'upcoming' | 'live' | 'ended';
  speakers: Speaker[];
  totalTips: number;
  totalBounties: number;
  attendeeCount: number;
  description?: string;
}

interface Tip {
  id: string;
  eventId: string;
  speakerId: string;
  tipper: {
    username: string;
    avatar?: string;
    walletAddress: string;
  };
  recipient: {
    username: string;
    avatar?: string;
    walletAddress: string;
  };
  amount: number;
  message?: string;
  timestamp: string;
  txHash?: string;
  status: 'pending' | 'confirmed' | 'failed';
}

interface Bounty {
  id: string;
  eventId: string;
  speakerId: string;
  sponsor: {
    username: string;
    avatar?: string;
    walletAddress: string;
  };
  description: string;
  reward: number;
  deadline: string;
  status: 'active' | 'claimed' | 'expired';
  submissions: BountySubmission[];
  txHash?: string;
  createdAt: string;
}

interface BountySubmission {
  id: string;
  bountyId: string;
  creator: {
    username: string;
    avatar?: string;
    walletAddress: string;
  };
  contentUrl: string;
  description: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface LiveStats {
  totalTips: number;
  totalBounties: number;
  activeTippers: number;
  tipsPerMinute: number;
  totalEarnings: number;
  topSpeaker?: Speaker;
}

interface EventState {
  // Current event data
  currentEvent: Event | null;
  speakers: Speaker[];

  // Live data streams
  recentTips: Tip[];
  activeBounties: Bounty[];
  liveStats: LiveStats;

  // UI state
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;

  // Selected states
  selectedSpeaker: Speaker | null;
  showTipModal: boolean;
  showBountyModal: boolean;

  // Real-time updates
  lastUpdate: string | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
}

type EventAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_EVENT'; payload: Event }
  | { type: 'SET_SPEAKERS'; payload: Speaker[] }
  | { type: 'UPDATE_SPEAKER'; payload: Speaker }
  | { type: 'SET_TIPS'; payload: Tip[] }
  | { type: 'ADD_TIP'; payload: Tip }
  | { type: 'UPDATE_TIP'; payload: Partial<Tip> & { id: string } }
  | { type: 'SET_BOUNTIES'; payload: Bounty[] }
  | { type: 'ADD_BOUNTY'; payload: Bounty }
  | { type: 'UPDATE_BOUNTY'; payload: Partial<Bounty> & { id: string } }
  | { type: 'SET_LIVE_STATS'; payload: LiveStats }
  | { type: 'SET_SELECTED_SPEAKER'; payload: Speaker | null }
  | { type: 'SET_SHOW_TIP_MODAL'; payload: boolean }
  | { type: 'SET_SHOW_BOUNTY_MODAL'; payload: boolean }
  | { type: 'SET_CONNECTION_STATUS'; payload: 'connecting' | 'connected' | 'disconnected' }
  | { type: 'SET_LAST_UPDATE'; payload: string };

// Initial state
const initialState: EventState = {
  currentEvent: null,
  speakers: [],
  recentTips: [],
  activeBounties: [],
  liveStats: {
    totalTips: 0,
    totalBounties: 0,
    activeTippers: 0,
    tipsPerMinute: 0,
    totalEarnings: 0,
  },
  isLoading: false,
  error: null,
  isConnected: false,
  selectedSpeaker: null,
  showTipModal: false,
  showBountyModal: false,
  lastUpdate: null,
  connectionStatus: 'disconnected',
};

// Reducer
function eventReducer(state: EventState, action: EventAction): EventState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'SET_EVENT':
      return {
        ...state,
        currentEvent: action.payload,
        isLoading: false,
        error: null
      };

    case 'SET_SPEAKERS':
      return { ...state, speakers: action.payload };

    case 'UPDATE_SPEAKER':
      return {
        ...state,
        speakers: state.speakers.map(speaker =>
          speaker.id === action.payload.id
            ? { ...speaker, ...action.payload }
            : speaker
        ),
      };

    case 'SET_TIPS':
      return { ...state, recentTips: action.payload };

    case 'ADD_TIP':
      return {
        ...state,
        recentTips: [action.payload, ...state.recentTips.slice(0, 49)], // Keep last 50
        lastUpdate: new Date().toISOString(),
      };

    case 'UPDATE_TIP':
      return {
        ...state,
        recentTips: state.recentTips.map(tip =>
          tip.id === action.payload.id
            ? { ...tip, ...action.payload }
            : tip
        ),
      };

    case 'SET_BOUNTIES':
      return { ...state, activeBounties: action.payload };

    case 'ADD_BOUNTY':
      return {
        ...state,
        activeBounties: [action.payload, ...state.activeBounties],
        lastUpdate: new Date().toISOString(),
      };

    case 'UPDATE_BOUNTY':
      return {
        ...state,
        activeBounties: state.activeBounties.map(bounty =>
          bounty.id === action.payload.id
            ? { ...bounty, ...action.payload }
            : bounty
        ),
      };

    case 'SET_LIVE_STATS':
      return { ...state, liveStats: action.payload };

    case 'SET_SELECTED_SPEAKER':
      return { ...state, selectedSpeaker: action.payload };

    case 'SET_SHOW_TIP_MODAL':
      return { ...state, showTipModal: action.payload };

    case 'SET_SHOW_BOUNTY_MODAL':
      return { ...state, showBountyModal: action.payload };

    case 'SET_CONNECTION_STATUS':
      return {
        ...state,
        connectionStatus: action.payload,
        isConnected: action.payload === 'connected'
      };

    case 'SET_LAST_UPDATE':
      return { ...state, lastUpdate: action.payload };

    default:
      return state;
  }
}

// Context
interface EventContextType extends EventState {
  // Actions
  loadEvent: (eventId: string) => Promise<void>;
  refreshData: () => Promise<void>;

  // Speaker actions
  selectSpeaker: (speaker: Speaker) => void;
  updateSpeakerStats: (speakerId: string, stats: Partial<Speaker>) => void;

  // Tip actions
  openTipModal: (speaker: Speaker) => void;
  closeTipModal: () => void;
  addTip: (tip: Omit<Tip, 'id' | 'timestamp'>) => void;
  updateTipStatus: (tipId: string, status: Tip['status'], txHash?: string) => void;

  // Bounty actions
  openBountyModal: (speaker: Speaker) => void;
  closeBountyModal: () => void;
  addBounty: (bounty: Omit<Bounty, 'id' | 'createdAt'>) => void;
  updateBountyStatus: (bountyId: string, status: Bounty['status']) => void;

  // Real-time connection
  connectToEvent: (eventId: string) => void;
  disconnectFromEvent: () => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

// Provider component
interface EventProviderProps {
  children: ReactNode;
}

export const EventProvider: React.FC<EventProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(eventReducer, initialState);

  // Load event data with immediate fallback to mock data in development
  const loadEvent = useCallback(async (eventId: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      // Fetch event list from backend
      const eventListRes = await api.get('/api/events/list');
      const events = eventListRes.data.events;
      let event = events.find((e: any) => e._id === eventId) || events[0];
      if (!event) throw new Error('No events found');
      // Optionally fetch full event details if available
      // const eventDetailsRes = await api.get(`/api/events/${event._id}`);
      // event = eventDetailsRes.data.event;
      dispatch({ type: 'SET_EVENT', payload: { ...event, id: event._id } });
      // TODO: Fetch speakers and bounties from backend if endpoints exist
      dispatch({ type: 'SET_SPEAKERS', payload: [] }); // Placeholder
      dispatch({ type: 'SET_BOUNTIES', payload: [] }); // Placeholder
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      console.error('Failed to load event from backend:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load event data' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Refresh all data
  const refreshData = useCallback(async (): Promise<void> => {
    if (!state.currentEvent) return;
    await loadEvent(state.currentEvent.id);
  }, [state.currentEvent?.id, loadEvent]);

  // Speaker actions
  const selectSpeaker = (speaker: Speaker): void => {
    dispatch({ type: 'SET_SELECTED_SPEAKER', payload: speaker });
  };

  const updateSpeakerStats = (speakerId: string, stats: Partial<Speaker>): void => {
    // Ensure 'name' is always present for Speaker type
    const speaker = state.speakers.find(s => s.id === speakerId);
    if (!speaker) return;
    dispatch({
      type: 'UPDATE_SPEAKER',
      payload: { ...speaker, ...stats },
    });
  };

  // Tip actions
  const openTipModal = (speaker: Speaker): void => {
    dispatch({ type: 'SET_SELECTED_SPEAKER', payload: speaker });
    dispatch({ type: 'SET_SHOW_TIP_MODAL', payload: true });
  };

  const closeTipModal = (): void => {
    dispatch({ type: 'SET_SHOW_TIP_MODAL', payload: false });
  };

  const addTip = (tipData: Omit<Tip, 'id' | 'timestamp'>): void => {
    const tip: Tip = {
      ...tipData,
      id: `tip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_TIP', payload: tip });

    // Update speaker stats
    const speaker = state.speakers.find(s => s.id === tip.speakerId);
    if (speaker) {
      updateSpeakerStats(tip.speakerId, {
        todayEarnings: (speaker.todayEarnings || 0) + tip.amount,
        tipCount: (speaker.tipCount || 0) + 1,
      });
    }

    // Update live stats
    dispatch({
      type: 'SET_LIVE_STATS',
      payload: {
        ...state.liveStats,
        totalTips: state.liveStats.totalTips + 1,
        totalEarnings: state.liveStats.totalEarnings + tip.amount,
        activeTippers: Math.min(state.liveStats.activeTippers + 1, 999),
      },
    });
  };

  const updateTipStatus = (tipId: string, status: Tip['status'], txHash?: string): void => {
    const updates: Partial<Tip> = { id: tipId, status };
    if (txHash) updates.txHash = txHash;
    // Ensure 'id' is always present for UPDATE_TIP
    if (!updates.id) return;
    dispatch({ type: 'UPDATE_TIP', payload: updates as Partial<Tip> & { id: string } });
  };

  // Bounty actions
  const openBountyModal = (speaker: Speaker): void => {
    dispatch({ type: 'SET_SELECTED_SPEAKER', payload: speaker });
    dispatch({ type: 'SET_SHOW_BOUNTY_MODAL', payload: true });
  };

  const closeBountyModal = (): void => {
    dispatch({ type: 'SET_SHOW_BOUNTY_MODAL', payload: false });
  };

  const addBounty = (bountyData: Omit<Bounty, 'id' | 'createdAt'>): void => {
    const bounty: Bounty = {
      ...bountyData,
      id: `bounty_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      submissions: [],
    };
    dispatch({ type: 'ADD_BOUNTY', payload: bounty });

    // Update live stats
    dispatch({
      type: 'SET_LIVE_STATS',
      payload: {
        ...state.liveStats,
        totalBounties: state.liveStats.totalBounties + 1,
      },
    });
  };

  const updateBountyStatus = (bountyId: string, status: Bounty['status']): void => {
    dispatch({ type: 'UPDATE_BOUNTY', payload: { id: bountyId, status } });
  };

  // Real-time connection management
  const connectToEvent = useCallback((eventId: string): void => {
    // Skip real-time connection - using mock data
    console.log('Mock mode: Simulating real-time connection for:', eventId);
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
  }, []);

  const disconnectFromEvent = useCallback((): void => {
    try {
      if (state.currentEvent) {
        realtimeService.leaveVenue(state.currentEvent.id);
      }
      realtimeService.disconnect();
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' });
    } catch (error) {
      console.error('Error disconnecting from event:', error);
    }
  }, [state.currentEvent?.id]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnectFromEvent();
    };
  }, []);

  // Calculate live stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.recentTips.length > 0) {
        const oneMinuteAgo = new Date(Date.now() - 60000);
        const recentTipCount = state.recentTips.filter(tip =>
          new Date(tip.timestamp) > oneMinuteAgo
        ).length;

        const topSpeaker = state.speakers.reduce((top, speaker) =>
          (speaker.todayEarnings || 0) > (top?.todayEarnings || 0) ? speaker : top
        , state.speakers[0]);

        dispatch({
          type: 'SET_LIVE_STATS',
          payload: {
            ...state.liveStats,
            tipsPerMinute: recentTipCount,
            topSpeaker,
          },
        });
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [state.recentTips.length, state.speakers.length, state.liveStats]);

  const contextValue: EventContextType = {
    ...state,
    loadEvent,
    refreshData,
    selectSpeaker,
    updateSpeakerStats,
    openTipModal,
    closeTipModal,
    addTip,
    updateTipStatus,
    openBountyModal,
    closeBountyModal,
    addBounty,
    updateBountyStatus,
    connectToEvent,
    disconnectFromEvent,
  };

  return (
    <EventContext.Provider value={contextValue}>
      {children}
    </EventContext.Provider>
  );
};

// Hook to use the EventContext
export const useEvent = (): EventContextType => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
};

export default EventContext;

// Export types for use in other components
export type {
  Speaker,
  Event,
  Tip,
  Bounty,
  BountySubmission,
  LiveStats,
  EventState,
};
