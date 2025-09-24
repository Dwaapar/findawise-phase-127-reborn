/**
 * Enhanced Logger Utility
 * ========================
 * 
 * Structured logging utility for the Findawise Empire Federation system
 */

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  component?: string;
  [key: string]: any;
}

class Logger {
  private formatMessage(level: string, message: string, meta: Record<string, any> = {}): string {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      ...meta
    };

    return JSON.stringify(logEntry);
  }

  info(message: string, meta: Record<string, any> = {}): void {
    console.log(this.formatMessage('info', message, meta));
  }

  warn(message: string, meta: Record<string, any> = {}): void {
    console.warn(this.formatMessage('warn', message, meta));
  }

  error(message: string, meta: Record<string, any> = {}): void {
    console.error(this.formatMessage('error', message, meta));
  }

  debug(message: string, meta: Record<string, any> = {}): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('debug', message, meta));
    }
  }
}

export const logger = new Logger();