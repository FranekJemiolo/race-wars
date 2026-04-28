import { WebSocketServer, WebSocket } from "ws"
import { handleMessage } from "./handlers"
import { log, error } from "../utils/logger"
import { CONFIG } from "@race-wars/shared"

interface ConnectionPool {
  server: WebSocketServer;
  port: number;
  clients: Map<WebSocket, string>;
  isActive: boolean;
}

const connectionPools: ConnectionPool[] = [];
const maxConnectionsPerPool = 1000;
const maxPools = 4;

export function startWebSocket(port: number = 8080): void {
  // Start primary WebSocket server
  createConnectionPool(port);
}

function createConnectionPool(port: number): void {
  if (connectionPools.length >= maxPools) {
    log(`Maximum connection pools (${maxPools}) reached`);
    return;
  }

  const clients = new Map<WebSocket, string>();
  const wss = new WebSocketServer({ port });

  const pool: ConnectionPool = {
    server: wss,
    port,
    clients,
    isActive: true,
  };

  connectionPools.push(pool);

  wss.on("connection", (ws: WebSocket) => {
    // Check if pool has reached max connections
    if (clients.size >= maxConnectionsPerPool) {
      log(`Connection pool on port ${port} at capacity, rejecting connection`);
      ws.close(1013, 'Server at capacity');
      return;
    }

    log(`New client connected to pool on port ${port} (total: ${clients.size + 1})`);

    ws.on("message", (data: Buffer) => {
      try {
        const message = data.toString()
        handleMessage(ws, message, clients)
      } catch (e) {
        error("Error handling message:", e)
      }
    })

    ws.on("close", () => {
      const playerId = clients.get(ws)
      if (playerId) {
        log(`Client disconnected from pool ${port}: ${playerId} (remaining: ${clients.size - 1})`)
        clients.delete(ws)
      }
    })

    ws.on("error", (err) => {
      error("WebSocket error:", err)
    })

    // Send ping periodically for connection health
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping()
      } else {
        clearInterval(pingInterval)
      }
    }, CONFIG.HEARTBEAT_INTERVAL)
  })

  wss.on("error", (err) => {
    error(`WebSocket server error on port ${port}:`, err);
    pool.isActive = false;
  });

  log(`WebSocket server pool running on port ${port}`)
}

export function addConnectionPool(port: number): boolean {
  // Check if port is already in use
  if (connectionPools.some(p => p.port === port)) {
    log(`Port ${port} already in use by another connection pool`);
    return false;
  }

  createConnectionPool(port);
  return true;
}

export function removeConnectionPool(port: number): boolean {
  const index = connectionPools.findIndex(p => p.port === port);
  if (index === -1) {
    return false;
  }

  const pool = connectionPools[index];
  pool.isActive = false;
  
  // Close all connections
  for (const [ws] of pool.clients.entries()) {
    ws.close(1000, 'Server shutting down');
  }
  
  pool.server.close(() => {
    log(`Connection pool on port ${port} closed`);
  });

  connectionPools.splice(index, 1);
  return true;
}

export function getClient(playerId: string): WebSocket | undefined {
  for (const pool of connectionPools) {
    if (!pool.isActive) continue;
    for (const [ws, id] of pool.clients.entries()) {
      if (id === playerId) return ws
    }
  }
  return undefined
}

export function setClient(ws: WebSocket, playerId: string): void {
  // Find the pool this connection belongs to
  for (const pool of connectionPools) {
    if (pool.clients.has(ws)) {
      pool.clients.set(ws, playerId);
      return;
    }
  }
}

export function removeClient(ws: WebSocket): void {
  for (const pool of connectionPools) {
    if (pool.clients.delete(ws)) {
      return;
    }
  }
}

export function broadcast(message: string, excludeWs?: WebSocket): void {
  for (const pool of connectionPools) {
    if (!pool.isActive) continue;
    for (const [ws] of pool.clients.entries()) {
      if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
        ws.send(message)
      }
    }
  }
}

export function sendToClient(playerId: string, message: string): boolean {
  const ws = getClient(playerId)
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(message)
    return true
  }
  return false
}

export function getConnectionStats(): {
  totalPools: number;
  activePools: number;
  totalConnections: number;
  connectionsPerPool: { port: number; connections: number; active: boolean }[];
} {
  const activePools = connectionPools.filter(p => p.isActive);
  const totalConnections = activePools.reduce((sum, pool) => sum + pool.clients.size, 0);

  return {
    totalPools: connectionPools.length,
    activePools: activePools.length,
    totalConnections,
    connectionsPerPool: connectionPools.map(pool => ({
      port: pool.port,
      connections: pool.clients.size,
      active: pool.isActive,
    })),
  };
}

export function getPoolForNewConnection(): ConnectionPool | null {
  // Find pool with least connections
  const activePools = connectionPools.filter(p => p.isActive && p.clients.size < maxConnectionsPerPool);
  
  if (activePools.length === 0) {
    return null;
  }

  // Sort by connection count (ascending)
  activePools.sort((a, b) => a.clients.size - b.clients.size);
  return activePools[0];
}
