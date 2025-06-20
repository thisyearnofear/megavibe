import { io, Socket } from 'socket.io-client';

export interface RealtimeEvent {
  type: string;
  payload: unknown;
}

export interface SongChangeEvent {
  songId: string;
  title: string;
  artist: string;
  timestamp: string;
  eventId: string;
  venueId: string;
}

export interface TipReceivedEvent {
  amount: number;
  fromUser: string;
  songId: string;
  eventId: string;
  venueId: string;
  timestamp: string;
}

export interface AudienceReactionEvent {
  type: string;
  intensity: string;
  count: number;
  eventId: string;
  venueId: string;
  timestamp: string;
}

export interface EventStatusEvent {
  status: string;
  eventId: string;
  venueId: string;
  timestamp: string;
}

class RealtimeService {
  private socket: Socket | null = null;
  private listeners: Map<string, ((data: unknown) => void)[]> = new Map();

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket(): void {
    const wsUrl = process.env.VITE_WS_URL || 'https://megavibe.onrender.com';
    this.socket = io(wsUrl, {
      autoConnect: false,
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      // Rejoin any previously joined venues or events
      const lastVenueId = localStorage.getItem('last_venue_id');
      if (lastVenueId) {
        this.joinVenue(lastVenueId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('error', (error: unknown) => {
      console.error('WebSocket error:', error);
    });

    // Generic event handler to dispatch to listeners
    this.socket.onAny((event: string, data: unknown) => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.forEach(listener => listener(data));
      }
    });
  }

  connect(): void {
    if (this.socket && !this.socket.connected) {
      this.socket.connect();
    }
  }

  disconnect(): void {
    if (this.socket && this.socket.connected) {
      this.socket.disconnect();
    }
  }

  joinVenue(venueId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('join_venue', venueId);
      localStorage.setItem('last_venue_id', venueId);
      console.log(`Joined venue: ${venueId}`);
    } else {
      console.warn('Cannot join venue: WebSocket not connected');
      // Store for reconnection
      localStorage.setItem('last_venue_id', venueId);
    }
  }

  leaveVenue(venueId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave_venue', venueId);
      localStorage.removeItem('last_venue_id');
      console.log(`Left venue: ${venueId}`);
    }
  }

  // Subscribe to specific event types
  on(event: string, callback: (data: unknown) => void): () => void {
    return this.addListener(event, callback);
  }

  off(event: string, callback: (data: unknown) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index !== -1) {
        eventListeners.splice(index, 1);
        this.listeners.set(event, eventListeners);
      }
    }
  }

  onSongChanged(callback: (data: SongChangeEvent) => void): () => void {
    return this.addListener('song_changed', callback);
  }

  onTipReceived(callback: (data: TipReceivedEvent) => void): () => void {
    return this.addListener('tip_received', callback);
  }

  onAudienceReaction(callback: (data: AudienceReactionEvent) => void): () => void {
    return this.addListener('audience_reaction', callback);
  }

  onEventStatus(callback: (data: EventStatusEvent) => void): () => void {
    return this.addListener('event_status', callback);
  }

  private addListener<T>(event: string, callback: (data: T) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.push(callback as (data: unknown) => void);
      this.listeners.set(event, listeners);
    }

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        const index = eventListeners.indexOf(callback as (data: unknown) => void);
        if (index !== -1) {
          eventListeners.splice(index, 1);
          this.listeners.set(event, eventListeners);
        }
      }
    };
  }

  // Method to get current song for a venue
  getCurrentSong(venueId: string): Promise<SongChangeEvent | null> {
    return new Promise((resolve) => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('get_current_song', venueId, (response: SongChangeEvent | null) => {
          resolve(response);
        });
      } else {
        console.warn('Cannot get current song: WebSocket not connected');
        resolve(null);
      }
    });
  }

  // Check connection status
  isConnected(): boolean {
    return this.socket ? this.socket.connected : false;
  }
}

// Singleton instance
const realtimeService = new RealtimeService();
export default realtimeService;
