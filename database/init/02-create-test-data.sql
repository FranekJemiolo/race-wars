-- Create sample data for testing
-- This file runs after migrations and extensions are created

-- Create sample users
INSERT INTO users (id, email, password_hash, first_name, last_name, display_name, phone, date_of_birth, license_number, license_expiry, experience_level, profile_image_url, bio, preferences, is_active, email_verified, created_at, updated_at) VALUES
('user-1', 'john.doe@example.com', '$2b$10$hashedpassword123', 'John', 'Doe', 'John Doe', '+1234567890', '1990-01-15', 'LIC123456', '2025-12-31', 'intermediate', NULL, 'Racing enthusiast', '{"notifications": true, "theme": "dark"}', true, true, NOW(), NOW()),
('user-2', 'jane.smith@example.com', '$2b$10$hashedpassword456', 'Jane', 'Smith', 'Jane Smith', '+0987654321', '1992-05-20', 'LIC789012', '2024-06-30', 'advanced', NULL, 'Professional racer', '{"notifications": false, "theme": "light"}', true, true, NOW(), NOW()),
('user-3', 'mike.johnson@example.com', '$2b$10$hashedpassword789', 'Mike', 'Johnson', 'Mike Johnson', '+1122334455', '1988-11-10', 'LIC345678', '2025-09-15', 'beginner', NULL, 'New to racing', '{"notifications": true, "theme": "auto"}', true, true, NOW(), NOW());

-- Create sample tracks
INSERT INTO tracks (id, name, description, location_name, location_country, location_lat, location_lng, track_type, difficulty, distance_meters, elevation_gain, best_lap_time, is_active, created_at, updated_at) VALUES
('track-1', 'Silverstone Circuit', 'Formula 1 racing circuit in England', 'Silverstone', 'United Kingdom', 52.0786, -1.0169, 'road_circuit', 'hard', 5891, 35, 85.5, true, NOW(), NOW()),
('track-2', 'Monaco Street Circuit', 'Famous street circuit in Monte Carlo', 'Monte Carlo', 'Monaco', 43.7347, 7.4216, 'street_circuit', 'expert', 3337, 42, 78.2, true, NOW(), NOW()),
('track-3', 'Laguna Seca', 'Popular racing track in California', 'Laguna Seca', 'United States', 36.5855, -121.7520, 'road_circuit', 'intermediate', 3610, 55, 92.1, true, NOW(), NOW());

-- Create sample sessions
INSERT INTO sessions (id, track_id, name, description, session_type, scheduled_start, scheduled_end, max_participants, status, created_by, created_at, updated_at) VALUES
('session-1', 'track-1', 'Silverstone Practice', 'Practice session at Silverstone', 'practice', NOW() + INTERVAL '1 hour', NOW() + INTERVAL '3 hours', 20, 'scheduled', 'user-1', NOW(), NOW()),
('session-2', 'track-2', 'Monaco Qualifying', 'Qualifying session at Monaco', 'qualifying', NOW() + INTERVAL '2 hours', NOW() + INTERVAL '4 hours', 16, 'scheduled', 'user-2', NOW(), NOW()),
('session-3', 'track-3', 'Laguna Seca Race', 'Main race event at Laguna Seca', 'race', NOW() + INTERVAL '3 hours', NOW() + INTERVAL '6 hours', 25, 'scheduled', 'user-1', NOW(), NOW());

