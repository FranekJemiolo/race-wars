import { pool } from '../index';

export interface CarProfile {
  id: string;
  userId: string;
  name: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  carNumber?: string;
  class?: string;
  category?: string;
  specifications?: any;
  imageUrl?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCarProfileInput {
  userId: string;
  name: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  carNumber?: string;
  class?: string;
  category?: string;
  specifications?: any;
  imageUrl?: string;
  isDefault?: boolean;
}

export interface UpdateCarProfileInput {
  name?: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  carNumber?: string;
  class?: string;
  category?: string;
  specifications?: any;
  imageUrl?: string;
  isDefault?: boolean;
}

export class CarProfileRepository {
  async create(input: CreateCarProfileInput): Promise<CarProfile> {
    // If this is set as default, unset other defaults for this user
    if (input.isDefault) {
      await pool.query(
        `UPDATE car_profiles SET is_default = FALSE WHERE user_id = $1`,
        [input.userId]
      );
    }

    const result = await pool.query(
      `INSERT INTO car_profiles (id, user_id, name, make, model, year, color, car_number, class, category, specifications, image_url, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        `car_${Date.now()}_${input.userId}`,
        input.userId,
        input.name,
        input.make || null,
        input.model || null,
        input.year || null,
        input.color || null,
        input.carNumber || null,
        input.class || null,
        input.category || null,
        input.specifications ? JSON.stringify(input.specifications) : null,
        input.imageUrl || null,
        input.isDefault || false,
      ]
    );

    return this.mapRowToCarProfile(result.rows[0]);
  }

  async findById(id: string): Promise<CarProfile | null> {
    const result = await pool.query(
      `SELECT * FROM car_profiles WHERE id = $1`,
      [id]
    );

    return result.rows.length > 0 ? this.mapRowToCarProfile(result.rows[0]) : null;
  }

  async findByUserId(userId: string): Promise<CarProfile[]> {
    const result = await pool.query(
      `SELECT * FROM car_profiles WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );

    return result.rows.map(row => this.mapRowToCarProfile(row));
  }

  async findDefaultByUserId(userId: string): Promise<CarProfile | null> {
    const result = await pool.query(
      `SELECT * FROM car_profiles WHERE user_id = $1 AND is_default = TRUE`,
      [userId]
    );

    return result.rows.length > 0 ? this.mapRowToCarProfile(result.rows[0]) : null;
  }

  async findByClass(carClass: string): Promise<CarProfile[]> {
    const result = await pool.query(
      `SELECT * FROM car_profiles WHERE class = $1 ORDER BY created_at DESC`,
      [carClass]
    );

    return result.rows.map(row => this.mapRowToCarProfile(row));
  }

  async update(id: string, input: UpdateCarProfileInput): Promise<CarProfile | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (input.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(input.name);
    }
    if (input.make !== undefined) {
      updates.push(`make = $${paramIndex++}`);
      values.push(input.make);
    }
    if (input.model !== undefined) {
      updates.push(`model = $${paramIndex++}`);
      values.push(input.model);
    }
    if (input.year !== undefined) {
      updates.push(`year = $${paramIndex++}`);
      values.push(input.year);
    }
    if (input.color !== undefined) {
      updates.push(`color = $${paramIndex++}`);
      values.push(input.color);
    }
    if (input.carNumber !== undefined) {
      updates.push(`car_number = $${paramIndex++}`);
      values.push(input.carNumber);
    }
    if (input.class !== undefined) {
      updates.push(`class = $${paramIndex++}`);
      values.push(input.class);
    }
    if (input.category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      values.push(input.category);
    }
    if (input.specifications !== undefined) {
      updates.push(`specifications = $${paramIndex++}`);
      values.push(JSON.stringify(input.specifications));
    }
    if (input.imageUrl !== undefined) {
      updates.push(`image_url = $${paramIndex++}`);
      values.push(input.imageUrl);
    }
    if (input.isDefault !== undefined) {
      updates.push(`is_default = $${paramIndex++}`);
      values.push(input.isDefault);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    // If setting as default, unset other defaults
    if (input.isDefault === true) {
      const profile = await this.findById(id);
      if (profile) {
        await pool.query(
          `UPDATE car_profiles SET is_default = FALSE WHERE user_id = $1 AND id != $2`,
          [profile.userId, id]
        );
      }
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE car_profiles 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    return result.rows.length > 0 ? this.mapRowToCarProfile(result.rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM car_profiles WHERE id = $1`,
      [id]
    );

    return (result.rowCount || 0) > 0;
  }

  async setDefault(userId: string, profileId: string): Promise<boolean> {
    // Unset all defaults for user
    await pool.query(
      `UPDATE car_profiles SET is_default = FALSE WHERE user_id = $1`,
      [userId]
    );

    // Set new default
    const result = await pool.query(
      `UPDATE car_profiles SET is_default = TRUE WHERE id = $1 AND user_id = $2`,
      [profileId, userId]
    );

    return (result.rowCount || 0) > 0;
  }

  private mapRowToCarProfile(row: any): CarProfile {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      make: row.make,
      model: row.model,
      year: row.year,
      color: row.color,
      carNumber: row.car_number,
      class: row.class,
      category: row.category,
      specifications: row.specifications ? JSON.parse(row.specifications) : null,
      imageUrl: row.image_url,
      isDefault: row.is_default,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const carProfileRepository = new CarProfileRepository();
