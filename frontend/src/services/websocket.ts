// Enhanced WebSocket client service with automatic reconnection and proper error handling

import React from 'react';
import { env } from '../config/environment';

// Types
interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: string;
  connectionId?: string;
}

interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  userId?: string;
  venueId?: string;
  eventId?: string;
}

interface WebSocketEventHandlers {
  onOpen?: (event: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (error: Event) => void;
  onReconnect?: (attempt: number) => void;
  onReconnectFailed?: () => void;
}

// Message types (should match backend)
export const MESSAGE_TYPES = {
  // System messages
  CONNECTION_ESTABLISHED: 'CONNECTION_ESTABLISHED',
  HEARTBEAT: 'HEARTBEAT',
  PONG: 'PONG',
  ERROR: 'ERROR',
  
  // Application messages
  TIP_CONFIRMED: 'TIP_CONFIRMED',
  TIP_ACKNOWLEDGED: 'TIP_ACKNOWLEDGED',
  BOUNTY_CREATED: 'BOUNTY_CREATED',
  BOUNTY_CLAIMED: 'BOUNTY_CLAIMED',
  BOUNTY_SUBMITTED: 'BOUNTY_SUBMITTED',
  BOUNTY_COMPLETED: 'BOUNTY_COMPLETED',
  
  // Room management
  JOIN_ROOM: 'JOIN_ROOM',
  LEAVE_ROOM: 'LEAVE_ROOM',
  ROOM_UPDATE: 'ROOM_UPDATE',
} as const;

export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];

// WebSocket connection states
export enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  FAILED = 'failed',
}

export class EnhancedWebSocketClient {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private handlers: WebSocketEventHandlers = {};
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private connectionState = ConnectionState.DISCONNECTED;
  private messageQueue: WebSocketMessage[] = [];
  private rooms = new Set<string>();

  constructor(config: WebSocketConfig, handlers: WebSocketEventHandlers = {}) {
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      ...config,
    };
    this.handlers = handlers;
  }

  // Public API
  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.warn('WebSocket already connected');
      return;
    }

    this.connectionState = ConnectionState.CONNECTING;
    this.createConnection();
  }

  disconnect(): void {
    this.connectionState = ConnectionState.DISCONNECTED;
    this.cleanup();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  send(message: WebSocketMessage): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        return false;
      }
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(message);
      console.warn('WebSocket not connected, message queued');
      return false;
    }
  }

  joinRoom(roomId: string): void {
    this.rooms.add(roomId);
    this.send({
      type: MESSAGE_TYPES.JOIN_ROOM,
      data: { roomId },
    });
  }

  leaveRoom(roomId: string): void {
    this.rooms.delete(roomId);
    this.send({
      type: MESSAGE_TYPES.LEAVE_ROOM,
      data: { roomId },
    });
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  isConnected(): boolean {
    return this.connectionState === ConnectionState.CONNECTED;
  }

  // Private methods
  private createConnection(): void {
    try {
      const url = this.buildWebSocketUrl();
      console.log('Connecting to WebSocket:', url);
      
      this.ws = new WebSocket(url, this.config.protocols);
      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.handleConnectionError();
    }
  }

  private buildWebSocketUrl(): string {
    const baseUrl = this.config.url;
    const params = new URLSearchParams();

    if (this.config.userId) {
      params.append('userId', this.config.userId);
    }
    if (this.config.venueId) {
      params.append('venueId', this.config.venueId);
    }
    if (this.config.eventId) {
      params.append('eventId', this.config.eventId);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = (event) => {
      console.log('WebSocket connected');
      this.connectionState = ConnectionState.CONNECTED;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.rejoinRooms();
      this.flushMessageQueue();
      this.handlers.onOpen?.(event);
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      this.connectionState = ConnectionState.DISCONNECTED;
      this.cleanup();
      this.handlers.onClose?.(event);

      // Attempt reconnection if not a clean close
      if (event.code !== 1000 && this.reconnectAttempts < this.config.maxReconnectAttempts!) {
        this.scheduleReconnect();
      } else if (this.reconnectAttempts >= this.config.maxReconnectAttempts!) {
        this.connectionState = ConnectionState.FAILED;
        this.handlers.onReconnectFailed?.();
      }
    };

    this.ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      this.handlers.onError?.(event);
      this.handleConnectionError();
    };
  }

  private handleMessage(message: WebSocketMessage): void {
    // Handle system messages
    switch (message.type) {
      case MESSAGE_TYPES.CONNECTION_ESTABLISHED:
        console.log('WebSocket connection established:', message.data);
        break;
        
      case MESSAGE_TYPES.PONG:
        // Heartbeat response received
        break;
        
      case MESSAGE_TYPES.ERROR:
        console.error('WebSocket server error:', message.data);
        break;
        
      case MESSAGE_TYPES.ROOM_UPDATE:
        console.log('Room update:', message.data);
        break;
        
      default:
        // Pass application messages to handler
        this.handlers.onMessage?.(message);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.connectionState = ConnectionState.RECONNECTING;
    this.reconnectAttempts++;

    const delay = Math.min(
      this.config.reconnectInterval! * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    );

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.handlers.onReconnect?.(this.reconnectAttempts);
      this.createConnection();
    }, delay);
  }

  private handleConnectionError(): void {
    if (this.connectionState === ConnectionState.CONNECTING) {
      this.scheduleReconnect();
    }
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      this.send({
        type: MESSAGE_TYPES.HEARTBEAT,
        timestamp: new Date().toISOString(),
      });
    }, this.config.heartbeatInterval!);
  }

  private cleanup(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private rejoinRooms(): void {
    // Rejoin all rooms after reconnection
    this.rooms.forEach(roomId => {
      this.send({
        type: MESSAGE_TYPES.JOIN_ROOM,
        data: { roomId },
      });
    });
  }

  private flushMessageQueue(): void {
    // Send queued messages
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }
}

