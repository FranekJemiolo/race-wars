import { WebSocketServer, WebSocket } from "ws"
import { handleMessage } from "./handlers"
import { log, error } from "../utils/logger"
import { CONFIG } from "@race-wars/shared"

const clients = new Map<WebSocket, string>()

export function startWebSocket(port: number = 8080): void {
  const wss = new WebSocketServer({ port })

  wss.on("connection", (ws: WebSocket) => {
    log("New client connected")

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
        log(`Client disconnected: ${playerId}`)
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

  log(`WebSocket server running on port ${port}`)
}

export function getClient(playerId: string): WebSocket | undefined {
  for (const [ws, id] of clients.entries()) {
    if (id === playerId) return ws
  }
  return undefined
}

export function setClient(ws: WebSocket, playerId: string): void {
  clients.set(ws, playerId)
}

export function removeClient(ws: WebSocket): void {
  clients.delete(ws)
}

export function broadcast(message: string, excludeWs?: WebSocket): void {
  for (const [ws] of clients.entries()) {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(message)
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
