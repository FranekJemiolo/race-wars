import { CONFIG } from "@race-wars/shared"

export interface LapState {
  currentLap: number
  lastLapTime: number
  bestLapTime: number
  lastLapCrossedAt: number
  lapTimes: number[]
}

/**
 * Detects lap completion for loop routes.
 */
export function detectLap(
  progress: number,
  routeLength: number,
  speed: number,
  state: LapState,
  events: string[]
): LapState {
  // Check if player crossed start/finish line (progress reset)
  // This is detected when progress wraps around
  const now = Date.now()
  
  // Check cooldown to prevent lap spam
  if (now - state.lastLapCrossedAt < CONFIG.LAP_COOLDOWN) {
    return state
  }

  // Check minimum speed
  if (speed < CONFIG.MIN_FINISH_SPEED) {
    return state
  }

  // Lap completion detected (progress wrapped or crossed finish)
  // This should be called when finish line crossing is detected
  state.currentLap++
  state.lastLapCrossedAt = now
  
  const lapTime = now - state.lastLapTime
  state.lastLapTime = now
  
  if (state.bestLapTime === 0 || lapTime < state.bestLapTime) {
    state.bestLapTime = lapTime
    events.push(`NEW_BEST_LAP:${lapTime}`)
  }
  
  state.lapTimes.push(lapTime)
  events.push(`LAP_COMPLETED:${state.currentLap}`)

  return state
}

/**
 * Initializes lap state for a new player.
 */
export function initLapState(): LapState {
  return {
    currentLap: 0,
    lastLapTime: Date.now(),
    bestLapTime: 0,
    lastLapCrossedAt: 0,
    lapTimes: []
  }
}

/**
 * Computes lap-based ranking score.
 */
export function computeLapScore(state: LapState, progress: number, routeLength: number): number {
  return state.currentLap * routeLength + progress
}

/**
 * Computes average lap time.
 */
export function computeAverageLapTime(state: LapState): number {
  if (state.lapTimes.length === 0) return 0
  const sum = state.lapTimes.reduce((a, b) => a + b, 0)
  return sum / state.lapTimes.length
}

/**
 * Computes consistency score (standard deviation of lap times).
 */
export function computeConsistencyScore(state: LapState): number {
  if (state.lapTimes.length < 2) return 100 // Perfect consistency with 0 or 1 lap
  
  const avg = computeAverageLapTime(state)
  const variance = state.lapTimes.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / state.lapTimes.length
  const stdDev = Math.sqrt(variance)
  
  // Convert to percentage (lower stdDev = higher consistency)
  const maxStdDev = avg * 0.5 // 50% variance is 0% consistency
  const consistency = Math.max(0, 100 - (stdDev / maxStdDev) * 100)
  
  return consistency
}
