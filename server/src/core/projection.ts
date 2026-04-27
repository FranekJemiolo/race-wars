import * as turf from "@turf/turf"
import { LatLng, ProjectionResult } from "@race-wars/shared"
import { CONFIG } from "@race-wars/shared"

export type Route = LatLng[]

export interface ProjectionInput {
  position: LatLng
  route: Route
  lastSegmentIndex: number
}

/**
 * Projects a GPS point onto the nearest segment of a route polyline.
 * Uses local segment window search for performance.
 */
export function projectToRoute(
  position: LatLng,
  route: Route,
  lastSegmentIndex: number = 0
): ProjectionResult {
  // Step 1: Build Turf point
  const pt = turf.point([position.lon, position.lat])

  // Step 2: Local segment window search
  const WINDOW = CONFIG.PROJECTION_WINDOW
  const start = Math.max(0, lastSegmentIndex - WINDOW)
  const end = Math.min(route.length - 1, lastSegmentIndex + WINDOW)

  let best: ProjectionResult | null = null

  // Step 3: Find best segment match
  for (let i = start; i < end - 1; i++) {
    const a = route[i]
    const b = route[i + 1]

    const line = turf.lineString([
      [a.lon, a.lat],
      [b.lon, b.lat]
    ])

    const snapped = turf.nearestPointOnLine(line, pt, {
      units: "meters"
    })

    const dist = snapped.properties.distance ?? 0

    const candidate: ProjectionResult = {
      point: {
        lat: snapped.geometry.coordinates[1],
        lon: snapped.geometry.coordinates[0]
      },
      segmentIndex: i,
      progress: 0, // Computed later
      distanceToRoute: dist,
      confidence: 1 / (1 + dist)
    }

    if (!best || candidate.distanceToRoute < best.distanceToRoute) {
      best = candidate
    }
  }

  if (!best) {
    throw new Error("Projection failed: no valid segment found")
  }

  // Step 4: Compute cumulative progress
  let progress = 0

  for (let i = 0; i < best.segmentIndex; i++) {
    const a = route[i]
    const b = route[i + 1]

    progress += turf.distance(
      turf.point([a.lon, a.lat]),
      turf.point([b.lon, b.lat]),
      { units: "meters" }
    )
  }

  // Add in-segment offset
  const segA = route[best.segmentIndex]
  const segB = route[best.segmentIndex + 1]

  const totalSeg = turf.distance(
    turf.point([segA.lon, segA.lat]),
    turf.point([segB.lon, segB.lat]),
    { units: "meters" }
  )

  const partial = turf.distance(
    turf.point([segA.lon, segA.lat]),
    turf.point([best.point.lon, best.point.lat]),
    { units: "meters" }
  )

  progress += Math.min(partial, totalSeg)

  return {
    ...best,
    progress
  }
}

/**
 * Fallback full route scan when window search fails.
 */
export function projectToRouteFullScan(
  position: LatLng,
  route: Route
): ProjectionResult {
  const pt = turf.point([position.lon, position.lat])
  let best: ProjectionResult | null = null

  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i]
    const b = route[i + 1]

    const line = turf.lineString([
      [a.lon, a.lat],
      [b.lon, b.lat]
    ])

    const snapped = turf.nearestPointOnLine(line, pt, {
      units: "meters"
    })

    const dist = snapped.properties.distance ?? 0

    const candidate: ProjectionResult = {
      point: {
        lat: snapped.geometry.coordinates[1],
        lon: snapped.geometry.coordinates[0]
      },
      segmentIndex: i,
      progress: 0,
      distanceToRoute: dist,
      confidence: 1 / (1 + dist)
    }

    if (!best || candidate.distanceToRoute < best.distanceToRoute) {
      best = candidate
    }
  }

  if (!best) {
    throw new Error("Projection failed: no valid segment found in full scan")
  }

  // Compute progress
  let progress = 0
  for (let i = 0; i < best.segmentIndex; i++) {
    const a = route[i]
    const b = route[i + 1]
    progress += turf.distance(
      turf.point([a.lon, a.lat]),
      turf.point([b.lon, b.lat]),
      { units: "meters" }
    )
  }

  const segA = route[best.segmentIndex]
  const segB = route[best.segmentIndex + 1]
  const totalSeg = turf.distance(
    turf.point([segA.lon, segA.lat]),
    turf.point([segB.lon, segB.lat]),
    { units: "meters" }
  )
  const partial = turf.distance(
    turf.point([segA.lon, segA.lat]),
    turf.point([best.point.lon, best.point.lat]),
    { units: "meters" }
  )
  progress += Math.min(partial, totalSeg)

  return {
    ...best,
    progress
  }
}
