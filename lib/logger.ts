/**
 * Production-safe logging utility for OpenMed
 * Prevents sensitive data exposure in production logs
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  userId?: string
  action?: string
  endpoint?: string
  [key: string]: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isDebugEnabled = process.env.ENABLE_DEBUG_LOGS === 'true'

  private sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data
    }

    const sensitiveKeys = [
      'password', 'token', 'key', 'secret', 'api_key', 'apiKey', 'auth',
      'authorization', 'cookie', 'session', 'encrypted_api_key'
    ]

    const sanitized = { ...data }
    
    for (const [key, value] of Object.entries(sanitized)) {
      const keyLower = key.toLowerCase()
      
      if (sensitiveKeys.some(sensitive => keyLower.includes(sensitive))) {
        if (typeof value === 'string' && value.length > 8) {
          sanitized[key] = `${value.substring(0, 4)}****${value.substring(value.length - 4)}`
        } else {
          sanitized[key] = '****'
        }
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value)
      }
    }

    return sanitized
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    // Only log errors and warnings in production
    if (!this.isDevelopment && level !== 'error' && level !== 'warn') {
      return
    }

    // Skip debug logs unless explicitly enabled
    if (level === 'debug' && !this.isDebugEnabled) {
      return
    }

    const timestamp = new Date().toISOString()
    const sanitizedContext = context ? this.sanitizeData(context) : undefined

    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...(sanitizedContext && { context: sanitizedContext })
    }

    switch (level) {
      case 'error':
        console.error(JSON.stringify(logEntry))
        break
      case 'warn':
        console.warn(JSON.stringify(logEntry))
        break
      case 'info':
        console.info(JSON.stringify(logEntry))
        break
      case 'debug':
        console.log(JSON.stringify(logEntry))
        break
    }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context)
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context)
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context)
  }

  error(message: string, error?: Error | any, context?: LogContext) {
    const errorContext = {
      ...context,
      ...(error instanceof Error && {
        error: {
          name: error.name,
          message: error.message,
          stack: this.isDevelopment ? error.stack : undefined
        }
      }),
      ...(error && !(error instanceof Error) && { error: this.sanitizeData(error) })
    }

    this.log('error', message, errorContext)
  }
}

export const logger = new Logger()
