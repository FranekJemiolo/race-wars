import { pool } from '../index';

export interface UserExperience {
  id: string;
  userId: string;
  level: number;
  experiencePoints: number;
  totalSessions: number;
  totalLaps: number;
  totalDistanceKm: number;
  bestLapTime?: number;
  totalPenalties: number;
  totalIncidents: number;
  achievements?: any;
  currentStreak: number;
  longestStreak: number;
  lastSessionAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExperienceHistory {
  id: string;
  userId: string;
  sessionId?: string;
  type: string;
  pointsEarned: number;
  reason?: string;
  metadata?: any;
  createdAt: Date;
}

export interface LevelThreshold {
  level: number;
  requiredXP: number;
  title: string;
}

const LEVEL_THRESHOLDS: LevelThreshold[] = [
  { level: 1, requiredXP: 0, title: 'Novice' },
  { level: 2, requiredXP: 100, title: 'Amateur' },
  { level: 3, requiredXP: 500, title: 'Club Racer' },
  { level: 4, requiredXP: 1500, title: 'Semi-Pro' },
  { level: 5, requiredXP: 3500, title: 'Professional' },
  { level: 6, requiredXP: 7000, title: 'Expert' },
  { level: 7, requiredXP: 12000, title: 'Master' },
  { level: 8, requiredXP: 20000, title: 'Champion' },
  { level: 9, requiredXP: 35000, title: 'Legend' },
  { level: 10, requiredXP: 50000, title: 'Hall of Fame' },
];

export class UserExperienceRepository {
  async findByUserId(userId: string): Promise<UserExperience | null> {
    const result = await pool.query(
      `SELECT * FROM user_experience WHERE user_id = $1`,
      [userId]
    );

    return result.rows.length > 0 ? this.mapRowToUserExperience(result.rows[0]) : null;
  }

  async create(userId: string): Promise<UserExperience> {
    const result = await pool.query(
      `INSERT INTO user_experience (id, user_id, level, experience_points)
       VALUES ($1, $2, 1, 0)
       RETURNING *`,
      [`xp_${userId}`, userId]
    );

    return this.mapRowToUserExperience(result.rows[0]);
  }

