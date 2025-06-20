import { io, Socket } from 'socket.io-client';
import environment from '../config/environment';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  connect() {
    if (this.socket) return this.socket;
    
    // Create socket with fallback to polling if WebSocket fails
    this.socket = io(environment.api.wsUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      timeout: 10000
    });
    
    this.socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err);
      // If WebSocket fails, try polling
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      }
    });
    
    return this.socket;
  }
  
  // Rest of your socket methods
}

export const socketService = new SocketService();