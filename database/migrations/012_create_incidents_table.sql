-- Migration: Create incidents table
-- Description: Stores race incidents (off-track, crashes, penalties, etc.)

-- Create incidents table
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Can be NULL for track incidents
    session_participant_id UUID REFERENCES session_participants(id) ON DELETE SET NULL,
    -- Incident details
    incident_type VARCHAR(30) NOT NULL CHECK (incident_type IN (
        'OFF_TRACK', 'CRASH', 'DEBRIS', 'STALL', 'MECHANICAL', 'CUT_TRACK', 
        'SPEED_VIOLATION', 'PIT_LANE_VIOLATION', 'BLUE_FLAG_IGNORE', 
        'PENALTY', 'BLACK_FLAG', 'DISQUALIFICATION', 'MEDICAL', 'OTHER'
    )),
    severity VARCHAR(20) DEFAULT 'MINOR' CHECK (severity IN ('MINOR', 'MAJOR', 'CRITICAL')),
    -- Location and time
    location GEOMETRY(POINT, 4326), -- GPS location of incident
    location_description TEXT, -- Human-readable location (e.g., "Turn 3", "Main straight")
    incident_time TIMESTAMP WITH TIME ZONE NOT NULL,
    reported_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_time TIMESTAMP WITH TIME ZONE,
    -- Incident data
    speed_at_incident_kmh INTEGER CHECK (speed_at_incident_kmh > 0),
    lap_number INTEGER CHECK (lap_number > 0),
    sector INTEGER CHECK (sector >= 1 AND sector <= 3),
    -- Resolution
    resolution VARCHAR(30), -- How the incident was resolved
    penalty_applied TEXT, -- Details of any penalties
    -- Investigation
    investigated_by UUID REFERENCES users(id), -- Who investigated
    investigation_notes TEXT,
    -- Flags and safety car
    safety_car_deployed BOOLEAN DEFAULT false,
    safety_car_duration_seconds INTEGER CHECK (safety_car_duration_seconds > 0),
    flags_shown JSONB DEFAULT '[]', -- Array of flags shown due to this incident
    -- Media and evidence
    evidence_urls TEXT[], -- Links to photos, videos, etc.
    witness_reports JSONB DEFAULT '[]', -- Array of witness statements
    -- Status
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED')),
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_incidents_session_id ON incidents(session_id);
CREATE INDEX IF NOT EXISTS idx_incidents_user_id ON incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_incidents_session_participant_id ON incidents(session_participant_id);
CREATE INDEX IF NOT EXISTS idx_incidents_incident_type ON incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_incident_time ON incidents(incident_time);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_location ON incidents USING GIST(location);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_incidents_updated_at 
    BEFORE UPDATE ON incidents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see incidents involving them (for public events)
CREATE POLICY incidents_own_read ON incidents
    FOR SELECT
    TO authenticated
    USING (
        user_id = current_setting('app.current_user_id')::uuid
        OR (
            EXISTS (
                SELECT 1 FROM sessions s
                JOIN events e ON e.id = s.event_id
                WHERE s.id = session_id 
                AND e.is_public = true
                AND severity IN ('MAJOR', 'CRITICAL')
            )
        )
    );

-- Policy: Event organizers can manage incidents for their events
CREATE POLICY incidents_organizer_manage ON incidents
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

-- Policy: Admins can manage all incidents
CREATE POLICY incidents_admin_all ON incidents
    FOR ALL
    TO admin
    USING (true);
