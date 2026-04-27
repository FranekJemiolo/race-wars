import { LatLng, Checkpoint, RaceRoute } from "@race-wars/shared"
import { CONFIG } from "@race-wars/shared"
import { haversine } from "../../utils/geo"

export interface RouteValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validates route geometry and structure.
 */
export function validateRoute(route: RaceRoute): RouteValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check route has points
  if (route.points.length < 2) {
    errors.push("Route must have at least 2 points")
  }

  // Check segment lengths
  for (let i = 0; i < route.points.length - 1; i++) {
    const dist = haversine(route.points[i], route.points[i + 1])
    if (dist > CONFIG.MAX_SEGMENT_LENGTH) {
      errors.push(`Segment ${i} exceeds maximum length (${dist.toFixed(1)}m > ${CONFIG.MAX_SEGMENT_LENGTH}m)`)
    }
  }

  // Check checkpoint spacing
  if (!validateCheckpointSpacing(route.checkpoints)) {
    errors.push("Checkpoints are too close together")
  }

  // Check checkpoint ordering
  for (let i = 0; i < route.checkpoints.length; i++) {
    if (route.checkpoints[i].index !== i) {
      errors.push(`Checkpoint ${i} has incorrect index`)
    }
  }

  // Check start/finish lines
  if (!route.startLine || !route.finishLine) {
    errors.push("Route must have start and finish lines")
  }

  // Check total length
  if (route.totalLength <= 0) {
    errors.push("Route total length must be positive")
  }

  // Warnings for sharp turns
  const sharpTurns = detectSharpTurns(route.points)
  if (sharpTurns > 0) {
    warnings.push(`Route contains ${sharpTurns} sharp turns`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validates checkpoint spacing.
 */
function validateCheckpointSpacing(checkpoints: Checkpoint[]): boolean {
  for (let i = 0; i < checkpoints.length - 1; i++) {
    const dist = haversine(checkpoints[i].position, checkpoints[i + 1].position)
    if (dist < CONFIG.MIN_CHECKPOINT_SPACING) {
      return false
    }
  }
  return true
}

/**
 * Detects sharp turns in route.
 */
function detectSharpTurns(points: LatLng[]): number {
  let sharpTurns = 0
  
  for (let i = 1; i < points.length - 1; i++) {
    const angle = computeTurnAngle(points[i - 1], points[i], points[i + 1])
    if (angle > 45) { // 45 degrees is considered sharp
      sharpTurns++
    }
  }
  
  return sharpTurns
}

/**
 * Computes turn angle between three points.
 */
function computeTurnAngle(p1: LatLng, p2: LatLng, p3: LatLng): number {
  const v1 = {
    x: p1.lon - p2.lon,
    y: p1.lat - p2.lat
  }
  const v2 = {
    x: p3.lon - p2.lon,
    y: p3.lat - p2.lat
  }
  
  const dot = v1.x * v2.x + v1.y * v2.y
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y)
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y)
  
  if (mag1 === 0 || mag2 === 0) return 0
  
  const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)))
  const angle = (Math.acos(cosAngle) * 180) / Math.PI
  
  return angle
}

/**
 * Computes route hash for version locking.
 */
export function computeRouteHash(route: RaceRoute): string {
  const data = JSON.stringify({
    points: route.points.map(p => ({ lat: p.lat.toFixed(6), lon: p.lon.toFixed(6) })),
    checkpoints: route.checkpoints.map(c => ({
      id: c.id,
      lat: c.position.lat.toFixed(6),
      lon: c.position.lon.toFixed(6)
    })),
    isLoop: route.isLoop
  })
  
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

/**
 * Normalizes route direction (ensures start → finish flow).
 */
export function normalizeRouteDirection(route: RaceRoute): RaceRoute {
  // Check if checkpoints are in correct order
  let needsReverse = false
  
  for (let i = 0; i < route.checkpoints.length - 1; i++) {
    const distToNext = haversine(route.checkpoints[i].position, route.checkpoints[i + 1].position)
    const distToPrev = haversine(route.checkpoints[i].position, route.checkpoints[Math.max(0, i - 1)].position)
    
    if (distToNext > distToPrev * 10) {
      needsReverse = true
      break
    }
  }
  
  if (needsReverse) {
    return {
      ...route,
      points: [...route.points].reverse(),
      checkpoints: [...route.checkpoints].reverse().map((cp, idx) => ({ ...cp, index: idx }))
    }
  }
  
  return route
}
