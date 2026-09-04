-- Migration: Create leaderboard tables
-- Description: Create tables for real-time race leaderboard functionality

-- Create race_leaderboards table
CREATE TABLE IF NOT EXISTS race_leaderboards (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    race_id VARCHAR(255) NOT NULL UNIQUE,
    race_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'finished', 'paused', 'cancelled')),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    total_participants INTEGER DEFAULT 0,
    finished_participants INTEGER DEFAULT 0,
    entries JSONB DEFAULT '[]',
    last_update TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create leaderboard_entries table
CREATE TABLE IF NOT EXISTS leaderboard_entries (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    race_id VARCHAR(255) NOT NULL REFERENCES race_leaderboards(race_id) ON DELETE CASCADE,
    participant_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_position INTEGER NOT NULL DEFAULT 1,
    previous_position INTEGER NOT NULL DEFAULT 1,
    current_lap INTEGER NOT NULL DEFAULT 1,
    total_laps INTEGER NOT NULL DEFAULT 1,
    lap_time BIGINT DEFAULT 0, -- milliseconds
    best_lap_time BIGINT DEFAULT 0, -- milliseconds
    total_time BIGINT DEFAULT 0, -- milliseconds
    gap_to_leader BIGINT DEFAULT 0, -- milliseconds
    gap_to_previous BIGINT DEFAULT 0, -- milliseconds
    last_checkpoint_time TIMESTAMP WITH TIME ZONE,
    speed DECIMAL(8,2) DEFAULT 0.00, -- km/h
    status VARCHAR(20) DEFAULT 'racing' CHECK (status IN ('racing', 'finished', 'dnf', 'pit', 'disqualified')),
    position_history JSONB DEFAULT '[]',
    last_update TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(race_id, participant_id)
);

