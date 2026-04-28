-- Migration: Create participants table
-- Description: Stores event participants and their registration status

-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    car_profile_id UUID REFERENCES car_profiles(id),
    registration_status VARCHAR(20) DEFAULT 'REGISTERED' CHECK (registration_status IN ('REGISTERED', 'APPROVED', 'REJECTED', 'WAITLIST', 'CANCELLED', 'NO_SHOW')),
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approval_date TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    waiver_signed BOOLEAN DEFAULT false,
    waiver_signed_at TIMESTAMP WITH TIME ZONE,
    payment_status VARCHAR(20) DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'REFUNDED', 'FAILED')),
    payment_amount DECIMAL(10, 2) DEFAULT 0.00 CHECK (payment_amount >= 0),
    payment_date TIMESTAMP WITH TIME ZONE,
    -- Participant preferences
    car_number INTEGER CHECK (car_number > 0 AND car_number <= 999),
    transponder_number VARCHAR(20),
    -- Registration form data
    additional_info JSONB DEFAULT '{}',
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    -- Participation statistics
    sessions_participated INTEGER DEFAULT 0,
    total_laps_completed INTEGER DEFAULT 0,
    best_lap_time_seconds DECIMAL(8, 3),
    -- Notes and flags
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_participants_event_id ON participants(event_id);
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_car_profile_id ON participants(car_profile_id);
CREATE INDEX IF NOT EXISTS idx_participants_registration_status ON participants(registration_status);
CREATE INDEX IF NOT EXISTS idx_participants_payment_status ON participants(payment_status);
CREATE INDEX IF NOT EXISTS idx_participants_car_number ON participants(car_number);
CREATE INDEX IF NOT EXISTS idx_participants_registration_date ON participants(registration_date);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_participants_updated_at 
    BEFORE UPDATE ON participants 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own participation records
CREATE POLICY participants_own_read ON participants
    FOR SELECT
    TO authenticated
    USING (user_id = current_setting('app.current_user_id')::uuid);

-- Policy: Event organizers can manage their own event participants
CREATE POLICY participants_organizer_manage ON participants
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM events e 
            WHERE e.id = event_id 
            AND e.organizer_id = current_setting('app.current_user_id')::uuid
        )
    );

-- Policy: Admins can manage all participants
CREATE POLICY participants_admin_all ON participants
    FOR ALL
    TO admin
    USING (true);
