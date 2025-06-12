// Global test setup
process.env.NODE_ENV = 'test';

// Set test environment variables
process.env.DISCORD_TOKEN = 'test-discord-token';
process.env.DEV_DISCORD_CHANNEL_ID = 'test-dev-channel-id';
process.env.CORE_DISCORD_CHANNEL_ID = 'test-core-channel-id';
process.env.SHORTCUT_API_TOKEN = 'test-shortcut-token';
process.env.LOGGER_LEVEL = 'error';
process.env.MAX_RETRIES = '3';
process.env.RETRY_DELAY = '1000';
process.env.PRODUCT_DEVELOPMENT_WORKFLOW_ID = '500000016';
process.env.OPERATIONAL_TASKS_WORKFLOW_ID = '500000017';
process.env.PRODUCT_DEVELOPEMENT_READY_FOR_REVIEW_STATE_ID = '500000018';
process.env.OPERATIONAL_TASKS_READY_FOR_REVIEW_STATE_ID = '500000019';
process.env.PORT = '3001';

// Global test cleanup
afterEach(() => {
  jest.clearAllMocks();
});

// Suppress console logs during tests unless explicitly needed
const originalConsole = console;
beforeAll(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
}); 