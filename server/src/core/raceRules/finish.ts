import { LatLng } from "@race-wars/shared"
import { CONFIG } from "@race-wars/shared"
import { haversine, deriveHeading } from "../../utils/geo"

export interface FinishLine {
  start: LatLng
  end: LatLng
}

export interface FinishState {
  lastCrossedAt: number
  hasFinished: boolean
  finishTime?: number
}

/**
 * Detects line segment intersection between movement and finish line.
 */
function lineSegmentsIntersect(
  p1: LatLng,
  p2: LatLng,
  p3: LatLng,
  p4: LatLng
): boolean {
  const ccw = (a: LatLng, b: LatLng, c: LatLng) => {
    return (c.lon - a.lon) * (b.lat - a.lat) > (b.lon - a.lon) * (c.lat - a.lat)
  }

  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4)
}

/**
 * Computes the normal vector of the finish line.
 */
function computeFinishNormal(finishLine: FinishLine): { x: number; y: number } {
  const dx = finishLine.end.lon - finishLine.start.lon
  const dy = finishLine.end.lat - finishLine.start.lat
  const length = Math.sqrt(dx * dx + dy * dy)
  
  // Perpendicular vector
  return {
    x: -dy / length,
    y: dx / length
  }
}

/**
 * Computes the movement vector.
 */
function computeMovementVector(from: LatLng, to: LatLng): { x: number; y: number } {
  const dx = to.lon - from.lon
  const dy = to.lat - from.lat
  const length = Math.sqrt(dx * dx + dy * dy)
  
  if (length === 0) return { x: 0, y: 0 }
  
  return {
    x: dx / length,
    y: dy / length
  }
}

/**
 * Checks if finish line crossing is valid.
 */
export function checkFinishLine(
  previousPosition: LatLng,
  currentPosition: LatLng,
  finishLine: FinishLine,
  speed: number,
  progress: number,
  routeLength: number,
  state: FinishState,
  events: string[]
): FinishState {
  // Check cooldown
  const now = Date.now()
  if (now - state.lastCrossedAt < CONFIG.FINISH_LINE_COOLDOWN) {
    return state
  }

  // Check minimum progress
  if (progress < routeLength * CONFIG.MIN_FINISH_PROGRESS) {
    return state
  }

  // Check minimum speed
  if (speed < CONFIG.MIN_FINISH_SPEED) {
    return state
  }

  // Check line intersection
  if (!lineSegmentsIntersect(previousPosition, currentPosition, finishLine.start, finishLine.end)) {
    return state
  }

  // Validate direction
  const finishNormal = computeFinishNormal(finishLine)
  const movementVector = computeMovementVector(previousPosition, currentPosition)
  
  const dotProduct = movementVector.x * finishNormal.x + movementVector.y * finishNormal.y
  
  // Minimum angle constraint (30 degrees)
  const minAngle = Math.cos((30 * Math.PI) / 180)
  if (dotProduct < minAngle) {
    return state // Shallow angle crossing
  }

  // Valid finish line crossing
  state.lastCrossedAt = now
  state.hasFinished = true
  state.finishTime = now
  events.push("FINISH_LINE_CROSSED")

  return state
}

/**
 * Initializes finish state for a new player.
 */
export function initFinishState(): FinishState {
  return {
    lastCrossedAt: 0,
    hasFinished: false
  }
}

/**
 * Computes finish result hash for tamper resistance.
 */
export function computeFinishHash(
  playerId: string,
  finishTime: number,
  routeId: string
): string {
  const data = `${playerId}:${finishTime}:${routeId}`
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}
