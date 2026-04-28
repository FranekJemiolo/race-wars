-- Migration: Create custom_routes table
-- Description: Stores admin-defined custom race routes

-- Create custom_routes table
CREATE TABLE IF NOT EXISTS custom_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    route_type VARCHAR(20) NOT NULL CHECK (route_type IN ('SPRINT', 'CHECKPOINT', 'FREE_ROAM', 'TIME_ATTACK_LOOP')),
    -- Route geometry
    centerline GEOMETRY(LINESTRING, 4326), -- Primary route path
    boundaries GEOMETRY(POLYGON, 4326), -- Route boundaries (optional)
    start_point GEOMETRY(POINT, 4326) NOT NULL, -- Start location
    finish_point GEOMETRY(POINT, 4326) NOT NULL, -- Finish location
    -- Route configuration
    length_meters DECIMAL(8, 2) CHECK (length_meters > 0),
    estimated_time_seconds INTEGER CHECK (estimated_time_seconds > 0),
    max_speed_kmh INTEGER CHECK (max_speed_kmh > 0),
    difficulty_level VARCHAR(20) DEFAULT 'intermediate' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    -- Route validation
    min_distance_meters DECIMAL(8, 2) CHECK (min_distance_meters > 0),
    gps_tolerance_meters DECIMAL(5, 2) DEFAULT 15.0 CHECK (gps_tolerance_meters > 0),
    direction_required BOOLEAN DEFAULT true,
    -- Metadata
    location_name VARCHAR(255),
    location_address TEXT,
    image_url VARCHAR(500),
    elevation_profile_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_routes_name ON custom_routes(name);
CREATE INDEX IF NOT EXISTS idx_custom_routes_created_by ON custom_routes(created_by);
CREATE INDEX IF NOT EXISTS idx_custom_routes_route_type ON custom_routes(route_type);
CREATE INDEX IF NOT EXISTS idx_custom_routes_difficulty_level ON custom_routes(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_custom_routes_is_active ON custom_routes(is_active);
CREATE INDEX IF NOT EXISTS idx_custom_routes_is_public ON custom_routes(is_public);
CREATE INDEX IF NOT EXISTS idx_custom_routes_centerline ON custom_routes USING GIST(centerline);
CREATE INDEX IF NOT EXISTS idx_custom_routes_start_point ON custom_routes USING GIST(start_point);
CREATE INDEX IF NOT EXISTS idx_custom_routes_finish_point ON custom_routes USING GIST(finish_point);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_custom_routes_updated_at 
    BEFORE UPDATE ON custom_routes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE custom_routes ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read public routes
CREATE POLICY custom_routes_public_read ON custom_routes
    FOR SELECT
    TO public
    USING (is_public = true);

-- Policy: Route creators can manage their own routes
CREATE POLICY custom_routes_creator_manage ON custom_routes
    FOR ALL
    TO authenticated
    USING (created_by = current_setting('app.current_user_id')::uuid);

-- Policy: Admins can manage all routes
CREATE POLICY custom_routes_admin_all ON custom_routes
    FOR ALL
    TO admin
    USING (true);
