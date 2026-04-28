-- Migration: Create lap_records table
-- Description: Stores detailed lap records for each session participant

-- Create lap_records table
CREATE TABLE IF NOT EXISTS lap_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_participant_id UUID NOT NULL REFERENCES session_participants(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lap_number INTEGER NOT NULL CHECK (lap_number > 0),
    -- Lap timing
    lap_time_seconds DECIMAL(8, 3) NOT NULL CHECK (lap_time_seconds > 0),
    sector_times JSONB DEFAULT '{}', -- { "s1": 12.345, "s2": 23.456, "s3": 34.567 }
    lap_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    lap_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    -- Lap quality metrics
    max_speed_kmh INTEGER CHECK (max_speed_kmh > 0),
    avg_speed_kmh DECIMAL(6, 2) CHECK (avg_speed_kmh > 0),
    consistency_score DECIMAL(5, 2) CHECK (consistency_score >= 0 AND consistency_score <= 100),
    -- GPS track data (optional detailed tracking)
    gps_track GEOMETRY(LINESTRING, 4326), -- Complete GPS track for the lap
    -- Validation flags
    is_valid BOOLEAN DEFAULT true,
    invalidation_reason VARCHAR(100),
    -- Lap type
    lap_type VARCHAR(20) DEFAULT 'NORMAL' CHECK (lap_type IN ('NORMAL', 'OUT_LAP', 'IN_LAP', 'HOT_LAP', 'PIT_LAP')),
    -- Penalties and flags
    time_penalties_seconds INTEGER DEFAULT 0 CHECK (time_penalties_seconds >= 0),
    cut_track_detected BOOLEAN DEFAULT false,
    speed_violations INTEGER DEFAULT 0 CHECK (speed_violations >= 0),
    -- Session context
    position_at_start INTEGER CHECK (position_at_start > 0),
    position_at_end INTEGER CHECK (position_at_end > 0),
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_participant_id, lap_number)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lap_records_session_participant_id ON lap_records(session_participant_id);
CREATE INDEX IF NOT EXISTS idx_lap_records_session_id ON lap_records(session_id);
CREATE INDEX IF NOT EXISTS idx_lap_records_user_id ON lap_records(user_id);
CREATE INDEX IF NOT EXISTS idx_lap_records_lap_number ON lap_records(lap_number);
CREATE INDEX IF NOT EXISTS idx_lap_records_lap_time ON lap_records(lap_time_seconds);
CREATE INDEX IF NOT EXISTS idx_lap_records_lap_start_time ON lap_records(lap_start_time);
CREATE INDEX IF NOT EXISTS idx_lap_records_is_valid ON lap_records(is_valid);
CREATE INDEX IF NOT EXISTS idx_lap_records_lap_type ON lap_records(lap_type);
CREATE INDEX IF NOT EXISTS idx_lap_records_gps_track ON lap_records USING GIST(gps_track);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_lap_records_updated_at 
    BEFORE UPDATE ON lap_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE lap_records ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own lap records
CREATE POLICY lap_records_own_read ON lap_records
    FOR SELECT
    TO authenticated
    USING (user_id = current_setting('app.current_user_id')::uuid);

-- Policy: Event organizers can manage lap records for their events
CREATE POLICY lap_records_organizer_manage ON lap_records
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM session_participants sp
            JOIN sessions s ON s.id = sp.session_id
            JOIN events e ON e.id = s.event_id
            WHERE sp.id = session_participant_id 
            AND e.organizer_id = current_setting('app.current_user_id')::uuid
        )
    );

-- Policy: Admins can manage all lap records
CREATE POLICY lap_records_admin_all ON lap_records
    FOR ALL
    TO admin
    USING (true);
