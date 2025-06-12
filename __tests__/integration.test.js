const request = require('supertest');

// Mock the Discord client before requiring the main app
jest.mock('discord.js', () => ({
  Client: jest.fn().mockImplementation(() => ({
    login: jest.fn().mockResolvedValue(),
    channels: {
      fetch: jest.fn().mockResolvedValue({
        send: jest.fn().mockResolvedValue()
      })
    }
  })),
  GatewayIntentBits: {
    Guilds: 1,
    GuildMessages: 2
  }
}));

// Mock axios
jest.mock('axios');
const axios = require('axios');

// Set up test environment variables
process.env.DISCORD_TOKEN = 'test-token';
process.env.DEV_DISCORD_CHANNEL_ID = '123456789';
process.env.CORE_DISCORD_CHANNEL_ID = '987654321';
process.env.SHORTCUT_API_TOKEN = 'test-shortcut-token';
process.env.LOGGER_LEVEL = 'error'; // Reduce log noise in tests
process.env.MAX_RETRIES = '1';
process.env.RETRY_DELAY = '100';
process.env.PRODUCT_DEVELOPMENT_WORKFLOW_ID = '500000001';
process.env.OPERATIONAL_TASKS_WORKFLOW_ID = '500000002';
process.env.PRODUCT_DEVELOPEMENT_READY_FOR_REVIEW_STATE_ID = '500000009';
process.env.OPERATIONAL_TASKS_READY_FOR_REVIEW_STATE_ID = '500000010';

describe('Webhook Integration Tests', () => {
  let app;

  beforeAll(() => {
    // Import the app after setting up all mocks and environment variables
    app = require('../bot.js');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should respond to POST requests with no story actions', async () => {
    const webhookPayload = {
      "actions": [
        {
          "id": 2925,
          "entity_type": "comment",
          "action": "create"
        }
      ]
    };

    const response = await request(app)
      .post('/')
      .send(webhookPayload);

    expect(response.status).toBe(200);
    expect(response.text).toBe('No story ID to process');
  });

  test('should process valid story update', async () => {
    // Mock the Shortcut API response
    axios.get.mockResolvedValue({
      data: {
        id: 2925,
        name: 'Test Story',
        app_url: 'https://app.shortcut.com/dewiz/story/2925',
        workflow_id: 500000001,
        workflow_state_id: 500000009,
        deadline: null,
        tasks: [],
        comments: [],
        owner_ids: []
      }
    });

    const webhookPayload = {
      "actions": [
        {
          "id": 2925,
          "entity_type": "story",
          "action": "update",
          "changes": {
            "workflow_state_id": {
              "new": 500000009,
              "old": 500000007
            }
          }
        }
      ]
    };

    const response = await request(app)
      .post('/')
      .send(webhookPayload);

    expect(response.status).toBe(200);
    expect(axios.get).toHaveBeenCalledWith(
      'https://api.app.shortcut.com/api/v3/stories/2925',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Shortcut-Token': 'test-shortcut-token'
        })
      })
    );
  });

  test('should handle empty webhook payload', async () => {
    const response = await request(app)
      .post('/')
      .send({});

    expect(response.status).toBe(200);
    expect(response.text).toBe('No actions to process');
  });

  test('should handle Shortcut API failure', async () => {
    axios.get.mockRejectedValue(new Error('API Error'));

    const webhookPayload = {
      "actions": [
        {
          "id": 2925,
          "entity_type": "story",
          "action": "update"
        }
      ]
    };

    const response = await request(app)
      .post('/')
      .send(webhookPayload);

    expect(response.status).toBe(500);
    expect(axios.get).toHaveBeenCalled();
  });
}); 