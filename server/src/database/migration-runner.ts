/**
 * Database Migration Runner
 * 
 * Manages database migrations with proper version tracking and rollback capabilities
 */

import { logger } from '../utils/logger';
import { query } from './connection.simple';
import * as fs from 'fs';
import * as path from 'path';

interface Migration {
  id: string;
  filename: string;
  sql: string;
  executed_at?: Date;
}

export class MigrationRunner {
  private migrationsPath: string;
  
  constructor(migrationsPath: string = path.join(__dirname, '../../../database/migrations')) {
    this.migrationsPath = migrationsPath;
  }

  /**
   * Initialize migration tracking table
   */
  async initialize(): Promise<void> {
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id VARCHAR(255) PRIMARY KEY,
          filename VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      logger.info('Migration tracking table initialized');
    } catch (error) {
      logger.error('Failed to initialize migration tracking', error);
      throw error;
    }
  }

  /**
   * Get all executed migrations
   */
  async getExecutedMigrations(): Promise<string[]> {
    try {
      const result = await query('SELECT id FROM schema_migrations ORDER BY id');
      return result.map((row: any) => row.id);
    } catch (error) {
      logger.error('Failed to get executed migrations', error);
      return [];
    }
  }

  /**
   * Get all available migration files
   */
  async getAvailableMigrations(): Promise<Migration[]> {
    try {
      const files = fs.readdirSync(this.migrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort(); // Sort to ensure proper order

      const migrations: Migration[] = [];
      
      for (const file of files) {
        const filePath = path.join(this.migrationsPath, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        const id = file.replace('.sql', '');
        
        migrations.push({
          id,
          filename: file,
          sql
        });
      }

      return migrations;
    } catch (error) {
      logger.error('Failed to read migration files', error);
      return [];
    }
  }

  /**
   * Run pending migrations
   */
  async runMigrations(): Promise<void> {
    try {
      await this.initialize();
      
      const executed = await this.getExecutedMigrations();
      const available = await this.getAvailableMigrations();
      
      const pending = available.filter(m => !executed.includes(m.id));
      
      if (pending.length === 0) {
        logger.info('No pending migrations');
        return;
      }

      logger.info(`Running ${pending.length} pending migrations`);
      
      for (const migration of pending) {
        await this.runMigration(migration);
      }
      
      logger.info('All migrations completed successfully');
    } catch (error) {
      logger.error('Migration failed', error);
      throw error;
    }
  }

  /**
   * Run a single migration
   */
  async runMigration(migration: Migration): Promise<void> {
    try {
      logger.info(`Running migration: ${migration.filename}`);
      
      // Start transaction
      await query('BEGIN');
      
      try {
        // Execute migration SQL
        await query(migration.sql);
        
        // Record migration as executed
        await query(
          'INSERT INTO schema_migrations (id, filename) VALUES ($1, $2)',
          [migration.id, migration.filename]
        );
        
        // Commit transaction
        await query('COMMIT');
        
        logger.info(`Migration completed: ${migration.filename}`);
      } catch (error) {
        // Rollback on error
        await query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      logger.error(`Failed to run migration ${migration.filename}`, error);
      throw error;
    }
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<{
    executed: number;
    pending: number;
    latest: string | null;
  }> {
    try {
      await this.initialize();
      
      const executed = await this.getExecutedMigrations();
      const available = await this.getAvailableMigrations();
      const pending = available.filter(m => !executed.includes(m.id));
      
      return {
        executed: executed.length,
        pending: pending.length,
        latest: executed.length > 0 ? executed[executed.length - 1] : null
      };
    } catch (error) {
      logger.error('Failed to get migration status', error);
      return {
        executed: 0,
        pending: 0,
        latest: null
      };
    }
  }

  /**
   * Rollback last migration (if rollback file exists)
   */
  async rollbackLastMigration(): Promise<void> {
    try {
      const executed = await this.getExecutedMigrations();
      
      if (executed.length === 0) {
        logger.warn('No migrations to rollback');
        return;
      }

      const lastMigration = executed[executed.length - 1];
      const rollbackFile = path.join(this.migrationsPath, `${lastMigration}_rollback.sql`);
      
      if (!fs.existsSync(rollbackFile)) {
        throw new Error(`Rollback file not found for migration: ${lastMigration}`);
      }

      const rollbackSql = fs.readFileSync(rollbackFile, 'utf8');
      
      logger.info(`Rolling back migration: ${lastMigration}`);
      
      // Start transaction
      await query('BEGIN');
      
      try {
        // Execute rollback SQL
        await query(rollbackSql);
        
        // Remove migration from executed list
        await query('DELETE FROM schema_migrations WHERE id = $1', [lastMigration]);
        
        // Commit transaction
        await query('COMMIT');
        
        logger.info(`Migration rolled back: ${lastMigration}`);
      } catch (error) {
        // Rollback on error
        await query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      logger.error('Failed to rollback migration', error);
      throw error;
    }
  }

  /**
   * Create a new migration file
   */
  async createMigration(name: string, description: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
      const filename = `${timestamp}_${name}.sql`;
      const filePath = path.join(this.migrationsPath, filename);
      
      const template = `-- Migration: ${name}
-- Description: ${description}
-- Created: ${new Date().toISOString()}

-- Add your migration SQL here
-- Example:
-- CREATE TABLE example_table (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     name VARCHAR(255) NOT NULL,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
-- );

-- Don't forget to add indexes
-- CREATE INDEX IF NOT EXISTS idx_example_table_name ON example_table(name);

-- Add triggers if needed
-- CREATE TRIGGER update_example_table_updated_at 
--     BEFORE UPDATE ON example_table 
--     FOR EACH ROW 
--     EXECUTE FUNCTION update_updated_at_column();
`;

      fs.writeFileSync(filePath, template);
      
      logger.info(`Migration created: ${filename}`);
      return filename;
    } catch (error) {
      logger.error('Failed to create migration', error);
      throw error;
    }
  }
}

// Export singleton instance
export const migrationRunner = new MigrationRunner();
