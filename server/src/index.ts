import { startWebSocket } from "./network/websocket"
import { startTick } from "./engine/tick"
import { initializeDatabase } from "./database/connection"
import { log } from "./utils/logger"

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase()
    
    log("Race Wars server started")
    
    // Start services
    startWebSocket()
    startTick()
    
    log("Server initialized")
  } catch (error) {
    log("Failed to start server:", error)
    process.exit(1)
  }
}

startServer()
