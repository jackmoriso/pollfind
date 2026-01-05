/**
 * Simple logging utility with timestamps and colors
 */

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
  DEBUG = 'DEBUG',
}

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function getTimestamp(): string {
  return new Date().toISOString();
}

function getColorForLevel(level: LogLevel): string {
  switch (level) {
    case LogLevel.INFO:
      return colors.blue;
    case LogLevel.WARN:
      return colors.yellow;
    case LogLevel.ERROR:
      return colors.red;
    case LogLevel.SUCCESS:
      return colors.green;
    case LogLevel.DEBUG:
      return colors.dim;
    default:
      return colors.reset;
  }
}

function log(level: LogLevel, message: string, data?: any) {
  const color = getColorForLevel(level);
  const timestamp = getTimestamp();
  const prefix = `${color}[${timestamp}] [${level}]${colors.reset}`;

  if (data) {
    console.log(prefix, message, data);
  } else {
    console.log(prefix, message);
  }
}

export const logger = {
  info: (message: string, data?: any) => log(LogLevel.INFO, message, data),
  warn: (message: string, data?: any) => log(LogLevel.WARN, message, data),
  error: (message: string, data?: any) => log(LogLevel.ERROR, message, data),
  success: (message: string, data?: any) => log(LogLevel.SUCCESS, message, data),
  debug: (message: string, data?: any) => log(LogLevel.DEBUG, message, data),
};