-- Create sample session participants
INSERT INTO session_participants (id, session_id, user_id, car_number, status, current_lat, current_lng, current_speed_kmh, current_heading, last_position_update, created_at, updated_at) VALUES
('sp-1', 'session-1', 'user-1', 1, 'registered', 52.0786, -1.0169, 0, 0, NOW(), NOW(), NOW()),
('sp-2', 'session-1', 'user-2', 2, 'registered', 52.0786, -1.0169, 0, 0, NOW(), NOW(), NOW()),
('sp-3', 'session-2', 'user-2', 1, 'registered', 43.7347, 7.4216, 0, 0, NOW(), NOW(), NOW()),
('sp-4', 'session-2', 'user-3', 3, 'registered', 43.7347, 7.4216, 0, 0, NOW(), NOW(), NOW()),
('sp-5', 'session-3', 'user-1', 5, 'registered', 36.5855, -121.7520, 0, 0, NOW(), NOW(), NOW()),
('sp-6', 'session-3', 'user-3', 7, 'registered', 36.5855, -121.7520, 0, 0, NOW(), NOW(), NOW());

-- Create sample enforcement zones
INSERT INTO enforcement_zones (id, track_id, name, zone_type, start_distance, end_distance, speed_limit_kmh, is_active, created_at, updated_at) VALUES
('ez-1', 'track-1', 'Silverstone Pit Lane', 'pit_lane', 0, 100, 60, true, NOW(), NOW()),
('ez-2', 'track-1', 'Silverstone Turn 1-2', 'speed_trap', 200, 400, 180, true, NOW(), NOW()),
('ez-3', 'track-2', 'Monaco Swimming Pool', 'speed_trap', 800, 950, 120, true, NOW(), NOW()),
('ez-4', 'track-3', 'Laguna Seca Corkscrew', 'speed_trap', 1500, 1650, 100, true, NOW(), NOW());

-- Create sample sectors for flag management
INSERT INTO sectors (id, track_id, name, sector_order, start_distance, end_distance, marshal_zone_id) VALUES
('sec-1', 'track-1', 'Sector 1', 1, 0, 2000, 'mz-1'),
('sec-2', 'track-1', 'Sector 2', 2, 2000, 4000, 'mz-2'),
('sec-3', 'track-1', 'Sector 3', 3, 4000, 5891, 'mz-3'),
('sec-4', 'track-2', 'Sector 1', 1, 0, 1200, 'mz-4'),
('sec-5', 'track-2', 'Sector 2', 2, 1200, 2400, 'mz-5'),
('sec-6', 'track-2', 'Sector 3', 3, 2400, 3337, 'mz-6');

-- Create sample marshal zones
INSERT INTO marshal_zones (id, sector_id, name, position_lat, position_lng, radio_channel, primary_contact, is_active) VALUES
('mz-1', 'sec-1', 'Marshal Zone 1', 52.0786, -1.0169, 'Channel 1', 'Marshal John', true),
('mz-2', 'sec-2', 'Marshal Zone 2', 52.0800, -1.0180, 'Channel 2', 'Marshal Jane', true),
('mz-3', 'sec-3', 'Marshal Zone 3', 52.0815, -1.0195, 'Channel 3', 'Marshal Mike', true),
('mz-4', 'sec-4', 'Marshal Zone 4', 43.7347, 7.4216, 'Channel 1', 'Marshal Pierre', true),
('mz-5', 'sec-5', 'Marshal Zone 5', 43.7360, 7.4230, 'Channel 2', 'Marshal Louis', true),
('mz-6', 'sec-6', 'Marshal Zone 6', 43.7375, 7.4245, 'Channel 3', 'Marshal Charles', true);

-- Create sample checkpoints
INSERT INTO checkpoints (id, track_id, name, checkpoint_order, position_lat, position_lng, radius_meters, is_mandatory, time_limit_seconds, created_at, updated_at) VALUES
('cp-1', 'track-1', 'Start/Finish', 1, 52.0786, -1.0169, 10, true, NULL, NOW(), NOW()),
('cp-2', 'track-1', 'Checkpoint 1', 2, 52.0900, -1.0200, 15, true, 120, NOW(), NOW()),
('cp-3', 'track-1', 'Checkpoint 2', 3, 52.1000, -1.0250, 15, true, 120, NOW(), NOW()),
('cp-4', 'track-2', 'Start/Finish', 1, 43.7347, 7.4216, 10, true, NULL, NOW(), NOW()),
('cp-5', 'track-2', 'Casino Square', 2, 43.7390, 7.4260, 12, true, 90, NOW(), NOW()),
('cp-6', 'track-3', 'Start/Finish', 1, 36.5855, -121.7520, 10, true, NULL, NOW(), NOW()),
('cp-7', 'track-3', 'Corkscrew', 2, 36.5950, -121.7620, 15, true, 150, NOW(), NOW());

