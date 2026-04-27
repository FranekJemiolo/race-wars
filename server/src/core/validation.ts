import { CONFIG } from "@race-wars/shared"

export interface ValidationResult {
  valid: boolean
  reason?: string
}

/**
 * Validates GPS input coordinates.
 */
export function validateGPS(lat: number, lon: number): ValidationResult {
  if (!isFinite(lat) || !isFinite(lon)) {
    return { valid: false, reason: "INVALID_COORDINATES" }
  }

  if (lat < -90 || lat > 90) {
    return { valid: false, reason: "LATITUDE_OUT_OF_RANGE" }
  }

  if (lon < -180 || lon > 180) {
    return { valid: false, reason: "LONGITUDE_OUT_OF_RANGE" }
  }

  return { valid: true }
}

/**
 * Validates timestamp and time delta.
 */
export function validateTimestamp(timestamp: number, lastTimestamp: number): ValidationResult {
  if (timestamp <= lastTimestamp) {
    return { valid: false, reason: "STALE_UPDATE" }
  }

  const timeDelta = timestamp - lastTimestamp

  if (timeDelta <= 0) {
    return { valid: false, reason: "INVALID_TIME_DELTA" }
  }

  if (timeDelta > 5000) {
    return { valid: false, reason: "TIME_DELTA_TOO_LARGE" }
  }

  return { valid: true }
}

/**
 * Validates speed against maximum threshold.
 */
export function validateSpeed(speed: number): ValidationResult {
  if (speed < 0) {
    return { valid: false, reason: "NEGATIVE_SPEED" }
  }

  if (speed > CONFIG.MAX_SPEED) {
    return { valid: false, reason: "SPEED_EXCEEDS_MAXIMUM" }
  }

  return { valid: true }
}

/**
 * Validates GPS accuracy.
 */
export function validateAccuracy(accuracy?: number): ValidationResult {
  if (accuracy === undefined) {
    return { valid: true } // Accuracy not provided, assume valid
  }

  if (accuracy < 0) {
    return { valid: false, reason: "NEGATIVE_ACCURACY" }
  }

  if (accuracy > CONFIG.GPS_ACCURACY_THRESHOLD) {
    return { valid: false, reason: "ACCURACY_TOO_LOW" }
  }

  return { valid: true }
}

/**
 * Comprehensive input validation.
 */
export function validateInput(
  lat: number,
  lon: number,
  timestamp: number,
  lastTimestamp: number,
  speed: number,
  accuracy?: number
): ValidationResult {
  const gpsResult = validateGPS(lat, lon)
  if (!gpsResult.valid) return gpsResult

  const timeResult = validateTimestamp(timestamp, lastTimestamp)
  if (!timeResult.valid) return timeResult

  const speedResult = validateSpeed(speed)
  if (!speedResult.valid) return speedResult

  const accuracyResult = validateAccuracy(accuracy)
  if (!accuracyResult.valid) return accuracyResult

  return { valid: true }
}

/**
 * Detects teleport/speed anomaly.
 */
export function detectTeleport(
  distance: number,
  timeDelta: number,
  maxSpeed: number = CONFIG.MAX_SPEED
): boolean {
  const maxPossibleDistance = (maxSpeed * 1000 / 3600) * (timeDelta / 1000)
  return distance > maxPossibleDistance * 2 // Allow 2x margin for GPS noise
}

/**
 * Detects unrealistic acceleration.
 */
export function detectAccelerationAnomaly(
  currentSpeed: number,
  previousSpeed: number,
  timeDelta: number
): boolean {
  const acceleration = Math.abs(currentSpeed - previousSpeed) / (timeDelta / 1000)
  const maxAcceleration = 20 // m/s² (approx 2g)
  return acceleration > maxAcceleration
}