  async addExperience(userId: string, points: number, type: string, reason?: string, sessionId?: string, metadata?: any): Promise<UserExperience> {
    // Get or create user experience
    let experience = await this.findByUserId(userId);
    if (!experience) {
      experience = await this.create(userId);
    }

    // Add to history
    await pool.query(
      `INSERT INTO experience_history (id, user_id, session_id, type, points_earned, reason, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        `hist_${Date.now()}_${userId}`,
        userId,
        sessionId || null,
        type,
        points,
        reason || null,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );

    // Update experience points
    const newXP = experience.experiencePoints + points;
    const newLevel = this.calculateLevel(newXP);

    await pool.query(
      `UPDATE user_experience 
       SET experience_points = $1, level = $2, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $3`,
      [newXP, newLevel, userId]
    );

    const updatedExperience = await this.findByUserId(userId);
    if (!updatedExperience) {
      throw new Error('Failed to retrieve updated experience');
    }
    return updatedExperience;
  }

  async updateStats(userId: string, stats: {
    totalSessions?: number;
    totalLaps?: number;
    totalDistanceKm?: number;
    bestLapTime?: number;
    totalPenalties?: number;
    totalIncidents?: number;
  }): Promise<UserExperience> {
    let experience = await this.findByUserId(userId);
    if (!experience) {
      experience = await this.create(userId);
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (stats.totalSessions !== undefined) {
      updates.push(`total_sessions = total_sessions + $${paramIndex++}`);
      values.push(stats.totalSessions);
    }
    if (stats.totalLaps !== undefined) {
      updates.push(`total_laps = total_laps + $${paramIndex++}`);
      values.push(stats.totalLaps);
    }
    if (stats.totalDistanceKm !== undefined) {
      updates.push(`total_distance_km = total_distance_km + $${paramIndex++}`);
      values.push(stats.totalDistanceKm);
    }
    if (stats.bestLapTime !== undefined) {
      updates.push(`best_lap_time = CASE WHEN best_lap_time IS NULL OR $${paramIndex} < best_lap_time THEN $${paramIndex} ELSE best_lap_time END`);
      values.push(stats.bestLapTime);
      paramIndex++;
    }
    if (stats.totalPenalties !== undefined) {
      updates.push(`total_penalties = total_penalties + $${paramIndex++}`);
      values.push(stats.totalPenalties);
    }
    if (stats.totalIncidents !== undefined) {
      updates.push(`total_incidents = total_incidents + $${paramIndex++}`);
      values.push(stats.totalIncidents);
    }

    if (updates.length > 0) {
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(userId);

      await pool.query(
        `UPDATE user_experience SET ${updates.join(', ')} WHERE user_id = $${paramIndex}`,
        values
      );
    }

    const updatedExperience = await this.findByUserId(userId);
    if (!updatedExperience) {
      throw new Error('Failed to retrieve updated experience');
    }
    return updatedExperience;
  }

  async updateStreak(userId: string, participated: boolean): Promise<UserExperience> {
    let experience = await this.findByUserId(userId);
    if (!experience) {
      experience = await this.create(userId);
    }

    if (participated) {
      const newStreak = experience.currentStreak + 1;
      const newLongestStreak = Math.max(experience.longestStreak, newStreak);

      await pool.query(
        `UPDATE user_experience 
         SET current_streak = $1, longest_streak = $2, last_session_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $3`,
        [newStreak, newLongestStreak, userId]
      );
    } else {
      // Reset streak if didn't participate
      await pool.query(
        `UPDATE user_experience 
         SET current_streak = 0, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1`,
        [userId]
      );
    }

    const updatedExperience = await this.findByUserId(userId);
    if (!updatedExperience) {
      throw new Error('Failed to retrieve updated experience');
    }
    return updatedExperience;
  }

  async getExperienceHistory(userId: string, limit = 50): Promise<ExperienceHistory[]> {
    const result = await pool.query(
      `SELECT * FROM experience_history 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows.map(row => this.mapRowToExperienceHistory(row));
  }

  async getLeaderboard(limit = 50, offset = 0): Promise<UserExperience[]> {
    const result = await pool.query(
      `SELECT * FROM user_experience 
       ORDER BY experience_points DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows.map(row => this.mapRowToUserExperience(row));
  }

  calculateLevel(xp: number): number {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= LEVEL_THRESHOLDS[i].requiredXP) {
        return LEVEL_THRESHOLDS[i].level;
      }
    }
    return 1;
  }

  getLevelInfo(level: number): LevelThreshold | null {
    return LEVEL_THRESHOLDS.find(t => t.level === level) || null;
  }

  getXPForNextLevel(currentLevel: number): number {
    const nextLevel = currentLevel + 1;
    const nextThreshold = LEVEL_THRESHOLDS.find(t => t.level === nextLevel);
    return nextThreshold ? nextThreshold.requiredXP : -1;
  }

  getXPProgress(currentXP: number, currentLevel: number): { current: number; required: number; percentage: number } {
    const currentThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel);
    const nextThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel + 1);

    if (!currentThreshold || !nextThreshold) {
      return { current: currentXP, required: currentXP, percentage: 100 };
    }

    const current = currentXP - currentThreshold.requiredXP;
    const required = nextThreshold.requiredXP - currentThreshold.requiredXP;
    const percentage = (current / required) * 100;

    return { current, required, percentage };
  }

  private mapRowToUserExperience(row: any): UserExperience {
    return {
      id: row.id,
      userId: row.user_id,
      level: row.level,
      experiencePoints: row.experience_points,
      totalSessions: row.total_sessions,
      totalLaps: row.total_laps,
      totalDistanceKm: row.total_distance_km,
      bestLapTime: row.best_lap_time,
      totalPenalties: row.total_penalties,
      totalIncidents: row.total_incidents,
      achievements: row.achievements ? JSON.parse(row.achievements) : null,
      currentStreak: row.current_streak,
      longestStreak: row.longest_streak,
      lastSessionAt: row.last_session_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapRowToExperienceHistory(row: any): ExperienceHistory {
    return {
      id: row.id,
      userId: row.user_id,
      sessionId: row.session_id,
      type: row.type,
      pointsEarned: row.points_earned,
      reason: row.reason,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      createdAt: row.created_at,
    };
  }
}

export const userExperienceRepository = new UserExperienceRepository();
