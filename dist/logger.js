"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';
// Create Pino logger configuration
const loggerConfig = {
    level: process.env.LOGGER_LEVEL || (isTest ? 'error' : 'info'),
    // In production, use structured JSON logging
    formatters: {
        level: (label) => {
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
const pinoLogger = (0, pino_1.default)(loggerConfig);
// Create a wrapper that implements our Logger interface
exports.logger = {
    info: (message, ...args) => {
        pinoLogger.info({ args }, message);
    },
    warn: (message, ...args) => {
        pinoLogger.warn({ args }, message);
    },
    error: (message, error, ...args) => {
        if (error instanceof Error) {
            pinoLogger.error({ err: error, args }, message);
        }
        else if (error) {
            pinoLogger.error({ error, args }, message);
        }
        else {
            pinoLogger.error({ args }, message);
        }
    },
    debug: (message, ...args) => {
        pinoLogger.debug({ args }, message);
    }
};
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map