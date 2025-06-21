import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { ethers } from 'ethers';
import realtimeService from '../services/realtimeService';
import EventContract from '../contracts/EventContract.json';

// Types
interface Speaker {
  id: string;
  name: string;
  title?: string;
  avatar: string;
  walletAddress?: string;
  currentTalk?: string;
  todayEarnings?: number;
  tipCount?: number;
  reputation?: number;
  isActive?: boolean;
  type: 'speaker' | 'musician' | 'comedian';
  bio: string;
  socialLinks: { [key: string]: string | undefined };
  isLive?: boolean;
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
  tipper: { username: string; avatar?: string; walletAddress: string; };
  recipient: { username: string; avatar?: string; walletAddress: string; };
  amount: number;
  message?: string;
  timestamp: string;
  txHash?: string;
  status: 'pending' | 'confirmed' | 'failed';
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
  currentEvent: Event | null;
  allEvents: Event[];
  speakers: Speaker[];
  recentTips: Tip[];
  liveStats: LiveStats;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  selectedSpeaker: Speaker | null;
  showTipModal: boolean;
  showBountyModal: boolean; // Keep for opening the modal
  lastUpdate: string | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
}

type EventAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ALL_EVENTS'; payload: Event[] }
  | { type: 'SET_EVENT'; payload: Event }
  | { type: 'SET_SPEAKERS'; payload: Speaker[] }
  | { type: 'UPDATE_SPEAKER'; payload: Speaker }
  | { type: 'SET_TIPS'; payload: Tip[] }
  | { type: 'ADD_TIP'; payload: Tip }
  | { type: 'UPDATE_TIP'; payload: Partial<Tip> & { id: string } }
  | { type: 'SET_LIVE_STATS'; payload: LiveStats }
  | { type: 'SET_SELECTED_SPEAKER'; payload: Speaker | null }
  | { type: 'SET_SHOW_TIP_MODAL'; payload: boolean }
  | { type: 'SET_SHOW_BOUNTY_MODAL'; payload: boolean }
  | { type: 'SET_CONNECTION_STATUS'; payload: 'connecting' | 'connected' | 'disconnected' }
  | { type: 'SET_LAST_UPDATE'; payload: string };

const initialState: EventState = {
  currentEvent: null,
  allEvents: [],
  speakers: [],
  recentTips: [],
  liveStats: { totalTips: 0, totalBounties: 0, activeTippers: 0, tipsPerMinute: 0, totalEarnings: 0 },
  isLoading: false,
  error: null,
  isConnected: false,
  selectedSpeaker: null,
  showTipModal: false,
  showBountyModal: false,
  lastUpdate: null,
  connectionStatus: 'disconnected',
};

function eventReducer(state: EventState, action: EventAction): EventState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_ALL_EVENTS':
      return { ...state, allEvents: action.payload };
    case 'SET_EVENT':
      return { ...state, currentEvent: action.payload, isLoading: false, error: null };
    case 'SET_SPEAKERS':
      return { ...state, speakers: action.payload };
    case 'UPDATE_SPEAKER':
      return { ...state, speakers: state.speakers.map(s => s.id === action.payload.id ? { ...s, ...action.payload } : s) };
    case 'SET_TIPS':
      return { ...state, recentTips: action.payload };
    case 'ADD_TIP':
      return { ...state, recentTips: [action.payload, ...state.recentTips.slice(0, 49)], lastUpdate: new Date().toISOString() };
    case 'UPDATE_TIP':
      return { ...state, recentTips: state.recentTips.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t) };
    case 'SET_LIVE_STATS':
      return { ...state, liveStats: action.payload };
    case 'SET_SELECTED_SPEAKER':
      return { ...state, selectedSpeaker: action.payload };
    case 'SET_SHOW_TIP_MODAL':
      return { ...state, showTipModal: action.payload };
    case 'SET_SHOW_BOUNTY_MODAL':
      return { ...state, showBountyModal: action.payload };
    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.payload, isConnected: action.payload === 'connected' };
    case 'SET_LAST_UPDATE':
      return { ...state, lastUpdate: action.payload };
    default:
      return state;
  }
}

