-- Create user_experience table
CREATE TABLE IF NOT EXISTS user_experience (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL UNIQUE,
  level INTEGER NOT NULL DEFAULT 1,
  experience_points BIGINT NOT NULL DEFAULT 0,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  total_laps INTEGER NOT NULL DEFAULT 0,
  total_distance_km DECIMAL(10, 2) DEFAULT 0,
  best_lap_time DECIMAL(8, 3),
  total_penalties INTEGER NOT NULL DEFAULT 0,
  total_incidents INTEGER NOT NULL DEFAULT 0,
  achievements JSONB,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_session_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create experience_history table for tracking XP changes
CREATE TABLE IF NOT EXISTS experience_history (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  session_id VARCHAR(255),
  type VARCHAR(50) NOT NULL,
  points_earned INTEGER NOT NULL,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_experience_user_id ON user_experience(user_id);
CREATE INDEX IF NOT EXISTS idx_user_experience_level ON user_experience(level);
CREATE INDEX IF NOT EXISTS idx_experience_history_user_id ON experience_history(user_id);
CREATE INDEX IF NOT EXISTS idx_experience_history_session_id ON experience_history(session_id);
CREATE INDEX IF NOT EXISTS idx_experience_history_created_at ON experience_history(created_at);

-- Add comments
COMMENT ON TABLE user_experience IS 'Stores user experience levels and statistics';
COMMENT ON TABLE experience_history IS 'Stores history of experience point changes';