-- Create position_updates table for detailed tracking
CREATE TABLE IF NOT EXISTS position_updates (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    race_id VARCHAR(255) NOT NULL REFERENCES race_leaderboards(race_id) ON DELETE CASCADE,
    participant_id VARCHAR(255) NOT NULL,
    position INTEGER NOT NULL,
    lap INTEGER NOT NULL,
    checkpoint_index INTEGER NOT NULL,
    lap_time BIGINT DEFAULT 0, -- milliseconds
    speed DECIMAL(8,2) DEFAULT 0.00, -- km/h
    coordinates_lat DECIMAL(10,8) NOT NULL,
    coordinates_lng DECIMAL(11,8) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_race_leaderboards_race_id ON race_leaderboards(race_id);
CREATE INDEX IF NOT EXISTS idx_race_leaderboards_status ON race_leaderboards(status);
CREATE INDEX IF NOT EXISTS idx_race_leaderboards_last_update ON race_leaderboards(last_update);

CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_race_id ON leaderboard_entries(race_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_participant_id ON leaderboard_entries(participant_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_user_id ON leaderboard_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_current_position ON leaderboard_entries(current_position);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_status ON leaderboard_entries(status);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_last_update ON leaderboard_entries(last_update);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_race_participant ON leaderboard_entries(race_id, participant_id);

CREATE INDEX IF NOT EXISTS idx_position_updates_race_id ON position_updates(race_id);
CREATE INDEX IF NOT EXISTS idx_position_updates_participant_id ON position_updates(participant_id);
CREATE INDEX IF NOT EXISTS idx_position_updates_timestamp ON position_updates(timestamp);
CREATE INDEX IF NOT EXISTS idx_position_updates_race_participant ON position_updates(race_id, participant_id);
CREATE INDEX IF NOT EXISTS idx_position_updates_coordinates ON position_updates(coordinates_lng, coordinates_lat);

-- Create function to update leaderboard positions
CREATE OR REPLACE FUNCTION update_leaderboard_positions(p_race_id VARCHAR)
RETURNS void AS $$
DECLARE
    entry_record RECORD;
    position_counter INTEGER := 1;
    previous_total_time BIGINT := 0;
    gap_to_leader BIGINT := 0;
    gap_to_previous BIGINT := 0;
BEGIN
    -- Reset all positions to null first
    UPDATE leaderboard_entries 
    SET current_position = NULL, gap_to_leader = NULL, gap_to_previous = NULL
    WHERE race_id = p_race_id AND status = 'racing';
    
    -- Order by total_time (finished first), then by current_lap, then by progress
    FOR entry_record IN 
        SELECT 
            le.id,
            le.total_time,
            le.current_lap,
            le.status
        FROM leaderboard_entries le
        WHERE le.race_id = p_race_id
        ORDER BY 
            CASE WHEN le.status = 'finished' THEN 0 ELSE 1 END,
            le.current_lap DESC,
            le.total_time ASC
    LOOP
        -- Calculate gaps
        IF position_counter = 1 THEN
            gap_to_leader := 0;
            gap_to_previous := 0;
        ELSE
            IF entry_record.status = 'finished' AND previous_total_time > 0 THEN
                gap_to_previous := entry_record.total_time - previous_total_time;
            ELSE
                gap_to_previous := 0;
            END IF;
        END IF;
        
        -- Update the entry
        UPDATE leaderboard_entries 
        SET 
            current_position = position_counter,
            gap_to_leader = gap_to_leader,
            gap_to_previous = gap_to_previous,
            last_update = CURRENT_TIMESTAMP
        WHERE id = entry_record.id;
        
        -- Set previous_time for next iteration
        IF entry_record.status = 'finished' THEN
            previous_total_time := entry_record.total_time;
        END IF;
        
        position_counter := position_counter + 1;
    END LOOP;
    
    -- Update the race leaderboard last_update timestamp
    UPDATE race_leaderboards 
    SET last_update = CURRENT_TIMESTAMP
    WHERE race_id = p_race_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to add position update
CREATE OR REPLACE FUNCTION add_position_update(
    p_race_id VARCHAR,
    p_participant_id VARCHAR,
    p_position INTEGER,
    p_lap INTEGER,
    p_checkpoint_index INTEGER,
    p_lap_time BIGINT,
    p_speed DECIMAL,
    p_lat DECIMAL,
    p_lng DECIMAL
)
RETURNS void AS $$
BEGIN
    -- Insert position update
    INSERT INTO position_updates (
        race_id, participant_id, position, lap, checkpoint_index,
        lap_time, speed, coordinates_lat, coordinates_lng
    ) VALUES (
        p_race_id, p_participant_id, p_position, p_lap, p_checkpoint_index,
        p_lap_time, p_speed, p_lat, p_lng
    );
    
    -- Update leaderboard entry
    UPDATE leaderboard_entries 
    SET 
        current_position = p_position,
        current_lap = p_lap,
        lap_time = p_lap_time,
        speed = p_speed,
        last_checkpoint_time = CURRENT_TIMESTAMP,
        last_update = CURRENT_TIMESTAMP
    WHERE race_id = p_race_id AND participant_id = p_participant_id;
    
    -- Recalculate positions
    PERFORM update_leaderboard_positions(p_race_id);
END;
$$ LANGUAGE plpgsql;

-- Create function to finish participant
CREATE OR REPLACE FUNCTION finish_participant(
    p_race_id VARCHAR,
    p_participant_id VARCHAR,
    p_total_time BIGINT
)
RETURNS void AS $$
BEGIN
    -- Update participant entry
    UPDATE leaderboard_entries 
    SET 
        status = 'finished',
        total_time = p_total_time,
        last_update = CURRENT_TIMESTAMP
    WHERE race_id = p_race_id AND participant_id = p_participant_id;
    
    -- Update finished participants count
    UPDATE race_leaderboards 
    SET 
        finished_participants = finished_participants + 1,
        last_update = CURRENT_TIMESTAMP
    WHERE race_id = p_race_id;
    
    -- Recalculate positions
    PERFORM update_leaderboard_positions(p_race_id);
END;
$$ LANGUAGE plpgsql;
