-- Migration: Create session_participants table
-- Description: Stores session-specific participant data and current state

-- Create session_participants table
CREATE TABLE IF NOT EXISTS session_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Session participation status
    status VARCHAR(20) DEFAULT 'REGISTERED' CHECK (status IN ('REGISTERED', 'IN_PIT', 'ON_TRACK', 'FINISHED', 'DNF', 'DSQ', 'WITHDRAWN')),
    position INTEGER CHECK (position > 0),
    -- Current session state
    current_lap INTEGER DEFAULT 0 CHECK (current_lap >= 0),
    current_sector INTEGER DEFAULT 1 CHECK (current_sector >= 1 AND current_sector <= 3),
    progress_percentage DECIMAL(5, 2) DEFAULT 0.00 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    -- Timing data
    session_start_time TIMESTAMP WITH TIME ZONE,
    last_lap_start_time TIMESTAMP WITH TIME ZONE,
    session_time_seconds INTEGER DEFAULT 0,
    -- Lap data
    total_laps INTEGER DEFAULT 0 CHECK (total_laps >= 0),
    best_lap_time_seconds DECIMAL(8, 3),
    last_lap_time_seconds DECIMAL(8, 3),
    best_sector_times JSONB DEFAULT '{}', -- { "s1": 12.345, "s2": 23.456, "s3": 34.567 }
    -- Position data
    current_lat DECIMAL(10, 8),
    current_lng DECIMAL(11, 8),
    current_speed_kmh INTEGER CHECK (current_speed_kmh >= 0),
    current_heading DECIMAL(5, 1) CHECK (current_heading >= 0 AND current_heading < 360),
    last_position_update TIMESTAMP WITH TIME ZONE,
    -- Session-specific penalties
    time_penalties_seconds INTEGER DEFAULT 0 CHECK (time_penalties_seconds >= 0),
    point_penalties INTEGER DEFAULT 0 CHECK (point_penalties >= 0),
    -- Flags and warnings
    blue_flags INTEGER DEFAULT 0 CHECK (blue_flags >= 0),
    yellow_flags_shown INTEGER DEFAULT 0 CHECK (yellow_flags_shown >= 0),
    -- Session notes
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, participant_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_participants_session_id ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_participant_id ON session_participants(participant_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_user_id ON session_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_status ON session_participants(status);
CREATE INDEX IF NOT EXISTS idx_session_participants_position ON session_participants(position);
CREATE INDEX IF NOT EXISTS idx_session_participants_current_lap ON session_participants(current_lap);
CREATE INDEX IF NOT EXISTS idx_session_participants_total_laps ON session_participants(total_laps);
CREATE INDEX IF NOT EXISTS idx_session_participants_best_lap_time ON session_participants(best_lap_time_seconds);
CREATE INDEX IF NOT EXISTS idx_session_participants_last_position_update ON session_participants(last_position_update);
CREATE INDEX IF NOT EXISTS idx_session_participants_current_position ON session_participants USING GIST(ST_Point(current_lng, current_lat));

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_session_participants_updated_at 
    BEFORE UPDATE ON session_participants 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own session participation
CREATE POLICY session_participants_own_read ON session_participants
    FOR SELECT
    TO authenticated
    USING (user_id = current_setting('app.current_user_id')::uuid);

-- Policy: Event organizers can manage session participants for their events
CREATE POLICY session_participants_organizer_manage ON session_participants
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

-- Policy: Admins can manage all session participants
CREATE POLICY session_participants_admin_all ON session_participants
    FOR ALL
    TO admin
    USING (true);
