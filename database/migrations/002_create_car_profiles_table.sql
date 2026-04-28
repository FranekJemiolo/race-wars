-- Migration: Create car_profiles table
-- Description: Stores car information for each user

-- Create car_profiles table
CREATE TABLE IF NOT EXISTS car_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM CURRENT_DATE) + 1),
    color VARCHAR(50),
    license_plate VARCHAR(20),
    vehicle_class VARCHAR(50) DEFAULT 'other' CHECK (vehicle_class IN ('sedan', 'coupe', 'suv', 'truck', 'motorcycle', 'sports', 'supercar', 'other')),
    power_hp INTEGER CHECK (power_hp > 0),
    torque_nm INTEGER CHECK (torque_nm > 0),
    weight_kg INTEGER CHECK (weight_kg > 0),
    drive_type VARCHAR(20) CHECK (drive_type IN ('fwd', 'rwd', 'awd', '4wd')),
    transmission_type VARCHAR(20) CHECK (transmission_type IN ('manual', 'automatic', 'dual_clutch', 'cvt')),
    modifications TEXT,
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_car_profiles_user_id ON car_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_car_profiles_make_model ON car_profiles(make, model);
CREATE INDEX IF NOT EXISTS idx_car_profiles_vehicle_class ON car_profiles(vehicle_class);
CREATE INDEX IF NOT EXISTS idx_car_profiles_power_hp ON car_profiles(power_hp);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_car_profiles_updated_at 
    BEFORE UPDATE ON car_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE car_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own car profiles
CREATE POLICY car_profiles_own ON car_profiles
    FOR ALL
    TO authenticated
    USING (user_id = current_setting('app.current_user_id')::uuid);

-- Policy: Admins can see all car profiles
CREATE POLICY car_profiles_admin_all ON car_profiles
    FOR ALL
    TO admin
    USING (true);

-- Constraint: Each user can only have one primary car
CREATE UNIQUE INDEX IF NOT EXISTS idx_car_profiles_user_primary 
    ON car_profiles(user_id) 
    WHERE is_primary = true;
