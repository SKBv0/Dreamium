type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  prefix?: string;
}

const defaultConfig: LoggerConfig = {
  // Enable logging in development OR if explicitly enabled via env variable
  enabled: process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEBUG_LOGGING === 'true',
  // Allow controlling log level via env variable (default: info in dev, warn in prod)
  level: process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel ||
         (process.env.NODE_ENV === 'production' ? 'warn' : 'info'),
  prefix: '[Dreamium]',
};

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;

    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const requestedLevelIndex = levels.indexOf(level);

    return requestedLevelIndex >= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, ...args: unknown[]): void {
    if (!this.shouldLog(level)) return;

    const prefix = this.config.prefix ? `${this.config.prefix} ` : '';
    const timestamp = new Date().toISOString();
    const formattedMessage = `${prefix}[${timestamp}] [${level.toUpperCase()}]`;

    // Serialize objects for better logging
    const serializedArgs = args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return arg;
    });

    switch (level) {
      case 'debug':
        console.debug(formattedMessage, message, ...serializedArgs);
        break;
      case 'info':
        console.info(formattedMessage, message, ...serializedArgs);
        break;
      case 'warn':
        console.warn(formattedMessage, message, ...serializedArgs);
        break;
      case 'error':
        console.error(formattedMessage, message, ...serializedArgs);
        break;
    }
  }

  debug(message: string, ...args: unknown[]): void {
    this.formatMessage('debug', message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.formatMessage('info', message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.formatMessage('warn', message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.formatMessage('error', message, ...args);
  }
}

export const logger = new Logger();