interface EventContextType extends EventState {
  loadEvent: (eventId: string) => Promise<void>;
  refreshData: () => Promise<void>;
  selectSpeaker: (speaker: Speaker) => void;
  updateSpeakerStats: (speakerId: string, stats: Partial<Speaker>) => void;
  openTipModal: (speaker: Speaker) => void;
  closeTipModal: () => void;
  openBountyModal: (speaker: Speaker) => void;
  closeBountyModal: () => void;
  connectToEvent: (eventId: string) => void;
  disconnectFromEvent: () => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

interface EventProviderProps {
  children: ReactNode;
}

export const EventProvider: React.FC<EventProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(eventReducer, initialState);

  const fetchAllEventsFromContract = async (): Promise<Event[]> => {
    const rpcUrl = "https://rpc.sepolia.mantle.xyz";
    const contractAddress = "0x3332Af8198A2b7382153f0F21f94216540c98598";
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, EventContract.abi, provider);
    const allEventsData = await contract.getAllEvents();
    return allEventsData.map((eventData: any): Event => ({
      id: eventData.id.toString(),
      name: eventData.name,
      description: eventData.description,
      date: new Date(Number(eventData.date) * 1000).toLocaleDateString(),
      venue: eventData.venue,
      speakers: [],
      status: eventData.isActive ? 'live' : 'ended',
      totalTips: 0,
      totalBounties: 0,
      attendeeCount: 0,
    }));
  };

  const loadEvent = useCallback(async (eventId: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const allEvents = await fetchAllEventsFromContract();
      dispatch({ type: 'SET_ALL_EVENTS', payload: allEvents });
      const currentEvent = allEvents.find(e => e.id === eventId) || allEvents[0] || null;
      if (currentEvent) {
        dispatch({ type: 'SET_EVENT', payload: currentEvent });
        // In a real app, you'd fetch speakers for the event.
        // dispatch({ type: 'SET_SPEAKERS', payload: MOCK_SPEAKERS });
      }
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      console.error('Failed to load events from contract:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load event data' });
    }
  }, []);

  const refreshData = useCallback(async (): Promise<void> => {
    if (!state.currentEvent) return;
    await loadEvent(state.currentEvent.id);
  }, [state.currentEvent?.id, loadEvent]);

  const selectSpeaker = (speaker: Speaker): void => dispatch({ type: 'SET_SELECTED_SPEAKER', payload: speaker });
  const updateSpeakerStats = (speakerId: string, stats: Partial<Speaker>): void => {
    const speaker = state.speakers.find(s => s.id === speakerId);
    if (speaker) dispatch({ type: 'UPDATE_SPEAKER', payload: { ...speaker, ...stats } });
  };
  const openTipModal = (speaker: Speaker): void => {
    dispatch({ type: 'SET_SELECTED_SPEAKER', payload: speaker });
    dispatch({ type: 'SET_SHOW_TIP_MODAL', payload: true });
  };
  const closeTipModal = (): void => dispatch({ type: 'SET_SHOW_TIP_MODAL', payload: false });
  const openBountyModal = (speaker: Speaker): void => {
    dispatch({ type: 'SET_SELECTED_SPEAKER', payload: speaker });
    dispatch({ type: 'SET_SHOW_BOUNTY_MODAL', payload: true });
  };
  const closeBountyModal = (): void => dispatch({ type: 'SET_SHOW_BOUNTY_MODAL', payload: false });
  const connectToEvent = useCallback((eventId: string): void => {
    console.log('Mock mode: Simulating real-time connection for:', eventId);
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
  }, []);
  const disconnectFromEvent = useCallback((): void => {
    if (state.currentEvent) realtimeService.leaveEvent(state.currentEvent.id);
    realtimeService.disconnect();
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' });
  }, [state.currentEvent?.id]);

  useEffect(() => {
    return () => { disconnectFromEvent(); };
  }, [disconnectFromEvent]);

  const contextValue: EventContextType = {
    ...state,
    loadEvent,
    refreshData,
    selectSpeaker,
    updateSpeakerStats,
    openTipModal,
    closeTipModal,
    openBountyModal,
    closeBountyModal,
    connectToEvent,
    disconnectFromEvent,
  };

  return (
    <EventContext.Provider value={contextValue}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvent = (): EventContextType => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
};

export default EventContext;
export type { Speaker, Event, Tip, LiveStats };
