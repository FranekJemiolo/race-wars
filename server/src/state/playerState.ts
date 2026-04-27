import { Player, PlayerState, LatLng } from "@race-wars/shared"
import { CONFIG } from "@race-wars/shared"
import { log } from "../utils/logger"

export interface PlayerStateManager {
  player: Player
  transitionState(newState: PlayerState): void
  updatePosition(position: LatLng, projectedPosition: LatLng): void
  updateProgress(progress: number, segmentIndex: number): void
  updateSpeed(speed: number): void
  updateLastUpdate(timestamp: number): void
  isStateValid(targetState: PlayerState): boolean
}

/**
 * Creates a new player state manager.
 */
export function createPlayerManager(player: Player): PlayerStateManager {
  return {
    player,
    
    transitionState(newState: PlayerState) {
      const oldState = player.state
      
      if (!canTransition(oldState, newState)) {
        log(`Invalid state transition for player ${player.id}: ${oldState} -> ${newState}`)
        return
      }
      
      player.state = newState
      log(`Player ${player.id} state transition: ${oldState} -> ${newState}`)
    },
    
    updatePosition(position: LatLng, projectedPosition: LatLng) {
      player.position = position
      player.projectedPosition = projectedPosition
    },
    
    updateProgress(progress: number, segmentIndex: number) {
      player.progress = progress
      player.progressSegment = segmentIndex
    },
    
    updateSpeed(speed: number) {
      player.speed = speed
    },
    
    updateLastUpdate(timestamp: number) {
      player.lastUpdate = timestamp
    },
    
    isStateValid(targetState: PlayerState) {
      return canTransition(player.state, targetState)
    }
  }
}

/**
 * Validates if player can transition to target state.
 */
function canTransition(currentState: PlayerState, targetState: PlayerState): boolean {
  const validTransitions: Record<PlayerState, PlayerState[]> = {
    NOT_JOINED: ["READY", "DISCONNECTED"],
    READY: ["ARMED", "DISCONNECTED"],
    ARMED: ["RACING", "READY", "DISCONNECTED"],
    RACING: ["OFF_ROUTE", "FINISHED", "DISQUALIFIED", "STALLED", "DISCONNECTED"],
    OFF_ROUTE: ["RACING", "DISQUALIFIED", "DISCONNECTED"],
    FINISHED: ["DISCONNECTED"],
    DISCONNECTED: ["READY", "DISQUALIFIED"],
    DISQUALIFIED: [],
    STALLED: ["RACING", "DISQUALIFIED", "DISCONNECTED"]
  }
  
  return validTransitions[currentState].includes(targetState)
}

/**
 * Creates a new player instance.
 */
export function createPlayer(id: string, name: string, initialPosition: LatLng): Player {
  return {
    id,
    name,
    state: "NOT_JOINED",
    position: initialPosition,
    projectedPosition: initialPosition,
    progress: 0,
    progressSegment: 0,
    speed: 0,
    lastUpdate: Date.now()
  }
}

/**
 * Checks if player is stalled (no movement for extended period).
 */
export function isPlayerStalled(player: Player, now: number): boolean {
  const timeSinceUpdate = now - player.lastUpdate
  return timeSinceUpdate > CONFIG.STALLED_TIMEOUT
}

/**
 * Checks if player should be disqualified.
 */
export function shouldDisqualify(player: Player, reason: string): boolean {
  // Disqualification logic based on various conditions
  switch (reason) {
    case "OFF_ROUTE_TOO_LONG":
      return true
    case "CHECKPOINT_ORDER_VIOLATION":
      return true
    case "SPEED_ANOMALY":
      return true
    default:
      return false
  }
}

/**
 * Computes player state hash for divergence detection.
 */
export function computePlayerStateHash(player: Player): string {
  const data = `${player.id}:${player.state}:${player.progress.toFixed(2)}:${player.speed.toFixed(2)}`
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}
