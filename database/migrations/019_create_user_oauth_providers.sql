-- Create user_oauth_providers table
CREATE TABLE IF NOT EXISTS user_oauth_providers (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  provider_id VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  name VARCHAR(255),
  picture TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, provider_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_oauth_providers_user_id ON user_oauth_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_oauth_providers_provider ON user_oauth_providers(provider);
CREATE INDEX IF NOT EXISTS idx_user_oauth_providers_provider_id ON user_oauth_providers(provider_id);

-- Add comments
COMMENT ON TABLE user_oauth_providers IS 'Stores OAuth provider links for users';
