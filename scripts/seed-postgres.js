const { Pool } = require('pg');
const bcrypt = require('bcrypt');

async function seedDatabase() {
  console.log('Seeding PostgreSQL database with example data...');
  
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'race_wars',
    user: 'franek',
    password: ''
  });
  
  try {
    const passwordHash = await bcrypt.hash('screenshot123', 10);
    
    // Generate IDs
    const userId1 = 'user-' + Date.now() + '-1';
    const userId2 = 'user-' + Date.now() + '-2';
    const userId3 = 'user-' + Date.now() + '-3';
    const teamId1 = 'team-' + Date.now() + '-1';
    const teamId2 = 'team-' + Date.now() + '-2';
    const trackId1 = 'track-' + Date.now() + '-1';
    const trackId2 = 'track-' + Date.now() + '-2';
    const trackId3 = 'track-' + Date.now() + '-3';
    const raceId1 = 'race-' + Date.now() + '-1';
    const raceId2 = 'race-' + Date.now() + '-2';
    
    const startTime = new Date(Date.now() + 3600000).toISOString();
    const endTime = new Date(Date.now() + 7200000).toISOString();
    const now = new Date().toISOString();
    
    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name TEXT,
        experience_level TEXT DEFAULT 'beginner',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        captain_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (captain_id) REFERENCES users(id)
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS races (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        track_id TEXT,
        status TEXT DEFAULT 'upcoming',
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        created_by TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tracks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        distance REAL,
        elevation_gain REAL,
        checkpoints TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS race_participants (
        id TEXT PRIMARY KEY,
        race_id TEXT,
        user_id TEXT,
        team_id TEXT,
        status TEXT DEFAULT 'registered',
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        total_time REAL,
        FOREIGN KEY (race_id) REFERENCES races(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (team_id) REFERENCES teams(id)
      )
    `);
    
    // Insert users
    await pool.query(
      `INSERT INTO users (id, username, email, password_hash, display_name, experience_level, created_at, updated_at, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (username) DO UPDATE SET 
         password_hash = EXCLUDED.password_hash,
         display_name = EXCLUDED.display_name,
         updated_at = EXCLUDED.updated_at`,
      [userId1, 'screenshot_user', 'screenshot@test.com', passwordHash, 'Screenshot User', 'advanced', now, now, true]
    );
    
    await pool.query(
      `INSERT INTO users (id, username, email, password_hash, display_name, experience_level, created_at, updated_at, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (username) DO UPDATE SET 
         password_hash = EXCLUDED.password_hash,
         display_name = EXCLUDED.display_name,
         updated_at = EXCLUDED.updated_at`,
      [userId2, 'racer_one', 'racer1@test.com', passwordHash, 'Racer One', 'intermediate', now, now, true]
    );
    
    await pool.query(
      `INSERT INTO users (id, username, email, password_hash, display_name, experience_level, created_at, updated_at, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (username) DO UPDATE SET 
         password_hash = EXCLUDED.password_hash,
         display_name = EXCLUDED.display_name,
         updated_at = EXCLUDED.updated_at`,
      [userId3, 'racer_two', 'racer2@test.com', passwordHash, 'Racer Two', 'beginner', now, now, true]
    );
    
    // Insert teams
    await pool.query(
      `INSERT INTO teams (id, name, description, captain_id, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET 
         name = EXCLUDED.name,
         description = EXCLUDED.description`,
      [teamId1, 'Speed Demons', 'A team focused on speed and endurance', userId1, now, now]
    );
    
    await pool.query(
      `INSERT INTO teams (id, name, description, captain_id, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET 
         name = EXCLUDED.name,
         description = EXCLUDED.description`,
      [teamId2, 'Trail Blazers', 'Mountain racing specialists', userId2, now, now]
    );
    
    // Insert tracks
    await pool.query(
      `INSERT INTO tracks (id, name, description, distance, elevation_gain, checkpoints, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET 
         name = EXCLUDED.name,
         description = EXCLUDED.description`,
      [trackId1, 'Mountain Trail', 'Challenging mountain trail with steep climbs', 15.5, 1200, JSON.stringify([
        { lat: 40.7128, lng: -74.0060, name: 'Start' },
        { lat: 40.7228, lng: -74.0160, name: 'Checkpoint 1' },
        { lat: 40.7328, lng: -74.0260, name: 'Checkpoint 2' },
        { lat: 40.7428, lng: -74.0360, name: 'Finish' }
      ]), now]
    );
    
    await pool.query(
      `INSERT INTO tracks (id, name, description, distance, elevation_gain, checkpoints, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET 
         name = EXCLUDED.name,
         description = EXCLUDED.description`,
      [trackId2, 'City Sprint', 'Fast-paced urban race through downtown', 8.2, 150, JSON.stringify([
        { lat: 40.7500, lng: -73.9900, name: 'Start' },
        { lat: 40.7600, lng: -73.9800, name: 'Midpoint' },
        { lat: 40.7700, lng: -73.9700, name: 'Finish' }
      ]), now]
    );
    
    await pool.query(
      `INSERT INTO tracks (id, name, description, distance, elevation_gain, checkpoints, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET 
         name = EXCLUDED.name,
         description = EXCLUDED.description`,
      [trackId3, 'Coastal Run', 'Scenic coastal route with ocean views', 12.0, 300, JSON.stringify([
        { lat: 40.6800, lng: -73.9500, name: 'Start' },
        { lat: 40.6900, lng: -73.9400, name: 'Beach Checkpoint' },
        { lat: 40.7000, lng: -73.9300, name: 'Finish' }
      ]), now]
    );
    
    // Insert races
    await pool.query(
      `INSERT INTO races (id, name, description, track_id, status, start_time, end_time, created_by, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET 
         name = EXCLUDED.name,
         description = EXCLUDED.description`,
      [raceId1, 'Weekly Championship', 'The weekly race championship event', trackId1, 'upcoming', startTime, endTime, userId1, now, now]
    );
    
    await pool.query(
      `INSERT INTO races (id, name, description, track_id, status, start_time, end_time, created_by, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET 
         name = EXCLUDED.name,
         description = EXCLUDED.description`,
      [raceId2, 'Beginner Sprint', 'A race designed for beginners', trackId2, 'upcoming', startTime, endTime, userId2, now, now]
    );
    
    // Insert race participants
    await pool.query(
      `INSERT INTO race_participants (id, race_id, user_id, team_id, status) 
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET 
         status = EXCLUDED.status`,
      ['participant-' + Date.now() + '-1', raceId1, userId1, teamId1, 'registered']
    );
    
    await pool.query(
      `INSERT INTO race_participants (id, race_id, user_id, team_id, status) 
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET 
         status = EXCLUDED.status`,
      ['participant-' + Date.now() + '-2', raceId1, userId2, teamId2, 'registered']
    );
    
    await pool.query(
      `INSERT INTO race_participants (id, race_id, user_id, team_id, status) 
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET 
         status = EXCLUDED.status`,
      ['participant-' + Date.now() + '-3', raceId2, userId3, null, 'registered']
    );
    
    console.log('✅ PostgreSQL database seeded successfully!');
    console.log('📝 Login credentials:');
    console.log('   Username: screenshot_user');
    console.log('   Password: screenshot123');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seedDatabase().catch(console.error);
