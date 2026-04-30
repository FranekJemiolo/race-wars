/**
 * Simple Database Connection Manager
 * 
 * Fallback database connection for local development
 * Uses SQLite file when available, otherwise in-memory storage
 */

import { logger } from '../utils/logger'
import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'
import fs from 'fs'

// SQLite database connection
let sqliteDb: Database.Database | null = null

// PostgreSQL pool
let pgPool: any = null

// Simple in-memory database for development (fallback)
class InMemoryDB {
  private data: Map<string, any[]> = new Map()
  
  constructor() {
    logger.info('Using in-memory database for development')
  }
  
  // Simple password hashing for testing
  private hashPassword(password: string): string {
    // For testing, just use a simple hash (not secure for production)
    return `hashed_${password}`
  }
  
  private comparePassword(password: string, hash: string): boolean {
    return hash === this.hashPassword(password)
  }
  
  async query(sql: string, params?: any[] | any) {
    logger.debug(`In-memory DB query: ${sql}`, params)
    
    // Parse SQL to determine operation (simplified)
    if (sql.includes('INSERT INTO')) {
      // Extract table name and create record
      const tableMatch = sql.match(/INSERT INTO (\w+)/)
      if (tableMatch) {
        const table = tableMatch[1]
        const records = this.data.get(table) || []
        
        // Handle password hashing for users table
        let processedParams: any = {}
        if (params && typeof params === 'object' && !Array.isArray(params)) {
          processedParams = { ...params }
          if (table === 'users' && (params as any).password) {
            processedParams.password_hash = this.hashPassword((params as any).password)
            delete processedParams.password
          }
        }
        
        const newRecord = { 
          id: Date.now().toString(), 
          ...processedParams,
          created_at: new Date(),
          updated_at: new Date(),
          is_active: true
        }
        records.push(newRecord)
        this.data.set(table, records)
        return { rows: [newRecord], rowCount: 1 }
      }
    } else if (sql.includes('SELECT')) {
      // Extract table name and return records
      const tableMatch = sql.match(/FROM (\w+)/)
      if (tableMatch) {
        const table = tableMatch[1]
        const records = this.data.get(table) || []
        
        // Apply WHERE clause if present (simplified)
        let filteredRecords = records
        if (sql.includes('WHERE') && params && params.length > 0) {
          const whereMatch = sql.match(/WHERE (\w+) = \$\d+/)
          if (whereMatch) {
            const field = whereMatch[1]
            const value = params[0]
            filteredRecords = records.filter(r => r[field] === value)
          }
        }
        
        return { rows: filteredRecords, rowCount: filteredRecords.length }
      }
    } else if (sql.includes('UPDATE')) {
      // Update record (simplified)
      const tableMatch = sql.match(/UPDATE (\w+)/)
      if (tableMatch) {
        const table = tableMatch[1]
        const records = this.data.get(table) || []
        // For simplicity, update the first record
        if (records.length > 0 && params && params.length > 0) {
          records[0] = { ...records[0], ...params[0], updated_at: new Date() }
          return { rows: [records[0]], rowCount: 1 }
        }
      }
    } else if (sql.includes('DELETE')) {
      // Delete record (simplified)
      const tableMatch = sql.match(/DELETE FROM (\w+)/)
      if (tableMatch) {
        const table = tableMatch[1]
        const records = this.data.get(table) || []
        // For simplicity, delete the first record
        if (records.length > 0) {
          records.shift()
          return { rows: [], rowCount: 1 }
        }
      }
    }
    
    return { rows: [], rowCount: 0 }
  }
}

let inMemoryDb: InMemoryDB | null = null

/**
 * Initialize database connection with fallback
 */
export async function initializeDatabase(): Promise<void> {
  logger.info('Initializing database connection...')
  
  // Check if SQLite is configured first
  const databaseUrl = process.env.DATABASE_URL || ''
  if (databaseUrl.startsWith('sqlite:')) {
    try {
      const dbPath = databaseUrl.replace('sqlite:', '')
      const fullPath = path.join(process.cwd(), dbPath)
      
      // Ensure directory exists
      const dir = path.dirname(fullPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      
      logger.info(`Using SQLite database at: ${fullPath}`)
      sqliteDb = new Database(fullPath)
      sqliteDb.pragma('journal_mode = WAL')
      logger.info('SQLite database connected successfully')
      return
    } catch (error) {
      logger.error('SQLite connection failed, falling back to in-memory', error)
    }
  }
  
  // Try PostgreSQL
  try {
    const pg = require('pg')
    const { Pool } = pg
    
    const connectionString = process.env.DATABASE_URL || 
      `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
    
    pgPool = new Pool({
      connectionString
    })
    
    // Test connection
    const client = await pgPool.connect()
    await client.query('SELECT 1')
    client.release()
    
    logger.info('PostgreSQL connected successfully')
    return
  } catch (error) {
    logger.warn('PostgreSQL not available, falling back to in-memory database', error)
  }
  
  // Use in-memory database as final fallback
  inMemoryDb = new InMemoryDB()
  logger.info('In-memory database initialized')
}

/**
 * Get database connection
 */
export function getDatabase() {
  return sqliteDb || inMemoryDb
}

/**
 * Simple query interface
 */
export async function query(sql: string, params?: any[]) {
  if (pgPool) {
    // Use PostgreSQL
    try {
      const result = await pgPool.query(sql, params)
      return { rows: result.rows, rowCount: result.rowCount }
    } catch (error) {
      logger.error('PostgreSQL query error:', error)
      throw error
    }
  }
  
  if (sqliteDb) {
    // Use SQLite
    try {
      const stmt = sqliteDb.prepare(sql)
      const result = stmt.run(params || [])
      return { rows: result, rowCount: result.changes }
    } catch (error) {
      logger.error('SQLite query error:', error)
      throw error
    }
  }
  
  if (!inMemoryDb) {
    await initializeDatabase()
  }
  return inMemoryDb!.query(sql, params)
}

/**
 * Compare password with hash (for authentication)
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  // Try bcrypt first (for real hashes)
  try {
    return await bcrypt.compare(password, hash)
  } catch (error) {
    // Fallback to simple hash for in-memory DB
    return hash === `hashed_${password}`
  }
}
