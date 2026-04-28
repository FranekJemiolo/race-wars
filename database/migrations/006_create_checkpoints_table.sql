-- Migration: Create checkpoints table
-- Description: Stores checkpoint definitions for custom races

-- Create checkpoints table
CREATE TABLE IF NOT EXISTS checkpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES custom_routes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    position GEOMETRY(POINT, 4326) NOT NULL, -- GPS location
    order_index INTEGER NOT NULL CHECK (order_index > 0),
    radius_meters DECIMAL(5, 2) DEFAULT 20.0 CHECK (radius_meters > 0 AND radius_meters <= 100),
    checkpoint_type VARCHAR(20) DEFAULT 'STANDARD' CHECK (checkpoint_type IN ('STANDARD', 'START', 'FINISH', 'TIMING', 'OPTIONAL')),
    is_mandatory BOOLEAN DEFAULT true,
    min_speed_kmh INTEGER CHECK (min_speed_kmh > 0), -- Minimum speed to trigger
    max_speed_kmh INTEGER CHECK (max_speed_kmh > 0), -- Maximum speed allowed
    time_limit_seconds INTEGER CHECK (time_limit_seconds > 0), -- Time limit to reach this checkpoint
    points INTEGER DEFAULT 0, -- Points awarded for checkpoint
    -- Spatial configuration
    trigger_direction DECIMAL(3, 1), -- Required direction in degrees (0-360, NULL for any)
    trigger_width_meters DECIMAL(5, 2) DEFAULT 20.0 CHECK (trigger_width_meters > 0), -- Width of trigger zone
    -- Metadata
    icon_url VARCHAR(500),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(route_id, order_index)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_checkpoints_route_id ON checkpoints(route_id);
CREATE INDEX IF NOT EXISTS idx_checkpoints_position ON checkpoints USING GIST(position);
CREATE INDEX IF NOT EXISTS idx_checkpoints_order_index ON checkpoints(order_index);
CREATE INDEX IF NOT EXISTS idx_checkpoints_checkpoint_type ON checkpoints(checkpoint_type);
CREATE INDEX IF NOT EXISTS idx_checkpoints_is_active ON checkpoints(is_active);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_checkpoints_updated_at 
    BEFORE UPDATE ON checkpoints 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE checkpoints ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read checkpoints for public routes
CREATE POLICY checkpoints_public_read ON checkpoints
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM custom_routes cr 
            WHERE cr.id = route_id 
            AND cr.is_public = true
        )
    );

-- Policy: Route creators can manage their own checkpoints
CREATE POLICY checkpoints_creator_manage ON checkpoints
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM custom_routes cr 
            WHERE cr.id = route_id 
            AND cr.created_by = current_setting('app.current_user_id')::uuid
        )
    );

-- Policy: Admins can manage all checkpoints
CREATE POLICY checkpoints_admin_all ON checkpoints
    FOR ALL
    TO admin
    USING (true);
