/**
 * Enhanced WebSocket Service
 * Provides stable, scalable WebSocket connections with proper error handling,
 * reconnection logic, heartbeat monitoring, and room-based messaging.
 */

const WebSocket = require("ws");
const { logger } = require("../middleware/errorHandler.cjs");

// WebSocket server instance
let wss;

// Connection management
const connections = new Map(); // connectionId -> connection info
const rooms = new Map(); // roomId -> Set of connectionIds
const userConnections = new Map(); // userId -> Set of connectionIds

// Configuration
const CONFIG = {
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  CONNECTION_TIMEOUT: 60000, // 60 seconds
  MAX_CONNECTIONS_PER_USER: 5,
  MAX_MESSAGE_SIZE: 1024 * 10, // 10KB
  RECONNECT_ATTEMPTS: 3,
};

// Message types
const MESSAGE_TYPES = {
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
};

// Initialize WebSocket server
function initWebSocketServer(server) {
  wss = new WebSocket.Server({ 
    server,
    perMessageDeflate: {
      zlibDeflateOptions: {
        threshold: 1024,
        concurrencyLimit: 10,
      },
    },
  });

  logger.info("WebSocket server initialized");

  wss.on("connection", handleConnection);
  
  // Start heartbeat monitoring
  startHeartbeatMonitoring();
  
  // Cleanup interval
  setInterval(cleanupStaleConnections, 60000); // Every minute

  return wss;
}

// Handle new WebSocket connection
function handleConnection(ws, req) {
  const connectionId = generateConnectionId();
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // Extract connection parameters
  const userId = url.searchParams.get("userId");
  const venueId = url.searchParams.get("venueId");
  const eventId = url.searchParams.get("eventId");
  const userAgent = req.headers['user-agent'];
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  // Rate limiting per user
  if (userId && userConnections.has(userId)) {
    const userConns = userConnections.get(userId);
    if (userConns.size >= CONFIG.MAX_CONNECTIONS_PER_USER) {
      logger.warn(`User ${userId} exceeded max connections limit`);
      ws.close(1008, 'Too many connections');
      return;
    }
  }

  // Create connection info
  const connectionInfo = {
    id: connectionId,
    ws,
    userId,
    venueId,
    eventId,
    userAgent,
    ip,
    connectedAt: new Date(),
    lastHeartbeat: new Date(),
    isAlive: true,
    rooms: new Set(),
  };

  // Store connection
  connections.set(connectionId, connectionInfo);

  // Track user connections
  if (userId) {
    if (!userConnections.has(userId)) {
      userConnections.set(userId, new Set());
    }
    userConnections.get(userId).add(connectionId);
  }

  // Auto-join rooms based on parameters
  if (venueId) {
    joinRoom(connectionId, `venue:${venueId}`);
  }
  if (eventId) {
    joinRoom(connectionId, `event:${eventId}`);
  }

  logger.info(`WebSocket connection established: ${connectionId}`, {
    userId,
    venueId,
    eventId,
    ip,
    totalConnections: connections.size,
  });

  // Send welcome message
  sendToConnection(connectionId, {
    type: MESSAGE_TYPES.CONNECTION_ESTABLISHED,
    connectionId,
    timestamp: new Date().toISOString(),
    config: {
      heartbeatInterval: CONFIG.HEARTBEAT_INTERVAL,
    },
  });

  // Set up event handlers
  ws.on("message", (data) => handleMessage(connectionId, data));
  ws.on("close", (code, reason) => handleDisconnection(connectionId, code, reason));
  ws.on("error", (error) => handleConnectionError(connectionId, error));
  ws.on("pong", () => handlePong(connectionId));

  // Set connection timeout
  setTimeout(() => {
    if (connections.has(connectionId)) {
      const conn = connections.get(connectionId);
      if (!conn.isAlive) {
        logger.warn(`Connection timeout: ${connectionId}`);
        ws.terminate();
      }
    }
  }, CONFIG.CONNECTION_TIMEOUT);
}

// Handle incoming messages
function handleMessage(connectionId, data) {
  try {
    const connection = connections.get(connectionId);
    if (!connection) return;

    // Size check
    if (data.length > CONFIG.MAX_MESSAGE_SIZE) {
      sendError(connectionId, 'Message too large');
      return;
    }

    const message = JSON.parse(data);
    connection.lastHeartbeat = new Date();

    logger.debug(`Message received from ${connectionId}:`, message.type);

    switch (message.type) {
      case MESSAGE_TYPES.HEARTBEAT:
        handleHeartbeat(connectionId);
        break;
        
      case MESSAGE_TYPES.JOIN_ROOM:
        if (message.roomId) {
          joinRoom(connectionId, message.roomId);
        }
        break;
        
      case MESSAGE_TYPES.LEAVE_ROOM:
        if (message.roomId) {
          leaveRoom(connectionId, message.roomId);
        }
        break;
        
      default:
        logger.warn(`Unknown message type: ${message.type} from ${connectionId}`);
    }
  } catch (error) {
    logger.error(`Error parsing message from ${connectionId}:`, error);
    sendError(connectionId, 'Invalid message format');
  }
}

