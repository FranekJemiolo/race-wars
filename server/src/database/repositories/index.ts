/**
 * Database Repository Index
 * 
 * Exports all repository classes for centralized access to database operations.
 * This provides a clean interface for the rest of the application to interact
 * with the database without needing to know about the underlying SQL queries.
 */

export { UserRepository, userRepository } from './user.repository'
export { EventRepository, eventRepository } from './event.repository'
export { TrackRepository, trackRepository } from './track.repository'
export { SessionRepository, sessionRepository } from './session.repository'

// Re-export commonly used types
export type { User, CreateUserInput, UpdateUserInput } from './user.repository'
export type { Event, CreateEventInput, UpdateEventInput } from './event.repository'
export type { Track, CreateTrackInput, UpdateTrackInput } from './track.repository'
export type { Session, CreateSessionInput, UpdateSessionInput } from './session.repository'
