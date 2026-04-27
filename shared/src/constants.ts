export const CONFIG = {
  // Timing
  TICK_RATE: 1000, // ms
  HEARTBEAT_INTERVAL: 5000, // ms
  
  // GPS validation
  MAX_SPEED: 350, // km/h
  MAX_ROUTE_DISTANCE: 50, // meters
  GPS_ACCURACY_THRESHOLD: 30, // meters
  LOW_SPEED_THRESHOLD: 5, // km/h
  
  // Projection
  CHECKPOINT_RADIUS: 20, // meters
  OFF_ROUTE_THRESHOLD: 40, // meters
  PROJECTION_WINDOW: 10, // ± segments
  MAX_SEGMENT_JUMP: 15, // segments
  
  // Race rules
  MIN_CHECKPOINT_SPACING: 50, // meters
  FINISH_LINE_COOLDOWN: 5000, // ms
  CHECKPOINT_COOLDOWN: 2000, // ms
  LAP_COOLDOWN: 5000, // ms
  MIN_FINISH_SPEED: 20, // km/h
  MIN_FINISH_PROGRESS: 0.9, // 90%
  
  // Networking
  MAX_PARTICIPANTS: 100,
  MAX_UPDATES_PER_SECOND: 5,
  MAX_UPDATE_GAP: 10000, // ms
  DISCONNECT_TIMEOUT: 5000, // ms
  
  // Progress
  PROGRESS_CLAMP_FACTOR: 1.5,
  MAX_PROGRESS_DELTA: 100, // meters per tick
  
  // Interpolation
  INTERPOLATION_DELAY: 200, // ms
  SNAP_THRESHOLD: 50, // meters
  DEAD_RECKONING_MAX: 300, // ms
  
  // State
  LOCK_IN_REQUIRED_UPDATES: 3,
  LOCK_IN_DISTANCE_THRESHOLD: 30, // meters
  STALLED_TIMEOUT: 30000, // ms
  MAX_RACE_DURATION: 7200000, // 2 hours in ms
  
  // Rendering
  RENDER_FPS: 60,
  POSITION_HISTORY_SIZE: 10,
  EVENT_LOG_SIZE: 100,
  
  // Route validation
  MAX_SEGMENT_LENGTH: 50, // meters
  ROUTE_RESAMPLE_INTERVAL: 10, // meters
} as const

export type Config = typeof CONFIG
