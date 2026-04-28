/**
 * Enforcement Module Index
 * 
 * Exports all enforcement-related services for centralized access to
 * game mechanics and enforcement functionality.
 */

export { EnforcementService, enforcementService } from './enforcement.service'
export type { 
  SpeedViolation, 
  PatrolUnit, 
  HeatMapData, 
  HeatMapCell 
} from './enforcement.service'
