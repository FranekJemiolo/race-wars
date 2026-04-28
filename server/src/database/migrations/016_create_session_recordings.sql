-- Create session_recordings table
CREATE TABLE IF NOT EXISTS session_recordings (
  id VARCHAR(255) PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'recording',
  duration BIGINT,
  data_size BIGINT,
  participant_count INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create recorded_positions table
CREATE TABLE IF NOT EXISTS recorded_positions (
  id VARCHAR(255) PRIMARY KEY,
  recording_id VARCHAR(255) NOT NULL,
  participant_id VARCHAR(255) NOT NULL,
  timestamp BIGINT NOT NULL,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(8, 2),
  heading DECIMAL(6, 2),
  accuracy DECIMAL(8, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create recorded_events table
CREATE TABLE IF NOT EXISTS recorded_events (
  id VARCHAR(255) PRIMARY KEY,
  recording_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  timestamp BIGINT NOT NULL,
  data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_session_recordings_session_id ON session_recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_session_recordings_status ON session_recordings(status);
CREATE INDEX IF NOT EXISTS idx_session_recordings_started_at ON session_recordings(started_at);

CREATE INDEX IF NOT EXISTS idx_recorded_positions_recording_id ON recorded_positions(recording_id);
CREATE INDEX IF NOT EXISTS idx_recorded_positions_participant_id ON recorded_positions(participant_id);
CREATE INDEX IF NOT EXISTS idx_recorded_positions_timestamp ON recorded_positions(timestamp);

CREATE INDEX IF NOT EXISTS idx_recorded_events_recording_id ON recorded_events(recording_id);
CREATE INDEX IF NOT EXISTS idx_recorded_events_type ON recorded_events(type);
CREATE INDEX IF NOT EXISTS idx_recorded_events_timestamp ON recorded_events(timestamp);

-- Add comments
COMMENT ON TABLE session_recordings IS 'Stores session recording metadata';
COMMENT ON TABLE recorded_positions IS 'Stores recorded GPS positions for session playback';
COMMENT ON TABLE recorded_events IS 'Stores recorded events (incidents, flags, penalties) for session playback';
