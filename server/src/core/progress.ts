import { CONFIG } from "@race-wars/shared"

/**
 * Computes progress delta with rate limiting to prevent unrealistic jumps.
 */
export function computeProgressDelta(
  currentProgress: number,
  newProgress: number,
  speed: number,
  timeDelta: number
): number {
  const delta = newProgress - currentProgress
  
  // Allow backward movement for small regressions
  if (delta < 0 && delta > -10) {
    return delta
  }
  
  // Clamp forward movement
  if (delta > 0) {
    const maxDelta = speed * (timeDelta / 1000) * CONFIG.PROGRESS_CLAMP_FACTOR
    const clampedDelta = Math.min(delta, maxDelta, CONFIG.MAX_PROGRESS_DELTA)
    return Math.max(0, clampedDelta)
  }
  
  return 0
}

/**
 * Clamps progress to route bounds.
 */
export function clampProgress(progress: number, routeLength: number): number {
  return Math.max(0, Math.min(progress, routeLength))
}

/**
 * Applies floating-point drift correction by recomputing from projection.
 */
export function correctProgressDrift(
  computedProgress: number,
  accumulatedProgress: number,
  tickCount: number
): number {
  // Every 100 ticks, use computed progress to correct drift
  if (tickCount % 100 === 0) {
    return computedProgress
  }
  return accumulatedProgress
}

/**
 * Checks if progress should be frozen due to zero speed.
 */
export function shouldFreezeProgress(speed: number, stationaryTicks: number): boolean {
  if (speed < CONFIG.LOW_SPEED_THRESHOLD) {
    return stationaryTicks > 5
  }
  return false
}
