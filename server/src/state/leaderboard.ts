import { Player, LeaderboardEntry } from "@race-wars/shared"
import { CONFIG } from "@race-wars/shared"

export interface LeaderboardState {
  entries: LeaderboardEntry[]
  lastUpdated: number
  version: number
}

/**
 * Computes leaderboard from player states.
 */
export function computeLeaderboard(players: Player[], routeLength: number, isLoop: boolean): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = players.map(player => {
    const rank = 0 // Will be assigned after sorting
    return {
      playerId: player.id,
      name: player.name,
      rank,
      progress: player.progress,
      lap: 0, // Will be computed from lap state if available
      finished: player.state === "FINISHED",
      finishTime: player.state === "FINISHED" ? player.lastUpdate : undefined
    }
  })

  // Sort players
  entries.sort((a, b) => {
    // Finished players sort by finish time
    if (a.finished && b.finished) {
      return (a.finishTime || 0) - (b.finishTime || 0)
    }
    
    // Finished players always above active players
    if (a.finished) return -1
    if (b.finished) return 1
    
    // Active players sort by progress (or lap score for loops)
    if (isLoop) {
      return b.lap * routeLength + b.progress - (a.lap * routeLength + a.progress)
    }
    
    return b.progress - a.progress
  })

  // Assign ranks with tie-breaking
  let currentRank = 1
  for (let i = 0; i < entries.length; i++) {
    if (i > 0) {
      const prev = entries[i - 1]
      const curr = entries[i]
      
      // Check if tied (within 5m threshold)
      const progressDiff = Math.abs(prev.progress - curr.progress)
      if (progressDiff < 5 && prev.finished === curr.finished) {
        curr.rank = prev.rank
      } else {
        currentRank++
        curr.rank = currentRank
      }
    } else {
      entries[i].rank = 1
    }
  }

  return entries
}

/**
 * Creates a new leaderboard state.
 */
export function createLeaderboardState(): LeaderboardState {
  return {
    entries: [],
    lastUpdated: 0,
    version: 0
  }
}

/**
 * Updates leaderboard state with new entries.
 */
export function updateLeaderboardState(
  state: LeaderboardState,
  entries: LeaderboardEntry[]
): LeaderboardState {
  // Anti-jitter: only update if significant change
  if (entries.length === state.entries.length) {
    let significantChange = false
    
    for (let i = 0; i < entries.length; i++) {
      const oldEntry = state.entries[i]
      const newEntry = entries[i]
      
      if (oldEntry.rank !== newEntry.rank) {
        significantChange = true
        break
      }
      
      const progressDiff = Math.abs(oldEntry.progress - newEntry.progress)
      if (progressDiff > 5) {
        significantChange = true
        break
      }
    }
    
    if (!significantChange) {
      return state
    }
  }
  
  return {
    entries,
    lastUpdated: Date.now(),
    version: state.version + 1
  }
}

/**
 * Computes leaderboard snapshot hash for consistency check.
 */
export function computeLeaderboardHash(entries: LeaderboardEntry[]): string {
  const data = entries.map(e => `${e.playerId}:${e.rank}:${e.progress.toFixed(2)}`).join("|")
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

/**
 * Filters leaderboard to exclude stale/inactive players.
 */
export function filterActiveLeaderboard(
  entries: LeaderboardEntry[],
  now: number,
  staleThreshold: number = CONFIG.MAX_UPDATE_GAP
): LeaderboardEntry[] {
  return entries.filter(entry => {
    if (entry.finished) return true
    if (!entry.finishTime) return true
    return (now - entry.finishTime) < staleThreshold
  })
}
