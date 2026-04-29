import { WebSocket } from "ws"
import { ClientMessage, ServerMessage, PROTOCOL_VERSION, CONFIG } from "@race-wars/shared"
import { log, error } from "../utils/logger"
import { setClient, removeClient, sendToClient, getClient } from "./websocket"
import { createPlayer, createPlayerManager } from "../state/playerState"
import { createRaceManager } from "../state/raceState"
import { getAntiCheatService } from "../services/antiCheat.service"

// Global race manager (in production, this would be per-race)
let raceManager: ReturnType<typeof createRaceManager> | null = null
let playerManagers = new Map<string, ReturnType<typeof createPlayerManager>>()

// Rate limiting per player
const updateRates = new Map<string, { count: number; resetTime: number }>()

export function handleMessage(
  ws: WebSocket,
  rawMessage: string,
  clients: Map<WebSocket, string>
): void {
  try {
    const msg: ClientMessage = JSON.parse(rawMessage)
    
    // Validate protocol version
    if ("version" in msg && msg.version !== PROTOCOL_VERSION) {
      sendError(ws, "PROTOCOL_MISMATCH", `Client version ${msg.version} does not match server ${PROTOCOL_VERSION}`)
      return
    }

    switch (msg.type) {
      case "JOIN_RACE":
        handleJoin(ws, msg.playerId, msg.name, clients)
        break
      case "POSITION_UPDATE":
        handlePositionUpdate(ws, msg, clients)
        break
      case "READY":
        handleReady(ws, clients)
        break
      case "PING":
        handlePing(ws, msg.timestamp)
        break
      case "REJOIN":
        handleRejoin(ws, msg.playerId, clients)
        break
      case "FULL_RESYNC":
        handleFullResync(ws, clients)
        break
      default:
        error("Unknown message type:", (msg as any).type)
    }
  } catch (e) {
    error("Failed to parse message:", e)
    sendError(ws, "INVALID_MESSAGE", "Failed to parse message")
  }
}

function handleJoin(ws: WebSocket, playerId: string, name: string, clients: Map<WebSocket, string>): void {
  log(`Player ${playerId} (${name}) joining`)
  
  // Check if player already exists
  if (playerManagers.has(playerId)) {
    sendError(ws, "ALREADY_JOINED", "Player already in race")
    return
  }
  
  // Check capacity
  if (playerManagers.size >= CONFIG.MAX_PARTICIPANTS) {
    sendError(ws, "RACE_FULL", "Maximum participants reached")
    return
  }
  
  // Initialize race if needed
  if (!raceManager) {
    // TODO: Load actual route from storage
    raceManager = createRaceManager("default", "Default Race", {
      points: [],
      checkpoints: [],
      isLoop: false,
      startLine: { start: { lat: 0, lon: 0 }, end: { lat: 0, lon: 0 } },
      finishLine: { start: { lat: 0, lon: 0 }, end: { lat: 0, lon: 0 } },
      totalLength: 0,
      version: "1.0"
    })
  }
  
  // Create player
  const player = createPlayer(playerId, name, { lat: 0, lon: 0 })
  const playerManager = createPlayerManager(player)
  playerManagers.set(playerId, playerManager)
  
  // Add to race
  raceManager.addPlayer(player)
  
  // Register client
  setClient(ws, playerId)
  
  // Send initial state
  sendStateSnapshot(ws)
  
  log(`Player ${playerId} joined successfully`)
}

