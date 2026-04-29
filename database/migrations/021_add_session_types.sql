-- Add session_type column to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS session_type VARCHAR(50) DEFAULT 'race';

-- Add session-specific columns
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS laps_total INTEGER;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS time_limit_seconds INTEGER;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS qualifying_position INTEGER;

-- Create index on session_type
CREATE INDEX IF NOT EXISTS idx_sessions_session_type ON sessions(session_type);

-- Update existing sessions to have session_type
UPDATE sessions SET session_type = 'race' WHERE session_type IS NULL;

-- Add comments
COMMENT ON COLUMN sessions.session_type IS 'Type of session: race, practice, qualifying, hot_lap';
COMMENT ON COLUMN sessions.laps_total IS 'Total number of laps for the session (for timed sessions)';
COMMENT ON COLUMN sessions.time_limit_seconds IS 'Time limit in seconds (for timed sessions)';
COMMENT ON COLUMN sessions.qualifying_position IS 'Qualifying position (for qualifying sessions)';
