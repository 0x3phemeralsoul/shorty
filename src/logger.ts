import pino from 'pino';
import { Logger } from './types';

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Create Pino logger configuration
const loggerConfig: pino.LoggerOptions = {
  level: process.env.LOGGER_LEVEL || (isTest ? 'error' : 'info'),
  // In production, use structured JSON logging
  formatters: {
    level: (label: string) => {
      return { level: label };
    }
  }
};

// Add transport only in development
if (isDevelopment) {
  loggerConfig.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  };
}

// Create Pino logger instance
const pinoLogger = pino(loggerConfig);

// Create a wrapper that implements our Logger interface
export const logger: Logger = {
  info: (message: string, ...args: unknown[]): void => {
    pinoLogger.info({ args }, message);
  },

  warn: (message: string, ...args: unknown[]): void => {
    pinoLogger.warn({ args }, message);
  },

  error: (message: string, error?: Error | unknown, ...args: unknown[]): void => {
    if (error instanceof Error) {
      pinoLogger.error({ err: error, args }, message);
    } else if (error) {
      pinoLogger.error({ error, args }, message);
    } else {
      pinoLogger.error({ args }, message);
    }
  },

  debug: (message: string, ...args: unknown[]): void => {
    pinoLogger.debug({ args }, message);
  }
};

export default logger; 