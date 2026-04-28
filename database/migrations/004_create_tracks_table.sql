-- Migration: Create tracks table
-- Description: Stores predefined track definitions for track days

-- Create tracks table
CREATE TABLE IF NOT EXISTS tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    description TEXT,
    location_name VARCHAR(255),
    location_country VARCHAR(100),
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    length_meters DECIMAL(8, 2) CHECK (length_meters > 0),
    track_type VARCHAR(30) DEFAULT 'circuit' CHECK (track_type IN ('circuit', 'street_circuit', 'oval', 'road_course', 'rally')),
    difficulty_level VARCHAR(20) DEFAULT 'intermediate' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    -- Spatial data for the track
    centerline GEOMETRY(LINESTRING, 4326), -- Track centerline
    boundaries GEOMETRY(POLYGON, 4326), -- Track boundaries
    start_finish_line GEOMETRY(LINESTRING, 4326), -- Start/finish line
    pit_lane GEOMETRY(LINESTRING, 4326), -- Pit lane geometry
    marshal_zones GEOMETRY(MULTIPOLYGON, 4326), -- Marshal zones
    -- Track configuration
    num_corners INTEGER CHECK (num_corners > 0),
    max_speed_kmh INTEGER CHECK (max_speed_kmh > 0),
    typical_lap_time_seconds INTEGER CHECK (typical_lap_time_seconds > 0),
    -- Sector information
    sector_splits JSONB DEFAULT '[]', -- Array of sector split points
    -- Track metadata
    image_url VARCHAR(500),
    elevation_profile_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    tags TEXT[],
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tracks_name ON tracks(name);
CREATE INDEX IF NOT EXISTS idx_tracks_location_country ON tracks(location_country);
CREATE INDEX IF NOT EXISTS idx_tracks_track_type ON tracks(track_type);
CREATE INDEX IF NOT EXISTS idx_tracks_difficulty_level ON tracks(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_tracks_is_active ON tracks(is_active);
CREATE INDEX IF NOT EXISTS idx_tracks_is_featured ON tracks(is_featured);
CREATE INDEX IF NOT EXISTS idx_tracks_location ON tracks USING GIST(ST_Point(location_lng, location_lat));
CREATE INDEX IF NOT EXISTS idx_tracks_centerline ON tracks USING GIST(centerline);
CREATE INDEX IF NOT EXISTS idx_tracks_boundaries ON tracks USING GIST(boundaries);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_tracks_updated_at 
    BEFORE UPDATE ON tracks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read active tracks
CREATE POLICY tracks_public_read ON tracks
    FOR SELECT
    TO public
    USING (is_active = true);

-- Policy: Track creators can manage their own tracks
CREATE POLICY tracks_creator_manage ON tracks
    FOR ALL
    TO authenticated
    USING (created_by = current_setting('app.current_user_id')::uuid);

-- Policy: Admins can manage all tracks
CREATE POLICY tracks_admin_all ON tracks
    FOR ALL
    TO admin
    USING (true);