-- Create sample custom routes
INSERT INTO custom_routes (id, user_id, name, description, route_type, is_public, total_distance_meters, estimated_time_minutes, difficulty_level, created_at, updated_at) VALUES
('cr-1', 'user-1', 'Morning Training Route', 'My daily training circuit', 'training', false, 5000, 45, 'intermediate', NOW(), NOW()),
('cr-2', 'user-2', 'Scenic Weekend Drive', 'Beautiful countryside route', 'leisure', true, 8000, 90, 'easy', NOW(), NOW()),
('cr-3', 'user-3', 'Advanced Challenge', 'Technical route for experienced riders', 'challenge', true, 12000, 120, 'hard', NOW(), NOW());

-- Create sample custom route points
INSERT INTO custom_route_points (id, route_id, point_order, position_lat, position_lng, radius_meters, instruction, created_at) VALUES
('crp-1', 'cr-1', 1, 52.0786, -1.0169, 50, 'Start here', NOW()),
('crp-2', 'cr-1', 2, 52.0900, -1.0200, 50, 'Turn right', NOW()),
('crp-3', 'cr-1', 3, 52.1000, -1.0250, 50, 'Straight ahead', NOW()),
('crp-4', 'cr-1', 4, 52.0786, -1.0169, 50, 'Finish here', NOW()),
('crp-5', 'cr-2', 1, 43.7347, 7.4216, 50, 'Start at Monte Carlo', NOW()),
('crp-6', 'cr-2', 2, 43.7390, 7.4260, 50, 'Pass through Casino Square', NOW()),
('crp-7', 'cr-2', 3, 43.7347, 7.4216, 50, 'Return to start', NOW()),
('crp-8', 'cr-3', 1, 36.5855, -121.7520, 50, 'Start at Laguna Seca', NOW()),
('crp-9', 'cr-3', 2, 36.5950, -121.7620, 50, 'Navigate Corkscrew', NOW()),
('crp-10', 'cr-3', 3, 36.5855, -121.7520, 50, 'Finish line', NOW());

-- Create sample notification preferences
INSERT INTO notification_preferences (user_id, enable_email, enable_push, enable_in_app, race_notifications, flag_notifications, penalty_notifications) VALUES
('user-1', true, true, true, true, true, true),
('user-2', false, true, true, true, false, true),
('user-3', true, false, true, false, true, false);

-- Create sample events
INSERT INTO events (id, name, description, event_type, location_name, location_country, location_lat, location_lng, start_time, end_time, max_participants, registration_fee, is_public, created_by, created_at, updated_at) VALUES
('event-1', 'Silverstone Grand Prix', 'Formula 1 race at Silverstone', 'race', 'Silverstone', 'United Kingdom', 52.0786, -1.0169, NOW() + INTERVAL '7 days', NOW() + INTERVAL '8 days', 50000, 150.00, true, 'user-1', NOW(), NOW()),
('event-2', 'Monaco Historic GP', 'Historic racing event in Monaco', 'race', 'Monte Carlo', 'Monaco', 43.7347, 7.4216, NOW() + INTERVAL '14 days', NOW() + INTERVAL '15 days', 20000, 300.00, true, 'user-2', NOW(), NOW()),
('event-3', 'California Track Day', 'Open track day at Laguna Seca', 'track_day', 'Laguna Seca', 'United States', 36.5855, -121.7520, NOW() + INTERVAL '21 days', NOW() + INTERVAL '22 days', 100, 75.00, true, 'user-1', NOW(), NOW());
