import { CONFIG } from "@race-wars/shared"
import { log } from "../utils/logger"
import { getPlayerManagers, getRaceManager } from "../network/handlers"
import { broadcast } from "../network/websocket"
import { computeLeaderboard, updateLeaderboardState, createLeaderboardState } from "../state/leaderboard"
import { ServerMessage } from "@race-wars/shared"

let tickCount = 0
let leaderboardState = createLeaderboardState()

export function startTick(): void {
  setInterval(() => {
    processTick()
  }, CONFIG.TICK_RATE)
}

function processTick(): void {
  tickCount++
  
  const raceManager = getRaceManager()
  if (!raceManager) {
    return
  }

  const playerManagers = getPlayerManagers()
  
  // Process player updates
  // TODO: Process queued position updates
  
  // Compute leaderboard
  const players = raceManager.getAllPlayers()
  const newEntries = computeLeaderboard(players, raceManager.race.route.totalLength, raceManager.race.route.isLoop)
  leaderboardState = updateLeaderboardState(leaderboardState, newEntries)
  
  // Broadcast leaderboard (every tick for now, could be throttled)
  if (tickCount % 1 === 0) {
    broadcastLeaderboard()
  }
  
  // Broadcast position batch (every tick)
  broadcastPositionBatch(players)
  
  log(`Tick ${tickCount}: ${players.length} players`)
}

function broadcastLeaderboard(): void {
  const message: ServerMessage = {
    type: "LEADERBOARD",
    leaderboard: leaderboardState.entries,
    seq: leaderboardState.version,
    timestamp: Date.now()
  }
  
  broadcast(JSON.stringify(message))
}

function broadcastPositionBatch(players: any[]): void {
  const message: ServerMessage = {
    type: "POSITION_BATCH",
    players,
    seq: tickCount,
    timestamp: Date.now()
  }
  
  broadcast(JSON.stringify(message))
}
