// Global test setup
process.env.NODE_ENV = 'test';

// Suppress console.log during tests unless explicitly needed
const originalConsole = global.console;
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: originalConsole.error, // Keep error for debugging
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
}); 