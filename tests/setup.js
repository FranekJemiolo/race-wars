// Test setup for integration tests
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// Set up test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'sqlite:./data/race_wars_test.db';
process.env.DB_NAME = 'race_wars_test';
process.env.LOG_LEVEL = 'error';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-behavioral-tests';
process.env.JWT_REFRESH_SECRET = 'test-refresh-jwt-secret-key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

// Ensure test database directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create and initialize test database file
const testDbPath = path.join(dataDir, 'race_wars_test.db');
if (fs.existsSync(testDbPath)) {
  try { fs.unlinkSync(testDbPath); } catch (e) {}
}

const db = new Database(testDbPath);
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  phone TEXT,
  date_of_birth TEXT,
  license_number TEXT,
  license_expiry TEXT,
  experience_level TEXT DEFAULT 'beginner',
  profile_image_url TEXT,
  bio TEXT,
  preferences TEXT DEFAULT '{}',
  is_active INTEGER DEFAULT 1,
  email_verified INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tracks (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  short_name TEXT,
  description TEXT,
  location_name TEXT,
  location_country TEXT,
  location_lat REAL,
  location_lng REAL,
  track_type TEXT DEFAULT 'circuit',
  difficulty TEXT,
  difficulty_level TEXT DEFAULT 'beginner',
  length_meters INTEGER,
  distance_meters INTEGER,
  elevation_gain INTEGER,
  best_lap_time REAL,
  centerline TEXT,
  boundaries TEXT,
  start_finish_line TEXT,
  pit_lane TEXT,
  marshal_zones TEXT,
  num_corners INTEGER,
  max_speed_kmh REAL,
  typical_lap_time_seconds REAL,
  sector_splits TEXT DEFAULT '[]',
  image_url TEXT,
  elevation_profile_url TEXT,
  is_active INTEGER DEFAULT 1,
  is_featured INTEGER DEFAULT 0,
  tags TEXT DEFAULT '[]',
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'TRACK_DAY',
  event_type TEXT,
  organizer_id TEXT,
  track_id TEXT,
  custom_route_id TEXT,
  start_time DATETIME,
  end_time DATETIME,
  registration_open_time DATETIME,
  registration_close_time DATETIME,
  max_participants INTEGER DEFAULT 20,
  current_participants INTEGER DEFAULT 0,
  status TEXT DEFAULT 'PUBLISHED',
  rules TEXT DEFAULT '{}',
  settings TEXT DEFAULT '{}',
  location_name TEXT,
  location_address TEXT,
  location_lat REAL,
  location_lng REAL,
  waiver_required INTEGER DEFAULT 0,
  waiver_text TEXT,
  is_public INTEGER DEFAULT 1,
  featured_image_url TEXT,
  tags TEXT DEFAULT '[]',
  registration_fee REAL DEFAULT 0,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  track_id TEXT,
  event_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  session_type TEXT DEFAULT 'RACE',
  start_time DATETIME,
  end_time DATETIME,
  duration_minutes INTEGER DEFAULT 60,
  scheduled_start DATETIME,
  scheduled_end DATETIME,
  actual_start DATETIME,
  actual_end DATETIME,
  max_participants INTEGER DEFAULT 20,
  current_participants INTEGER DEFAULT 0,
  status TEXT DEFAULT 'SCHEDULED',
  race_state TEXT DEFAULT 'CREATED',
  flag_state TEXT DEFAULT 'NONE',
  lap_count_target INTEGER,
  time_limit_seconds INTEGER,
  rules TEXT DEFAULT '{}',
  settings TEXT DEFAULT '{}',
  total_laps INTEGER DEFAULT 5,
  fastest_lap_seconds REAL,
  fastest_lap_driver_id TEXT,
  created_by TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS session_participants (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  session_id TEXT,
  participant_id TEXT,
  user_id TEXT,
  car_number INTEGER,
  status TEXT DEFAULT 'REGISTERED',
  position INTEGER,
  current_lap INTEGER DEFAULT 1,
  current_sector INTEGER DEFAULT 1,
  progress_percentage REAL DEFAULT 0,
  session_start_time DATETIME,
  last_lap_start_time DATETIME,
  session_time_seconds REAL DEFAULT 0,
  total_laps INTEGER DEFAULT 0,
  best_lap_time_seconds REAL,
  best_lap_time REAL,
  last_lap_time_seconds REAL,
  last_lap_time REAL,
  best_sector_times TEXT DEFAULT '{}',
  current_lat REAL,
  current_lng REAL,
  current_speed_kmh REAL DEFAULT 0,
  current_heading REAL DEFAULT 0,
  last_position_update DATETIME,
  time_penalties_seconds REAL DEFAULT 0,
  point_penalties INTEGER DEFAULT 0,
  penalty_points INTEGER DEFAULT 0,
  blue_flags INTEGER DEFAULT 0,
  yellow_flags_shown INTEGER DEFAULT 0,
  finish_time DATETIME,
  notes TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS flags (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  session_id TEXT,
  flag_type TEXT NOT NULL,
  flag_state TEXT NOT NULL,
  sector INTEGER,
  location TEXT,
  location_description TEXT,
  flag_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  duration_seconds INTEGER,
  reason TEXT,
  incident_id TEXT,
  user_id TEXT,
  session_participant_id TEXT,
  safety_car_deployed INTEGER DEFAULT 0,
  safety_car_driver_id TEXT,
  cleared_by TEXT,
  cleared_time DATETIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS enforcement_zones (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  track_id TEXT,
  route_id TEXT,
  name TEXT NOT NULL,
  zone_type TEXT,
  geometry TEXT,
  speed_limit_kmh INTEGER,
  patrol_speed_kmh INTEGER,
  penalty_type TEXT,
  penalty_value INTEGER,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS checkpoints (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  track_id TEXT,
  route_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  position TEXT,
  order_index INTEGER DEFAULT 0,
  radius_meters REAL DEFAULT 20,
  checkpoint_type TEXT DEFAULT 'STANDARD',
  is_mandatory INTEGER DEFAULT 1,
  min_speed_kmh REAL,
  max_speed_kmh REAL,
  time_limit_seconds REAL,
  points INTEGER DEFAULT 0,
  trigger_direction REAL,
  trigger_width_meters REAL DEFAULT 20,
  icon_url TEXT,
  notes TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS car_profiles (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  color TEXT,
  license_plate TEXT,
  vin TEXT,
  horsepower INTEGER,
  top_speed_kmh REAL,
  weight_kg REAL,
  transmission TEXT,
  drivetrain TEXT,
  engine_displacement REAL,
  tire_type TEXT,
  modifications TEXT,
  notes TEXT,
  is_default INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS custom_routes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  route_type TEXT,
  centerline TEXT,
  boundaries TEXT,
  start_finish_line TEXT,
  total_distance_meters REAL,
  estimated_time_seconds REAL,
  is_public INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lap_records (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  session_id TEXT,
  session_participant_id TEXT,
  user_id TEXT,
  lap_number INTEGER,
  lap_time REAL,
  sector_1_time REAL,
  sector_2_time REAL,
  sector_3_time REAL,
  valid_lap INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  session_id TEXT,
  user_id TEXT,
  session_participant_id TEXT,
  incident_type TEXT,
  description TEXT,
  location TEXT,
  sector INTEGER,
  severity TEXT,
  status TEXT DEFAULT 'REPORTED',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS race_leaderboards (
  race_id TEXT PRIMARY KEY,
  race_name TEXT,
  status TEXT,
  start_time DATETIME,
  end_time DATETIME,
  total_participants INTEGER,
  finished_participants INTEGER,
  last_update DATETIME
);

CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  race_id TEXT,
  participant_id TEXT,
  user_id TEXT,
  current_position INTEGER,
  previous_position INTEGER,
  current_lap INTEGER,
  total_laps INTEGER,
  lap_time REAL,
  best_lap_time REAL,
  total_time REAL,
  gap_to_leader REAL,
  gap_to_previous REAL,
  last_checkpoint_time DATETIME,
  speed REAL,
  status TEXT,
  position_history TEXT,
  last_update DATETIME
);
`);

db.close();

console.log('Test environment configured with SQLite schema');
