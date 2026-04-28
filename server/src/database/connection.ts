/**
 * Database Connection Manager
 * 
 * Manages database connections and provides connection pooling
 * for the Race Wars server application.
 */

import { testConnection, runMigrations } from './index'
import { logger } from '../utils/logger'

/**
 * Initialize database connection and run migrations
 */
export async function initializeDatabase(): Promise<void> {
  try {
    logger.info('Initializing database connection...')
    
    // Test database connection
    const isConnected = await testConnection()
    if (!isConnected) {
      throw new Error('Failed to connect to database')
    }
    
    // Run migrations
    logger.info('Running database migrations...')
    await runMigrations()
    
    logger.info('Database initialized successfully')
  } catch (error) {
    logger.error('Failed to initialize database', error)
    throw error
  }
}

/**
 * Gracefully close database connections
 */
export async function closeDatabase(): Promise<void> {
  try {
    logger.info('Closing database connections...')
    const { close } = await import('./index')
    await close()
    logger.info('Database connections closed')
  } catch (error) {
    logger.error('Failed to close database connections', error)
    throw error
  }
}
