import { io, Socket } from 'socket.io-client';

// Define a more structured event type for clarity
export interface RealtimeEvent<T> {
  type: string;
  payload: T;
}

// Specific event payload types
export interface SongChangeEvent {
  songId: string;
  title: string;
  artist: string;
  timestamp: string;
  eventId: string;
  venueId: string;
}

export interface TipReceivedEvent {
  id: string;
  tipper: {
    username: string;
    avatar?: string;
  };
  recipient: {
    username: string;
  };
  amount: number;
  message?: string;
  timestamp: string;
  txHash?: string;
  eventId: string;
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

// Backend message structure
interface WebSocketMessage {
  type: string;
  data: any;
  // Other fields if any, like timestamp
}

class RealtimeService {
  private socket: Socket | null = null;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();

  constructor() {
    // The initialization is deferred to the connect method
  }

  private initializeSocket(): void {
    if (this.socket) return;

    const wsUrl = import.meta.env.VITE_API_URL || 'https://megavibe.onrender.com';
    console.log(`Initializing WebSocket connection to ${wsUrl}`);

    this.socket = io(wsUrl, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket?.id);
      this.emitToListeners('connect', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.emitToListeners('disconnect', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.emitToListeners('connect_error', error.message);
    });

    // Centralized handler for all incoming messages from the server
    this.socket.onAny((eventName: string, message: WebSocketMessage) => {
      // The backend sends the event name as the event, and the payload as the argument.
      // e.g., socket.emit('TIP_CONFIRMED', { type: 'TIP_CONFIRMED', data: ... })
      // So, we use the eventName from onAny and extract the data from the message.
      this.emitToListeners(eventName, message.data);
    });
  }

  private emitToListeners(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => listener(data));
    }
  }

  connect(): void {
    this.initializeSocket();
    if (this.socket && !this.socket.connected) {
      console.log('Attempting to connect WebSocket...');
      this.socket.connect();
    }
  }

  disconnect(): void {
    if (this.socket && this.socket.connected) {
      this.socket.disconnect();
    }
  }

  // --- Room Management ---

  joinEvent(eventId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('joinEvent', eventId);
      console.log(`Joined event room: ${eventId}`);
    } else {
      console.warn('Cannot join event room: WebSocket not connected.');
    }
  }

  leaveEvent(eventId: string): void {
    // Note: The backend doesn't have a 'leaveEvent' handler,
    // disconnection handles cleanup. This is for client-side logic.
    console.log(`Leaving event room: ${eventId}`);
  }

  // --- Event Subscription ---

  on<T>(event: string, callback: (data: T) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        const index = eventListeners.indexOf(callback);
        if (index !== -1) {
          eventListeners.splice(index, 1);
        }
      }
    };
  }

  off(event: string, callback: (data: any) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index !== -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  // --- Specific Event Subscriptions (Type-safe) ---

  onTipConfirmed(callback: (data: TipReceivedEvent) => void): () => void {
    return this.on('TIP_CONFIRMED', callback);
  }

  // --- Connection Status ---

  isConnected(): boolean {
    return this.socket ? this.socket.connected : false;
  }
}

// Singleton instance
const realtimeService = new RealtimeService();
export default realtimeService;
