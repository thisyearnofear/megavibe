/**
 * WebSocket Service
 * Manages WebSocket connections for real-time updates in the MegaVibe platform.
 * Provides functionality to broadcast messages to specific venues or globally.
 */

const WebSocket = require("ws");
const http = require("http");
const express = require("express");
const app = express();

// WebSocket server setup
let wss;

// Map to store client connections by venue ID
const venueClients = new Map();

// Initialize WebSocket server
function initWebSocketServer(server) {
  wss = new WebSocket.Server({ server });
  console.log("WebSocket server initialized");

  wss.on("connection", (ws, req) => {
    // Extract venue ID from query parameter or headers
    const url = new URL(req.url, `http://${req.headers.host}`);
    const venueId =
      url.searchParams.get("venueId") || req.headers["x-venue-id"];

    if (venueId) {
      // Add client to venue-specific set
      if (!venueClients.has(venueId)) {
        venueClients.set(venueId, new Set());
      }
      venueClients.get(venueId).add(ws);
      console.log(
        `Client connected to venue ${venueId}. Total clients: ${
          venueClients.get(venueId).size
        }`
      );

      // Send welcome message
      ws.send(
        JSON.stringify({
          type: "CONNECTION_ESTABLISHED",
          venueId,
          message: `Connected to venue ${venueId} updates`,
        })
      );

      // Handle disconnection
      ws.on("close", () => {
        if (venueClients.has(venueId)) {
          venueClients.get(venueId).delete(ws);
          console.log(
            `Client disconnected from venue ${venueId}. Total clients: ${
              venueClients.get(venueId).size
            }`
          );
          if (venueClients.get(venueId).size === 0) {
            venueClients.delete(venueId);
          }
        }
      });

      // Handle errors
      ws.on("error", (error) => {
        console.error(`WebSocket error for venue ${venueId}:`, error);
      });
    } else {
      // Handle global connections (not tied to a specific venue)
      console.log("Client connected to global updates");
      ws.send(
        JSON.stringify({
          type: "CONNECTION_ESTABLISHED",
          message: "Connected to global updates",
        })
      );
    }

    // Handle incoming messages (for future use like client pings)
    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data);
        if (message.type === "PING") {
          ws.send(JSON.stringify({ type: "PONG" }));
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    });
  });
}

// Broadcast message to all clients in a specific venue
function broadcastToVenue(venueId, message) {
  if (venueClients.has(venueId)) {
    const clients = venueClients.get(venueId);
    const messageStr = JSON.stringify(message);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
    console.log(
      `Broadcasted to ${clients.size} clients in venue ${venueId}:`,
      message.type
    );
    return clients.size;
  }
  return 0;
}

// Broadcast message to all connected clients (global)
function broadcastGlobal(message) {
  if (!wss) return 0;

  const messageStr = JSON.stringify(message);
  let count = 0;
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
      count++;
    }
  });
  console.log(`Broadcasted globally to ${count} clients:`, message.type);
  return count;
}

// Get number of connected clients for a venue
function getVenueClientCount(venueId) {
  return venueClients.has(venueId) ? venueClients.get(venueId).size : 0;
}

// Get total number of connected clients
function getTotalClientCount() {
  return wss ? wss.clients.size : 0;
}

module.exports = {
  initWebSocketServer,
  broadcastToVenue,
  broadcastGlobal,
  getVenueClientCount,
  getTotalClientCount,
};
