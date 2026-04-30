const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

async function seedDatabase() {
  console.log('Seeding SQLite database with example data...');
  
  const dataDir = path.join(__dirname, '../data');
  const dbPath = path.join(dataDir, 'race_wars.db');
  
  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const db = new Database(dbPath);
  
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
    db.exec(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      experience_level TEXT DEFAULT 'beginner',
      role TEXT DEFAULT 'racer',
      is_verified BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT 1
    )`);
    
    db.exec(`CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      captain_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (captain_id) REFERENCES users(id)
    )`);
    
    db.exec(`CREATE TABLE IF NOT EXISTS races (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      track_id TEXT,
      status TEXT DEFAULT 'upcoming',
      start_time DATETIME,
      end_time DATETIME,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    db.exec(`CREATE TABLE IF NOT EXISTS tracks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      distance REAL,
      elevation_gain REAL,
      checkpoints TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    db.exec(`CREATE TABLE IF NOT EXISTS race_participants (
      id TEXT PRIMARY KEY,
      race_id TEXT,
      user_id TEXT,
      team_id TEXT,
      status TEXT DEFAULT 'registered',
      start_time DATETIME,
      end_time DATETIME,
      total_time REAL,
      FOREIGN KEY (race_id) REFERENCES races(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (team_id) REFERENCES teams(id)
    )`);
    
    // Insert users
    const insertUser = db.prepare(`INSERT OR REPLACE INTO users (id, username, email, password_hash, display_name, experience_level, role, is_verified, created_at, updated_at, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    insertUser.run(userId1, 'screenshot_user', 'screenshot@test.com', passwordHash, 'Screenshot User', 'advanced', 'admin', 1, now, now, 1);
    insertUser.run(userId2, 'racer_one', 'racer1@test.com', passwordHash, 'Racer One', 'intermediate', 'racer', 1, now, now, 1);
    insertUser.run(userId3, 'racer_two', 'racer2@test.com', passwordHash, 'Racer Two', 'beginner', 'racer', 0, now, now, 1);
    
    // Insert teams
    const insertTeam = db.prepare(`INSERT OR REPLACE INTO teams (id, name, description, captain_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`);
    insertTeam.run(teamId1, 'Speed Demons', 'A team focused on speed and endurance', userId1, now, now);
    insertTeam.run(teamId2, 'Trail Blazers', 'Mountain racing specialists', userId2, now, now);
    
    // Insert tracks
    const insertTrack = db.prepare(`INSERT OR REPLACE INTO tracks (id, name, description, distance, elevation_gain, checkpoints, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    insertTrack.run(trackId1, 'Mountain Trail', 'Challenging mountain trail with steep climbs', 15.5, 1200, JSON.stringify([
      { lat: 40.7128, lng: -74.0060, name: 'Start' },
      { lat: 40.7228, lng: -74.0160, name: 'Checkpoint 1' },
      { lat: 40.7328, lng: -74.0260, name: 'Checkpoint 2' },
      { lat: 40.7428, lng: -74.0360, name: 'Finish' }
    ]), now);
    
    insertTrack.run(trackId2, 'City Sprint', 'Fast-paced urban race through downtown', 8.2, 150, JSON.stringify([
      { lat: 40.7500, lng: -73.9900, name: 'Start' },
      { lat: 40.7600, lng: -73.9800, name: 'Midpoint' },
      { lat: 40.7700, lng: -73.9700, name: 'Finish' }
    ]), now);
    
    insertTrack.run(trackId3, 'Coastal Run', 'Scenic coastal route with ocean views', 12.0, 300, JSON.stringify([
      { lat: 40.6800, lng: -73.9500, name: 'Start' },
      { lat: 40.6900, lng: -73.9400, name: 'Beach Checkpoint' },
      { lat: 40.7000, lng: -73.9300, name: 'Finish' }
    ]), now);
    
    // Insert races
    const insertRace = db.prepare(`INSERT OR REPLACE INTO races (id, name, description, track_id, status, start_time, end_time, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    insertRace.run(raceId1, 'Weekly Championship', 'The weekly race championship event', trackId1, 'upcoming', startTime, endTime, userId1, now, now);
    insertRace.run(raceId2, 'Beginner Sprint', 'A race designed for beginners', trackId2, 'upcoming', startTime, endTime, userId2, now, now);
    
    // Insert race participants
    const insertParticipant = db.prepare(`INSERT OR REPLACE INTO race_participants (id, race_id, user_id, team_id, status) VALUES (?, ?, ?, ?, ?)`);
    insertParticipant.run('participant-' + Date.now() + '-1', raceId1, userId1, teamId1, 'registered');
    insertParticipant.run('participant-' + Date.now() + '-2', raceId1, userId2, teamId2, 'registered');
    insertParticipant.run('participant-' + Date.now() + '-3', raceId2, userId3, null, 'registered');
    
    console.log('✅ Database seeded successfully!');
    console.log('📝 Login credentials:');
    console.log('   Username: screenshot_user');
    console.log('   Password: screenshot123');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    db.close();
  }
}

seedDatabase().catch(console.error);