function handlePositionUpdate(ws: WebSocket, msg: Extract<ClientMessage, { type: "POSITION_UPDATE" }>, clients: Map<WebSocket, string>): void {
  const playerId = getPlayerId(ws, clients)
  if (!playerId) return
  
  // Rate limiting
  const now = Date.now()
  const rate = updateRates.get(playerId) || { count: 0, resetTime: now + 1000 }
  
  if (now > rate.resetTime) {
    rate.count = 0
    rate.resetTime = now + 1000
  }
  
  rate.count++
  updateRates.set(playerId, rate)
  
  if (rate.count > CONFIG.MAX_UPDATES_PER_SECOND) {
    // Silently drop excess updates
    return
  }
  
  // Get player manager
  const playerManager = playerManagers.get(playerId)
  if (!playerManager) return
  
  // Create GPS data point for anti-cheat analysis
  const gpsDataPoint = {
    sessionId: raceManager?.race.id || 'default',
    participantId: playerId,
    timestamp: now,
    lat: msg.lat,
    lng: msg.lon,
    speed: msg.speed || 0,
    heading: msg.heading || 0,
    accuracy: msg.accuracy || 10,
    source: msg.source || 'gps',
    quality: msg.quality || 'medium',
    satelliteCount: msg.satelliteCount,
    hdop: msg.hdop,
    vdop: msg.vdop
  }
  
  // Run anti-cheat detection
  const antiCheatService = getAntiCheatService()
  antiCheatService.analyzeGPSData(gpsDataPoint).then(result => {
    if (result.isCheating) {
      log(`Cheat detected for ${playerId}: Risk score ${result.riskScore}`, {
        anomalies: result.anomalies.length,
        confidence: result.confidence
      })
      
      // Send warning to player
      const warningMessage: ServerMessage = {
        type: "ANTI_CHEAT_WARNING",
        riskScore: result.riskScore,
        anomalies: result.anomalies.map(a => ({
          type: a.type,
          severity: a.severity,
          description: a.description
        })),
        recommendations: result.recommendations
      }
      sendToClient(playerId, JSON.stringify(warningMessage))
      
      // If critical cheating detected, consider disqualification
      if (result.riskScore > 90) {
        log(`Critical cheating detected for ${playerId} - considering disqualification`)
        // TODO: Implement disqualification logic
      }
    }
  }).catch(error => {
    error('Anti-cheat analysis failed:', error)
  })
  
  // Update player position
  playerManager.updatePosition({
    lat: msg.lat,
    lon: msg.lon,
    timestamp: now
  })
  
  log(`Position update from ${playerId}: ${msg.lat}, ${msg.lon} (source: ${gpsDataPoint.source})`)
}

function handleReady(ws: WebSocket, clients: Map<WebSocket, string>): void {
  const playerId = getPlayerId(ws, clients)
  if (!playerId) return
  
  const playerManager = playerManagers.get(playerId)
  if (!playerManager) return
  
  playerManager.transitionState("READY")
  log(`Player ${playerId} is ready`)
}

function handlePing(ws: WebSocket, timestamp: number): void {
  const response: ServerMessage = {
    type: "PONG",
    timestamp
  }
  ws.send(JSON.stringify(response))
}

function handleRejoin(ws: WebSocket, playerId: string, clients: Map<WebSocket, string>): void {
  log(`Player ${playerId} attempting to rejoin`)
  
  if (playerManagers.has(playerId)) {
    setClient(ws, playerId)
    sendStateSnapshot(ws)
    log(`Player ${playerId} rejoined successfully`)
  } else {
    sendError(ws, "PLAYER_NOT_FOUND", "Player not found in race")
  }
}

function handleFullResync(ws: WebSocket, clients: Map<WebSocket, string>): void {
  const playerId = getPlayerId(ws, clients)
  if (!playerId) return
  
  log(`Full resync requested by ${playerId}`)
  sendStateSnapshot(ws)
}

function sendStateSnapshot(ws: WebSocket): void {
  if (!raceManager) return
  
  const state = {
    race: raceManager.race,
    players: raceManager.getAllPlayers()
  }
  
  const message: ServerMessage = {
    type: "STATE_SNAPSHOT",
    state,
    seq: 0,
    timestamp: Date.now(),
    version: PROTOCOL_VERSION
  }
  
  ws.send(JSON.stringify(message))
}

function sendError(ws: WebSocket, code: string, message: string): void {
  const errorMessage: ServerMessage = {
    type: "CRITICAL_ERROR",
    code,
    message
  }
  ws.send(JSON.stringify(errorMessage))
}

function getPlayerId(ws: WebSocket, clients: Map<WebSocket, string>): string | null {
  return clients.get(ws) || null
}

// Export for use in tick engine
export function getPlayerManagers() {
  return playerManagers
}

export function getRaceManager() {
  return raceManager
}

export function setRaceManager(manager: ReturnType<typeof createRaceManager>) {
  raceManager = manager
}
