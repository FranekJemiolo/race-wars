import { ClientMessage, ServerMessage, PROTOCOL_VERSION } from "@race-wars/shared"

let ws: WebSocket | null = null
let messageHandlers: Map<ServerMessage["type"], (msg: ServerMessage) => void> = new Map()
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 5
const RECONNECT_DELAY = 3000

export function connect(serverUrl: string = "ws://localhost:8080"): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    console.log("Already connected")
    return
  }

  ws = new WebSocket(serverUrl)

  ws.onopen = () => {
    console.log("Connected to server")
    reconnectAttempts = 0
  }

  ws.onmessage = (event) => {
    try {
      const msg: ServerMessage = JSON.parse(event.data)
      const handler = messageHandlers.get(msg.type)
      if (handler) {
        handler(msg)
      } else {
        console.warn("No handler for message type:", msg.type)
      }
    } catch (e) {
      console.error("Failed to parse message:", e)
    }
  }

  ws.onclose = () => {
    console.log("Disconnected from server")
    attemptReconnect(serverUrl)
  }

  ws.onerror = (error) => {
    console.error("WebSocket error:", error)
  }
}

function attemptReconnect(serverUrl: string): void {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error("Max reconnection attempts reached")
    return
  }

  reconnectAttempts++
  console.log(`Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${RECONNECT_DELAY}ms`)

  setTimeout(() => {
    connect(serverUrl)
  }, RECONNECT_DELAY)
}

export function disconnect(): void {
  if (ws) {
    ws.close()
    ws = null
  }
}

export function send(message: ClientMessage): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.error("WebSocket not connected")
    return
  }

  const messageWithVersion = { ...message, version: PROTOCOL_VERSION }
  ws.send(JSON.stringify(messageWithVersion))
}

export function onMessage<T extends ServerMessage["type"]>(
  type: T,
  handler: (msg: Extract<ServerMessage, { type: T }>) => void
): void {
  messageHandlers.set(type, handler as (msg: ServerMessage) => void)
}

export function isConnected(): boolean {
  return ws !== null && ws.readyState === WebSocket.OPEN
}

export function getConnectionState(): "connecting" | "connected" | "disconnected" {
  if (!ws) return "disconnected"
  if (ws.readyState === WebSocket.CONNECTING) return "connecting"
  if (ws.readyState === WebSocket.OPEN) return "connected"
  return "disconnected"
}
