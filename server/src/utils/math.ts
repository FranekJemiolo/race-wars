/**
 * Exponential smoothing for GPS noise reduction.
 */
export function exponentialSmoothing(
  current: number,
  previous: number,
  alpha: number = 0.5
): number {
  return alpha * current + (1 - alpha) * previous
}

/**
 * Linear interpolation between two values.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Clamps a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Normalizes a number to specified decimal places.
 */
export function normalizePrecision(value: number, decimals: number = 6): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

/**
 * Computes moving average of array.
 */
export function movingAverage(values: number[], window: number): number {
  if (values.length === 0) return 0
  const slice = values.slice(-window)
  return slice.reduce((sum, v) => sum + v, 0) / slice.length
}

/**
 * Simple moving average filter.
 */
export class MovingAverageFilter {
  private values: number[] = []
  private window: number

  constructor(window: number = 5) {
    this.window = window
  }

  add(value: number): number {
    this.values.push(value)
    if (this.values.length > this.window) {
      this.values.shift()
    }
    return movingAverage(this.values, this.window)
  }

  reset(): void {
    this.values = []
  }
}