// Handle connection disconnection
function handleDisconnection(connectionId, code, reason) {
  const connection = connections.get(connectionId);
  if (!connection) return;

  logger.info(`WebSocket disconnection: ${connectionId}`, {
    code,
    reason: reason.toString(),
    userId: connection.userId,
    duration: Date.now() - connection.connectedAt.getTime(),
  });

  // Remove from all rooms
  connection.rooms.forEach(roomId => {
    leaveRoom(connectionId, roomId);
  });

  // Remove from user connections
  if (connection.userId && userConnections.has(connection.userId)) {
    const userConns = userConnections.get(connection.userId);
    userConns.delete(connectionId);
    if (userConns.size === 0) {
      userConnections.delete(connection.userId);
    }
  }

  // Remove connection
  connections.delete(connectionId);

  logger.info(`Total connections: ${connections.size}`);
}

// Handle connection errors
function handleConnectionError(connectionId, error) {
  logger.error(`WebSocket error for ${connectionId}:`, error);
  
  const connection = connections.get(connectionId);
  if (connection) {
    sendError(connectionId, 'Connection error occurred');
  }
}

// Handle heartbeat response
function handleHeartbeat(connectionId) {
  const connection = connections.get(connectionId);
  if (connection) {
    connection.isAlive = true;
    connection.lastHeartbeat = new Date();
    
    sendToConnection(connectionId, {
      type: MESSAGE_TYPES.PONG,
      timestamp: new Date().toISOString(),
    });
  }
}

// Handle pong response
function handlePong(connectionId) {
  const connection = connections.get(connectionId);
  if (connection) {
    connection.isAlive = true;
    connection.lastHeartbeat = new Date();
  }
}

// Room management
function joinRoom(connectionId, roomId) {
  const connection = connections.get(connectionId);
  if (!connection) return false;

  // Add to room
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  rooms.get(roomId).add(connectionId);
  connection.rooms.add(roomId);

  logger.debug(`Connection ${connectionId} joined room ${roomId}`);

  // Notify connection
  sendToConnection(connectionId, {
    type: MESSAGE_TYPES.ROOM_UPDATE,
    action: 'joined',
    roomId,
    memberCount: rooms.get(roomId).size,
    timestamp: new Date().toISOString(),
  });

  return true;
}

function leaveRoom(connectionId, roomId) {
  const connection = connections.get(connectionId);
  if (!connection) return false;

  // Remove from room
  if (rooms.has(roomId)) {
    rooms.get(roomId).delete(connectionId);
    if (rooms.get(roomId).size === 0) {
      rooms.delete(roomId);
    }
  }
  connection.rooms.delete(roomId);

  logger.debug(`Connection ${connectionId} left room ${roomId}`);

  // Notify connection
  sendToConnection(connectionId, {
    type: MESSAGE_TYPES.ROOM_UPDATE,
    action: 'left',
    roomId,
    memberCount: rooms.has(roomId) ? rooms.get(roomId).size : 0,
    timestamp: new Date().toISOString(),
  });

  return true;
}

// Broadcasting functions
function broadcastToRoom(roomId, message, excludeConnectionId = null) {
  if (!rooms.has(roomId)) {
    logger.warn(`Attempted to broadcast to non-existent room: ${roomId}`);
    return 0;
  }

  const roomConnections = rooms.get(roomId);
  let sentCount = 0;

  roomConnections.forEach(connectionId => {
    if (connectionId !== excludeConnectionId) {
      if (sendToConnection(connectionId, message)) {
        sentCount++;
      }
    }
  });

  logger.debug(`Broadcasted to room ${roomId}: ${sentCount}/${roomConnections.size} connections`);
  return sentCount;
}

function broadcastToUser(userId, message) {
  if (!userConnections.has(userId)) {
    logger.warn(`Attempted to broadcast to non-connected user: ${userId}`);
    return 0;
  }

  const userConns = userConnections.get(userId);
  let sentCount = 0;

  userConns.forEach(connectionId => {
    if (sendToConnection(connectionId, message)) {
      sentCount++;
    }
  });

  logger.debug(`Broadcasted to user ${userId}: ${sentCount}/${userConns.size} connections`);
  return sentCount;
}

