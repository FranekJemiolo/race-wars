-- Create car_profiles table
CREATE TABLE IF NOT EXISTS car_profiles (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  make VARCHAR(255),
  model VARCHAR(255),
  year INTEGER,
  color VARCHAR(100),
  car_number VARCHAR(10),
  class VARCHAR(100),
  category VARCHAR(100),
  specifications JSONB,
  image_url TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_car_profiles_user_id ON car_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_car_profiles_is_default ON car_profiles(is_default);
CREATE INDEX IF NOT EXISTS idx_car_profiles_class ON car_profiles(class);

-- Add comments
COMMENT ON TABLE car_profiles IS 'Stores user car profiles for racing sessions';
