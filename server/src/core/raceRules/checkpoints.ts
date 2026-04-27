import { Checkpoint, PlayerRaceProgress, LatLng } from "@race-wars/shared"
import { CONFIG } from "@race-wars/shared"
import { haversine } from "../../utils/geo"

export interface CheckpointState {
  passedCheckpoints: Set<string>
  lastCheckpointPassedAt: number
  nextCheckpointIndex: number
}

/**
 * Processes checkpoint detection for a player.
 * Enforces ordered checkpoint progression.
 */
export function processCheckpoints(
  playerPosition: LatLng,
  checkpoints: Checkpoint[],
  state: CheckpointState,
  speed: number,
  events: string[]
): CheckpointState {
  const checkpoint = checkpoints[state.nextCheckpointIndex]
  
  if (!checkpoint) {
    return state // All checkpoints passed
  }

  const dist = haversine(playerPosition, checkpoint.position)
  
  // Apply tunneling fix for high speed
  const effectiveRadius = checkpoint.radius + (speed * 0.1) // 100ms speed buffer
  
  if (dist <= effectiveRadius) {
    // Check cooldown to prevent double-triggering
    const now = Date.now()
    if (now - state.lastCheckpointPassedAt < CONFIG.CHECKPOINT_COOLDOWN) {
      return state
    }

    // Validate checkpoint order (strict mode)
    if (checkpoint.index !== state.nextCheckpointIndex) {
      // Checkpoint skipped - potential cheat or GPS jump
      if (checkpoint.index > state.nextCheckpointIndex + 1) {
        events.push(`CHECKPOINT_ORDER_VIOLATION`)
        return state
      }
    }

    // Mark checkpoint as passed
    events.push(`CHECKPOINT_${checkpoint.id}_PASSED`)
    state.passedCheckpoints.add(checkpoint.id)
    state.lastCheckpointPassedAt = now
    state.nextCheckpointIndex++
  }

  return state
}

/**
 * Initializes checkpoint state for a new player.
 */
export function initCheckpointState(): CheckpointState {
  return {
    passedCheckpoints: new Set(),
    lastCheckpointPassedAt: 0,
    nextCheckpointIndex: 0
  }
}

/**
 * Validates checkpoint spacing in route definition.
 */
export function validateCheckpointSpacing(checkpoints: Checkpoint[]): boolean {
  for (let i = 0; i < checkpoints.length - 1; i++) {
    const dist = haversine(checkpoints[i].position, checkpoints[i + 1].position)
    if (dist < CONFIG.MIN_CHECKPOINT_SPACING) {
      return false
    }
  }
  return true
}

/**
 * Checks if all checkpoints have been passed.
 */
export function allCheckpointsPassed(state: CheckpointState, totalCheckpoints: number): boolean {
  return state.nextCheckpointIndex >= totalCheckpoints
}
