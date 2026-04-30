import path from 'path'
import dotenv from 'dotenv'
import express from 'express'
import { createServer } from 'http'
import { startWebSocket } from "./network/websocket"
import { startTick } from "./engine/tick"
import { initializeDatabase } from './database/connection.simple'
import { log } from "./utils/logger"

// Load .env from root directory
dotenv.config({ path: path.join(__dirname, '../../.env') })
// import raceRoutes from './routes/race.routes'
import authRoutes from './routes/auth.routes'
// import participationRoutes from './routes/participation.routes'
// import routeRoutes from './routes/route.routes'
// import notificationRoutes from './routes/notification.routes'
// import enforcementRoutes from './routes/enforcement.routes'
// import sectorFlagRoutes from './routes/sectorFlag.routes'
// import proximityRoutes from './routes/proximity.routes'
// import incidentRoutes from './routes/incident.routes'
// import carProfileRoutes from './routes/carProfile.routes'
// import { raceController } from './controllers/race.controller'
// import healthRoutes from './routes/health'
import leaderboardRoutes from './routes/leaderboard.routes'

const app = express()
const server = createServer(app)

export { app }

// Middleware
app.use(express.json())
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
})

// Routes
app.use('/api/auth', authRoutes)
// app.use('/api/races', raceRoutes)
// app.use('/api/participation', participationRoutes)
// app.use('/api/routes', routeRoutes)
// app.use('/api/notifications', notificationRoutes)
// app.use('/api/enforcement', enforcementRoutes)
// app.use('/api/sector-flags', sectorFlagRoutes)
// app.use('/api/proximity', proximityRoutes)
// app.use('/api/incidents', incidentRoutes)
// app.use('/api/car-profiles', carProfileRoutes)
app.use('/api/leaderboard', leaderboardRoutes)

// Health check routes
// app.use('/', healthRoutes)

export async function startServer() {
  try {
    // Initialize database
    await initializeDatabase()
    
    const PORT = process.env.PORT || 8080
    
    // Start HTTP server
    server.listen(PORT, () => {
      log(`HTTP Server running on port ${PORT}`)
    })
    
    // Start WebSocket server on different port
    const WS_PORT = parseInt(process.env.WS_PORT || '8081')
    startWebSocket(WS_PORT)
    
    // Start game engine
    startTick()
    
    log("Race Wars server started successfully")
  } catch (error) {
    log("Failed to start server:", error)
    process.exit(1)
  }
}

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer()
}
