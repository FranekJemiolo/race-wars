-- Migration: Create enforcement_zones table
-- Description: Stores enforcement zones for custom races (speed zones, traps, patrol areas)

-- Create enforcement_zones table
CREATE TABLE IF NOT EXISTS enforcement_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES custom_routes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    zone_type VARCHAR(20) NOT NULL CHECK (zone_type IN ('SPEED_ZONE', 'SPEED_TRAP', 'RADAR_ZONE', 'PATROL_ROUTE', 'CAMERA_ZONE', 'HEAT_ZONE')),
    -- Spatial data
    geometry GEOMETRY(GEOMETRY, 4326) NOT NULL, -- Can be POINT, POLYGON, or LINESTRING
    -- Zone configuration
    speed_limit_kmh INTEGER CHECK (speed_limit_kmh > 0),
    detection_radius_meters DECIMAL(5, 2) CHECK (detection_radius_meters > 0 AND detection_radius_meters <= 200),
    trigger_direction DECIMAL(3, 1), -- Required direction in degrees (0-360, NULL for any)
    -- Patrol route specific
    patrol_speed_kmh INTEGER CHECK (patrol_speed_kmh > 0), -- For patrol units
    patrol_route GEOMETRY(LINESTRING, 4326), -- Patrol path for mobile units
    -- Penalty configuration
    penalty_type VARCHAR(20) DEFAULT 'TIME' CHECK (penalty_type IN ('TIME', 'POINTS', 'WARNING', 'NONE')),
    penalty_amount INTEGER DEFAULT 0 CHECK (penalty_amount >= 0), -- Time in seconds or points
    warning_threshold_kmh INTEGER CHECK (warning_threshold_kmh > 0), -- Speed over limit to trigger warning
    -- Detection settings
    detection_sensitivity VARCHAR(10) DEFAULT 'MEDIUM' CHECK (detection_sensitivity IN ('LOW', 'MEDIUM', 'HIGH')),
    gps_tolerance_meters DECIMAL(5, 2) DEFAULT 15.0 CHECK (gps_tolerance_meters > 0),
    active_hours_start TIME, -- When zone becomes active (optional)
    active_hours_end TIME, -- When zone becomes inactive (optional)
    -- Visual settings
    color VARCHAR(7) DEFAULT '#FF0000', -- Hex color for map display
    icon_url VARCHAR(500),
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    is_visible BOOLEAN DEFAULT true, -- Whether visible to drivers
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_enforcement_zones_route_id ON enforcement_zones(route_id);
CREATE INDEX IF NOT EXISTS idx_enforcement_zones_zone_type ON enforcement_zones(zone_type);
CREATE INDEX IF NOT EXISTS idx_enforcement_zones_geometry ON enforcement_zones USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_enforcement_zones_patrol_route ON enforcement_zones USING GIST(patrol_route);
CREATE INDEX IF NOT EXISTS idx_enforcement_zones_is_active ON enforcement_zones(is_active);
CREATE INDEX IF NOT EXISTS idx_enforcement_zones_is_visible ON enforcement_zones(is_visible);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_enforcement_zones_updated_at 
    BEFORE UPDATE ON enforcement_zones 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE enforcement_zones ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read zones for public routes
CREATE POLICY enforcement_zones_public_read ON enforcement_zones
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM custom_routes cr 
            WHERE cr.id = route_id 
            AND cr.is_public = true
        )
        AND is_visible = true
    );

-- Policy: Route creators can manage their own zones
CREATE POLICY enforcement_zones_creator_manage ON enforcement_zones
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM custom_routes cr 
            WHERE cr.id = route_id 
            AND cr.created_by = current_setting('app.current_user_id')::uuid
        )
    );

-- Policy: Admins can manage all zones
CREATE POLICY enforcement_zones_admin_all ON enforcement_zones
    FOR ALL
    TO admin
    USING (true);
