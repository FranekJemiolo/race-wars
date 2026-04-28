-- Migration: Create events table
-- Description: Stores track day and custom race events

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('TRACK_DAY', 'CUSTOM_RACE')),
    organizer_id UUID NOT NULL REFERENCES users(id),
    track_id UUID REFERENCES tracks(id), -- NULL for custom races
    custom_route_id UUID REFERENCES custom_routes(id), -- NULL for track days
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    registration_open_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    registration_close_time TIMESTAMP WITH TIME ZONE,
    max_participants INTEGER DEFAULT 100 CHECK (max_participants > 0),
    current_participants INTEGER DEFAULT 0 CHECK (current_participants >= 0),
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'ONGOING', 'COMPLETED', 'CANCELLED')),
    rules JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    location_name VARCHAR(255),
    location_address TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    waiver_required BOOLEAN DEFAULT true,
    waiver_text TEXT,
    is_public BOOLEAN DEFAULT true,
    featured_image_url VARCHAR(500),
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_track_id ON events(track_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_is_public ON events(is_public);
CREATE INDEX IF NOT EXISTS idx_events_location ON events USING GIST(ST_Point(location_lng, location_lat));

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON events 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can see public events
CREATE POLICY events_public_read ON events
    FOR SELECT
    TO public
    USING (is_public = true);

-- Policy: Organizers can manage their own events
CREATE POLICY events_organizer_manage ON events
    FOR ALL
    TO authenticated
    USING (organizer_id = current_setting('app.current_user_id')::uuid);

-- Policy: Admins can manage all events
CREATE POLICY events_admin_all ON events
    FOR ALL
    TO admin
    USING (true);