// Factory function for creating WebSocket clients
export function createWebSocketClient(
  userId?: string,
  venueId?: string,
  eventId?: string
): EnhancedWebSocketClient {
  const wsUrl = env.api.wsUrl.replace('http', 'ws');
  
  const config: WebSocketConfig = {
    url: wsUrl,
    userId,
    venueId,
    eventId,
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000,
  };

  return new EnhancedWebSocketClient(config);
}

// Singleton WebSocket manager for global use
class WebSocketManager {
  private clients = new Map<string, EnhancedWebSocketClient>();

  getClient(key: string): EnhancedWebSocketClient | undefined {
    return this.clients.get(key);
  }

  createClient(
    key: string,
    userId?: string,
    venueId?: string,
    eventId?: string,
    handlers?: WebSocketEventHandlers
  ): EnhancedWebSocketClient {
    // Close existing client if any
    const existing = this.clients.get(key);
    if (existing) {
      existing.disconnect();
    }

    const client = createWebSocketClient(userId, venueId, eventId);
    
    if (handlers) {
      Object.assign(client['handlers'], handlers);
    }

    this.clients.set(key, client);
    return client;
  }

  removeClient(key: string): void {
    const client = this.clients.get(key);
    if (client) {
      client.disconnect();
      this.clients.delete(key);
    }
  }

  disconnectAll(): void {
    this.clients.forEach(client => client.disconnect());
    this.clients.clear();
  }
}

export const webSocketManager = new WebSocketManager();

// React hook for WebSocket (if using React)
export function useWebSocket(
  key: string,
  userId?: string,
  venueId?: string,
  eventId?: string,
  handlers?: WebSocketEventHandlers
) {
  const [connectionState, setConnectionState] = React.useState(ConnectionState.DISCONNECTED);
  const clientRef = React.useRef<EnhancedWebSocketClient | null>(null);

  React.useEffect(() => {
    const client = webSocketManager.createClient(key, userId, venueId, eventId, {
      ...handlers,
      onOpen: (event) => {
        setConnectionState(ConnectionState.CONNECTED);
        handlers?.onOpen?.(event);
      },
      onClose: (event) => {
        setConnectionState(ConnectionState.DISCONNECTED);
        handlers?.onClose?.(event);
      },
      onReconnect: (attempt) => {
        setConnectionState(ConnectionState.RECONNECTING);
        handlers?.onReconnect?.(attempt);
      },
      onReconnectFailed: () => {
        setConnectionState(ConnectionState.FAILED);
        handlers?.onReconnectFailed?.();
      },
    });

    clientRef.current = client;
    client.connect();

    return () => {
      webSocketManager.removeClient(key);
    };
  }, [key, userId, venueId, eventId]);

  return {
    client: clientRef.current,
    connectionState,
    isConnected: connectionState === ConnectionState.CONNECTED,
    send: (message: WebSocketMessage) => clientRef.current?.send(message),
    joinRoom: (roomId: string) => clientRef.current?.joinRoom(roomId),
    leaveRoom: (roomId: string) => clientRef.current?.leaveRoom(roomId),
  };
}

export default EnhancedWebSocketClient;