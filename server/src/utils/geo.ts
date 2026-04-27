import { LatLng } from "@race-wars/shared"

/**
 * Haversine distance calculation between two points.
 * Returns distance in meters.
 */
export function haversine(
  a: LatLng,
  b: LatLng
): number {
  const R = 6371e3 // Earth radius in meters

  const φ1 = (a.lat * Math.PI) / 180
  const φ2 = (b.lat * Math.PI) / 180
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180
  const Δλ = ((b.lon - a.lon) * Math.PI) / 180

  const x =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2

  return 2 * R * Math.asin(Math.sqrt(x))
}

/**
 * Derives heading from two points.
 * Returns heading in degrees (0-360, where 0 is North).
 */
export function deriveHeading(from: LatLng, to: LatLng): number {
  const φ1 = (from.lat * Math.PI) / 180
  const φ2 = (to.lat * Math.PI) / 180
  const Δλ = ((to.lon - from.lon) * Math.PI) / 180

  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)

  const θ = Math.atan2(y, x)
  const heading = (θ * 180) / Math.PI

  return (heading + 360) % 360
}

/**
 * Normalizes longitude to [-180, 180] range.
 */
export function normalizeLongitude(lon: number): number {
  while (lon > 180) lon -= 360
  while (lon < -180) lon += 360
  return lon
}

/**
 * Computes angle between two vectors in degrees.
 */
export function angleBetweenVectors(
  v1: { x: number; y: number },
  v2: { x: number; y: number }
): number {
  const dot = v1.x * v2.x + v1.y * v2.y
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y)
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y)
  
  if (mag1 === 0 || mag2 === 0) return 0
  
  const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)))
  return (Math.acos(cosAngle) * 180) / Math.PI
}

/**
 * Computes speed from distance and time delta.
 * Returns speed in km/h.
 */
export function computeSpeed(distance: number, timeDelta: number): number {
  if (timeDelta <= 0) return 0
  const speedMps = distance / (timeDelta / 1000) // meters per second
  return speedMps * 3.6 // convert to km/h
}
