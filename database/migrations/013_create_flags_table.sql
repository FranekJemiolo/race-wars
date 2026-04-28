-- Migration: Create flags table
-- Description: Stores flag state history for sessions

-- Create flags table
CREATE TABLE IF NOT EXISTS flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    -- Flag details
    flag_type VARCHAR(20) NOT NULL CHECK (flag_type IN (
        'GREEN', 'YELLOW', 'YELLOW_SECTOR', 'RED', 'BLUE', 
        'CHECKERED', 'BLACK', 'WHITE', 'BLACK_WHITE', 'SC_BOARD'
    )),
    flag_state VARCHAR(20) NOT NULL CHECK (flag_state IN ('SHOWN', 'REMOVED', 'FLASHING')),
    -- Location (for sector-specific flags)
    sector INTEGER CHECK (sector >= 1 AND sector <= 3), -- Which sector (for yellow flags)
    location GEOMETRY(POINT, 4326), -- GPS location of flag station
    location_description TEXT, -- Human-readable location
    -- Timing
    flag_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    duration_seconds INTEGER CHECK (duration_seconds > 0),
    -- Context
    reason TEXT, -- Why flag was shown
    incident_id UUID REFERENCES incidents(id), -- Related incident (if any)
    user_id UUID REFERENCES users(id), -- Who the flag applies to (for blue/black flags)
    session_participant_id UUID REFERENCES session_participants(id), -- Specific participant
    -- Safety car details
    safety_car_deployed BOOLEAN DEFAULT false,
    safety_car_driver_id UUID REFERENCES users(id),
    -- Resolution
    cleared_by UUID REFERENCES users(id), -- Who cleared the flag
    cleared_time TIMESTAMP WITH TIME ZONE,
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_flags_session_id ON flags(session_id);
CREATE INDEX IF NOT EXISTS idx_flags_flag_type ON flags(flag_type);
CREATE INDEX IF NOT EXISTS idx_flags_flag_state ON flags(flag_state);
CREATE INDEX IF NOT EXISTS idx_flags_sector ON flags(sector);
CREATE INDEX IF NOT EXISTS idx_flags_flag_time ON flags(flag_time);
CREATE INDEX IF NOT EXISTS idx_flags_user_id ON flags(user_id);
CREATE INDEX IF NOT EXISTS idx_flags_session_participant_id ON flags(session_participant_id);
CREATE INDEX IF NOT EXISTS idx_flags_incident_id ON flags(incident_id);
CREATE INDEX IF NOT EXISTS idx_flags_location ON flags USING GIST(location);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_flags_updated_at 
    BEFORE UPDATE ON flags 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE flags ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read flags for public events
CREATE POLICY flags_public_read ON flags
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM sessions s
            JOIN events e ON e.id = s.event_id
            WHERE s.id = session_id 
            AND e.is_public = true
        )
    );

-- Policy: Event organizers can manage flags for their events
CREATE POLICY flags_organizer_manage ON flags
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM sessions s
            JOIN events e ON e.id = s.event_id
            WHERE s.id = session_id 
            AND e.organizer_id = current_setting('app.current_user_id')::uuid
        )
    );

-- Policy: Admins can manage all flags
CREATE POLICY flags_admin_all ON flags
    FOR ALL
    TO admin
    USING (true);
