/**
 * Track Module Index
 * 
 * Exports all track-related services, controllers, and routes
 * for centralized access to track management functionality.
 */

export { TrackService, trackService } from './track.service'
export type { 
  CreateTrackInput, 
  UpdateTrackInput, 
  TrackValidationResult, 
  ProjectionResult 
} from './track.service'

export { TrackController, trackController } from './track.controller'

export { default as trackRoutes } from './routes'
