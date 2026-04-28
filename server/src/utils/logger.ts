/**
 * Simple logger utility for the Race Wars server
 * 
 * This provides a centralized logging interface that can be
 * extended to use more sophisticated logging frameworks
 * like Winston or Pino in the future.
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel = LogLevel.INFO

  constructor() {
    // Set log level from environment variable
    const envLevel = process.env.LOG_LEVEL?.toUpperCase()
    if (envLevel && envLevel in LogLevel) {
      this.level = LogLevel[envLevel as keyof typeof LogLevel]
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString()
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : ''
    return `[${timestamp}] ${level}: ${message}${metaStr}`
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage('DEBUG', message, meta))
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', message, meta))
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, meta))
    }
  }

  error(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', message, meta))
    }
  }
}

// Export a singleton logger instance
export const logger = new Logger()

// Export convenience functions for backward compatibility
export function log(...args: any[]): void {
  console.log(...args)
}

export function error(...args: any[]): void {
  console.error(...args)
}

export function warn(...args: any[]): void {
  console.warn(...args)
}
