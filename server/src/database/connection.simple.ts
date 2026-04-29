/**
 * Simple Database Connection Manager
 * 
 * Fallback database connection for local development
 * Uses in-memory storage when PostgreSQL is not available
 */

import { logger } from '../utils/logger'

// Simple in-memory database for development
class InMemoryDB {
  private data: Map<string, any[]> = new Map()
  
  constructor() {
    logger.info('Using in-memory database for development')
  }
  
  async query(table: string, operation: string, params?: any) {
    logger.debug(`In-memory DB query: ${table} ${operation}`, params)
    
    switch (operation) {
      case 'find':
        return this.data.get(table) || []
      case 'create':
        const records = this.data.get(table) || []
        const newRecord = { id: Date.now().toString(), ...params }
        records.push(newRecord)
        this.data.set(table, records)
        return newRecord
      case 'update':
        const existingRecords = this.data.get(table) || []
        const index = existingRecords.findIndex(r => r.id === params.id)
        if (index !== -1) {
          existingRecords[index] = { ...existingRecords[index], ...params.data }
          return existingRecords[index]
        }
        return null
      case 'delete':
        const deleteRecords = this.data.get(table) || []
        const deleteIndex = deleteRecords.findIndex(r => r.id === params.id)
        if (deleteIndex !== -1) {
          deleteRecords.splice(deleteIndex, 1)
          return true
        }
        return false
      default:
        return []
    }
  }
}

let db: InMemoryDB | null = null

/**
 * Initialize database connection with fallback
 */
export async function initializeDatabase(): Promise<void> {
  try {
    logger.info('Initializing database connection...')
    
    // Try PostgreSQL first
    const pg = require('pg')
    const { Pool } = pg
    
    const connectionString = process.env.DATABASE_URL || 
      `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
    
    const pool = new Pool({
      connectionString
    })
    
    // Test connection
    const client = await pool.connect()
    await client.query('SELECT 1')
    client.release()
    
    logger.info('PostgreSQL connected successfully')
    return
  } catch (error) {
    logger.warn('PostgreSQL not available, falling back to in-memory database', error)
    
    // Use in-memory database
    db = new InMemoryDB()
    logger.info('In-memory database initialized')
  }
}

/**
 * Get database connection
 */
export function getDatabase() {
  return db
}

/**
 * Simple query interface
 */
export async function query(sql: string, params?: any[]) {
  if (db) {
    // Parse simple SQL for in-memory DB
    const tableMatch = sql.match(/FROM (\w+)/i)
    if (tableMatch) {
      const table = tableMatch[1]
      if (sql.includes('INSERT')) {
        return db.query(table, 'create', params?.[0])
      } else if (sql.includes('SELECT')) {
        return db.query(table, 'find')
      }
    }
    return []
  }
  
  // Fallback to PostgreSQL if available
  try {
    const pg = require('pg')
    const { Pool } = pg
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    })
    const result = await pool.query(sql, params)
    return result.rows
  } catch (error) {
    logger.error('Database query failed', error)
    return []
  }
}
