-- Base tables for Race Wars database
-- These are the core tables needed for the application

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(200),
    phone VARCHAR(20),
    date_of_birth DATE,
    license_number VARCHAR(50),
    license_expiry DATE,
    experience_level VARCHAR(20) CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'professional')),
    profile_image_url TEXT,
    bio TEXT,
    preferences JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tracks table
CREATE TABLE IF NOT EXISTS tracks (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location_name VARCHAR(255),
    location_country VARCHAR(100),
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    track_type VARCHAR(50) CHECK (track_type IN ('road_circuit', 'street_circuit', 'off_road', 'mixed')),
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'intermediate', 'hard', 'expert')),
    distance_meters INTEGER,
    elevation_gain INTEGER,
    best_lap_time DECIMAL(8, 3), -- in seconds
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(255) PRIMARY KEY,
    track_id VARCHAR(255) REFERENCES tracks(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    session_type VARCHAR(50) CHECK (session_type IN ('practice', 'qualifying', 'race', 'track_day')),
    scheduled_start TIMESTAMP WITH TIME ZONE,
    scheduled_end TIMESTAMP WITH TIME ZONE,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    max_participants INTEGER,
    status VARCHAR(20) CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
    created_by VARCHAR(255) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Session participants table
CREATE TABLE IF NOT EXISTS session_participants (
    id VARCHAR(255) PRIMARY KEY,
    session_id VARCHAR(255) REFERENCES sessions(id) ON DELETE CASCADE,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    car_number INTEGER,
    status VARCHAR(20) CHECK (status IN ('registered', 'checked_in', 'on_track', 'finished', 'dnf', 'dns')) DEFAULT 'registered',
    current_lat DECIMAL(10, 8),
    current_lng DECIMAL(11, 8),
    current_speed_kmh DECIMAL(6, 2),
    current_heading DECIMAL(5, 2),
    last_position_update TIMESTAMP WITH TIME ZONE,
    position INTEGER,
    current_lap INTEGER DEFAULT 1,
    total_laps INTEGER,
    best_lap_time DECIMAL(8, 3),
    last_lap_time DECIMAL(8, 3),
    finish_time TIMESTAMP WITH TIME ZONE,
    penalty_points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, user_id)
);

-- Enforcement zones table
CREATE TABLE IF NOT EXISTS enforcement_zones (
    id VARCHAR(255) PRIMARY KEY,
    track_id VARCHAR(255) REFERENCES tracks(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    zone_type VARCHAR(50) CHECK (zone_type IN ('speed_trap', 'pit_lane', 'speed_limit_zone', 'no_passing_zone')),
    start_distance INTEGER, -- meters from start/finish
    end_distance INTEGER, -- meters from start/finish
    speed_limit_kmh INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sectors table for flag management
CREATE TABLE IF NOT EXISTS sectors (
    id VARCHAR(255) PRIMARY KEY,
    track_id VARCHAR(255) REFERENCES tracks(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sector_order INTEGER NOT NULL,
    start_distance INTEGER, -- meters from start/finish
    end_distance INTEGER, -- meters from start/finish
    marshal_zone_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Marshal zones table
CREATE TABLE IF NOT EXISTS marshal_zones (
    id VARCHAR(255) PRIMARY KEY,
    sector_id VARCHAR(255) REFERENCES sectors(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    position_lat DECIMAL(10, 8) NOT NULL,
    position_lng DECIMAL(11, 8) NOT NULL,
    radio_channel VARCHAR(50),
    primary_contact VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Checkpoints table
CREATE TABLE IF NOT EXISTS checkpoints (
    id VARCHAR(255) PRIMARY KEY,
    track_id VARCHAR(255) REFERENCES tracks(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    checkpoint_order INTEGER NOT NULL,
    position_lat DECIMAL(10, 8) NOT NULL,
    position_lng DECIMAL(11, 8) NOT NULL,
    radius_meters INTEGER DEFAULT 10,
    is_mandatory BOOLEAN DEFAULT true,
    time_limit_seconds INTEGER, -- NULL for no time limit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Custom routes table
CREATE TABLE IF NOT EXISTS custom_routes (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    route_type VARCHAR(50) CHECK (route_type IN ('training', 'leisure', 'challenge', 'commute')),
    is_public BOOLEAN DEFAULT false,
    total_distance_meters INTEGER,
    estimated_time_minutes INTEGER,
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'intermediate', 'hard')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Custom route points table
CREATE TABLE IF NOT EXISTS custom_route_points (
    id VARCHAR(255) PRIMARY KEY,
    route_id VARCHAR(255) REFERENCES custom_routes(id) ON DELETE CASCADE,
    point_order INTEGER NOT NULL,
    position_lat DECIMAL(10, 8) NOT NULL,
    position_lng DECIMAL(11, 8) NOT NULL,
    radius_meters INTEGER DEFAULT 50,
    instruction TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) CHECK (event_type IN ('race', 'track_day', 'training', 'social')),
    location_name VARCHAR(255),
    location_country VARCHAR(100),
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    max_participants INTEGER,
    registration_fee DECIMAL(10, 2),
    is_public BOOLEAN DEFAULT true,
    created_by VARCHAR(255) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    enable_email BOOLEAN DEFAULT true,
    enable_push BOOLEAN DEFAULT true,
    enable_in_app BOOLEAN DEFAULT true,
    race_notifications BOOLEAN DEFAULT true,
    flag_notifications BOOLEAN DEFAULT true,
    penalty_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_track_id ON sessions(track_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_session_participants_session_id ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_user_id ON session_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_enforcement_zones_track_id ON enforcement_zones(track_id);
CREATE INDEX IF NOT EXISTS idx_sectors_track_id ON sectors(track_id);
CREATE INDEX IF NOT EXISTS idx_checkpoints_track_id ON checkpoints(track_id);
CREATE INDEX IF NOT EXISTS idx_custom_routes_user_id ON custom_routes(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_routes_public ON custom_routes(is_public);
CREATE INDEX IF NOT EXISTS idx_custom_route_points_route_id ON custom_route_points(route_id);
CREATE INDEX IF NOT EXISTS idx_events_public ON events(is_public);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);

-- Update timestamps function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tracks_updated_at BEFORE UPDATE ON tracks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_participants_updated_at BEFORE UPDATE ON session_participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enforcement_zones_updated_at BEFORE UPDATE ON enforcement_zones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sectors_updated_at BEFORE UPDATE ON sectors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marshal_zones_updated_at BEFORE UPDATE ON marshal_zones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checkpoints_updated_at BEFORE UPDATE ON checkpoints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_routes_updated_at BEFORE UPDATE ON custom_routes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
