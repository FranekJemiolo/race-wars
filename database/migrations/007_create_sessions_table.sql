-- Migration: Create sessions table
-- Description: Stores session information for events (practice, qualifying, race, etc.)

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('PRACTICE', 'QUALIFYING', 'RACE', 'HOT_LAPS', 'TIMED_RUNS', 'TEST')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER CHECK (duration_minutes > 0),
    status VARCHAR(20) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'OPEN_PIT', 'LIVE', 'CHECKERED', 'FINISHED', 'CANCELLED', 'POSTPONED')),
    -- Session configuration
    max_participants INTEGER DEFAULT 100 CHECK (max_participants > 0),
    current_participants INTEGER DEFAULT 0 CHECK (current_participants >= 0),
    -- Race state management
    race_state VARCHAR(20) DEFAULT 'CREATED' CHECK (race_state IN ('CREATED', 'COUNTDOWN', 'LIVE', 'PAUSED', 'FINISHED', 'ABORTED')),
    flag_state VARCHAR(20) DEFAULT 'NONE' CHECK (flag_state IN ('NONE', 'GREEN', 'YELLOW_SECTOR', 'YELLOW_FULL', 'RED', 'CHECKERED', 'BLUE')),
    -- Timing configuration
    lap_count_target INTEGER CHECK (lap_count_target > 0),
    time_limit_seconds INTEGER CHECK (time_limit_seconds > 0),
    -- Session rules
    rules JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    -- Session statistics
    total_laps INTEGER DEFAULT 0,
    fastest_lap_seconds DECIMAL(8, 3),
    fastest_lap_driver_id UUID REFERENCES users(id),
    -- Session metadata
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_event_id ON sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_type ON sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_race_state ON sessions(race_state);
CREATE INDEX IF NOT EXISTS idx_sessions_flag_state ON sessions(flag_state);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON sessions(is_active);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_sessions_updated_at 
    BEFORE UPDATE ON sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read sessions for public events
CREATE POLICY sessions_public_read ON sessions
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM events e 
            WHERE e.id = event_id 
            AND e.is_public = true
        )
    );

-- Policy: Event organizers can manage their own sessions
CREATE POLICY sessions_organizer_manage ON sessions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM events e 
            WHERE e.id = event_id 
            AND e.organizer_id = current_setting('app.current_user_id')::uuid
        )
    );

-- Policy: Admins can manage all sessions
CREATE POLICY sessions_admin_all ON sessions
    FOR ALL
    TO admin
    USING (true);