function broadcastGlobal(message, excludeUserId = null) {
  let sentCount = 0;

  connections.forEach((connection, connectionId) => {
    if (!excludeUserId || connection.userId !== excludeUserId) {
      if (sendToConnection(connectionId, message)) {
        sentCount++;
      }
    }
  });

  logger.debug(`Global broadcast: ${sentCount}/${connections.size} connections`);
  return sentCount;
}

// Send message to specific connection
function sendToConnection(connectionId, message) {
  const connection = connections.get(connectionId);
  if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
    return false;
  }

  try {
    const messageStr = JSON.stringify({
      ...message,
      timestamp: message.timestamp || new Date().toISOString(),
    });
    
    connection.ws.send(messageStr);
    return true;
  } catch (error) {
    logger.error(`Error sending message to ${connectionId}:`, error);
    return false;
  }
}

// Send error message
function sendError(connectionId, errorMessage) {
  sendToConnection(connectionId, {
    type: MESSAGE_TYPES.ERROR,
    message: errorMessage,
    timestamp: new Date().toISOString(),
  });
}

// Heartbeat monitoring
function startHeartbeatMonitoring() {
  setInterval(() => {
    connections.forEach((connection, connectionId) => {
      if (!connection.isAlive) {
        logger.warn(`Terminating stale connection: ${connectionId}`);
        connection.ws.terminate();
        return;
      }

      connection.isAlive = false;
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.ping();
      }
    });
  }, CONFIG.HEARTBEAT_INTERVAL);
}

// Cleanup stale connections
function cleanupStaleConnections() {
  const now = Date.now();
  const staleConnections = [];

  connections.forEach((connection, connectionId) => {
    const timeSinceLastHeartbeat = now - connection.lastHeartbeat.getTime();
    
    if (timeSinceLastHeartbeat > CONFIG.HEARTBEAT_INTERVAL * 2) {
      staleConnections.push(connectionId);
    }
  });

  staleConnections.forEach(connectionId => {
    const connection = connections.get(connectionId);
    if (connection) {
      logger.warn(`Cleaning up stale connection: ${connectionId}`);
      connection.ws.terminate();
    }
  });

  if (staleConnections.length > 0) {
    logger.info(`Cleaned up ${staleConnections.length} stale connections`);
  }
}

// Utility functions
function generateConnectionId() {
  return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getConnectionStats() {
  return {
    totalConnections: connections.size,
    totalRooms: rooms.size,
    totalUsers: userConnections.size,
    roomStats: Array.from(rooms.entries()).map(([roomId, connections]) => ({
      roomId,
      memberCount: connections.size,
    })),
  };
}

// High-level API functions for application use
function notifyTipConfirmed(tipData) {
  const message = {
    type: MESSAGE_TYPES.TIP_CONFIRMED,
    data: tipData,
  };

  let sentCount = 0;
  
  // Broadcast to event room
  if (tipData.eventId) {
    sentCount += broadcastToRoom(`event:${tipData.eventId}`, message);
  }
  
  // Broadcast to venue room if available
  if (tipData.venueId) {
    sentCount += broadcastToRoom(`venue:${tipData.venueId}`, message);
  }

  return sentCount;
}

function notifyBountyCreated(bountyData) {
  const message = {
    type: MESSAGE_TYPES.BOUNTY_CREATED,
    data: bountyData,
  };

  let sentCount = 0;
  
  // Broadcast to event room
  if (bountyData.eventId) {
    sentCount += broadcastToRoom(`event:${bountyData.eventId}`, message);
  }
  
  // Notify speaker directly
  if (bountyData.speakerId) {
    sentCount += broadcastToUser(bountyData.speakerId, message);
  }

  return sentCount;
}

function notifyBountyUpdate(bountyData, updateType) {
  const message = {
    type: updateType,
    data: bountyData,
  };

  let sentCount = 0;
  
  // Broadcast to event room
  if (bountyData.eventId) {
    sentCount += broadcastToRoom(`event:${bountyData.eventId}`, message);
  }
  
  // Notify relevant users
  if (bountyData.creatorId) {
    sentCount += broadcastToUser(bountyData.creatorId, message);
  }
  
  if (bountyData.claimedBy) {
    sentCount += broadcastToUser(bountyData.claimedBy, message);
  }

  return sentCount;
}

// Graceful shutdown
function shutdown() {
  logger.info('Shutting down WebSocket server...');
  
  if (wss) {
    wss.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1001, 'Server shutting down');
      }
    });
    
    wss.close(() => {
      logger.info('WebSocket server closed');
    });
  }
}

// Handle process signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = {
  initWebSocketServer,
  broadcastToRoom,
  broadcastToUser,
  broadcastGlobal,
  joinRoom,
  leaveRoom,
  getConnectionStats,
  notifyTipConfirmed,
  notifyBountyCreated,
  notifyBountyUpdate,
  MESSAGE_TYPES,
  shutdown,
};