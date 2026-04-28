/**
 * Database connection and configuration
 * 
 * This module sets up the PostgreSQL connection pool and provides
 * database access utilities for the entire application.
 */

import { Pool, PoolConfig } from 'pg'
import { logger } from '../utils/logger'

// Database configuration
const config: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'race_wars',
  user: process.env.DB_USER || 'race_wars',
  password: process.env.DB_PASSWORD || 'race_wars_dev',
  max: 20, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait when connecting a new client
}

// Create connection pool
const pool = new Pool(config)

// Handle pool errors
pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err)
  process.exit(-1)
})

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect()
    await client.query('SELECT NOW()')
    client.release()
    logger.info('Database connection successful')
    return true
  } catch (error) {
    logger.error('Database connection failed:', error)
    return false
  }
}

// Database helper functions
export async function query(text: string, params?: any[]): Promise<any> {
  const start = Date.now()
  try {
    const client = await pool.connect()
    const result = await client.query(text, params)
    client.release()
    const duration = Date.now() - start
    logger.debug('Executed query', { text, duration, rows: result.rowCount })
    return result
  } catch (error) {
    const duration = Date.now() - start
    logger.error('Query error', { text, duration, error })
    throw error
  }
}

// Transaction helper
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// Migration runner
export async function runMigrations(): Promise<void> {
  try {
    // Create migrations table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Get list of migration files
    const fs = require('fs')
    const path = require('path')
    const migrationsDir = path.join(__dirname, '../../database/migrations')
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter((file: string) => file.endsWith('.sql'))
      .sort()

    // Get executed migrations
    const executedResult = await query('SELECT filename FROM migrations ORDER BY filename')
    const executedMigrations = new Set(executedResult.rows.map((row: any) => row.filename))

    // Run pending migrations
    for (const file of migrationFiles) {
      if (!executedMigrations.has(file)) {
        logger.info(`Running migration: ${file}`)
        const migrationSQL = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
        await transaction(async (client) => {
          await client.query(migrationSQL)
          await client.query('INSERT INTO migrations (filename) VALUES ($1)', [file])
        })
        logger.info(`Migration completed: ${file}`)
      }
    }

    logger.info('All migrations completed')
  } catch (error) {
    logger.error('Migration error:', error)
    throw error
  }
}

// Close database connections
export async function close(): Promise<void> {
  await pool.end()
  logger.info('Database connections closed')
}

// Export the pool for direct access if needed
export { pool }
