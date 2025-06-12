const request = require('supertest');
const axios = require('axios');

// Mock dependencies before importing the app
jest.mock('axios');
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

// Mock environment variables
process.env.DISCORD_TOKEN = 'test-discord-token';
process.env.DEV_DISCORD_CHANNEL_ID = '123456789';
process.env.CORE_DISCORD_CHANNEL_ID = '987654321';
process.env.SHORTCUT_API_TOKEN = 'test-shortcut-token';
process.env.LOGGER_LEVEL = 'error';
process.env.MAX_RETRIES = '3';
process.env.RETRY_DELAY = '1000';
process.env.PRODUCT_DEVELOPMENT_WORKFLOW_ID = '500000001';
process.env.OPERATIONAL_TASKS_WORKFLOW_ID = '500000002';
process.env.PRODUCT_DEVELOPEMENT_READY_FOR_REVIEW_STATE_ID = '500000009';
process.env.OPERATIONAL_TASKS_READY_FOR_REVIEW_STATE_ID = '500000010';

// Import the app after setting up mocks
const app = require('../bot.js');

describe('Webhook Handler', () => {
  let mockChannel;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockChannel = {
      send: jest.fn().mockResolvedValue()
    };
    
    // Mock axios response for story details
    axios.get.mockResolvedValue({
      data: {
        id: 2925,
        name: 'test',
        app_url: 'https://app.shortcut.com/dewiz/story/2925',
        workflow_id: 500000001, // Product Development workflow
        workflow_state_id: 500000009,
        deadline: '2025-06-15T00:00:00Z',
        tasks: [
          {
            owner_ids: ['6380d4da-0ae7-4ca5-a7f4-59ba335b4460']
          }
        ],
        comments: [
          {
            text: 'PR: https://github.com/example/repo/pull/123'
          }
        ]
      }
    });

    // Mock Discord client
    const { Client } = require('discord.js');
    const mockClient = new Client();
    mockClient.channels.fetch.mockResolvedValue(mockChannel);
  });

  describe('Story Ready for Review', () => {
    const webhookEvent = {
      "id": "68496234-90f4-43cf-826e-d75f124a16b1",
      "changed_at": "2025-06-11T11:02:12.608Z",
      "version": "v1",
      "primary_id": 2925,
      "actor_name": "Ephy",
      "member_id": "6380d4da-0ae7-4ca5-a7f4-59ba335b4460",
      "actions": [
        {
          "id": 2925,
          "entity_type": "story",
          "action": "update",
          "name": "test",
          "story_type": "feature",
          "app_url": "https://app.shortcut.com/dewiz/story/2925",
          "changes": {
            "started": {
              "new": true,
              "old": false
            },
            "position": {
              "new": 32174189568,
              "old": 12174189568
            },
            "workflow_state_id": {
              "new": 500000009,
              "old": 500000007
            },
            "started_at": {
              "new": "2025-06-11T11:02:12Z"
            }
          }
        }
      ],
      "references": [
        {
          "id": 500000009,
          "entity_type": "workflow-state",
          "name": "Ready for Review",
          "type": "started"
        },
        {
          "id": 500000007,
          "entity_type": "workflow-state",
          "name": "Ready for Development",
          "type": "unstarted"
        }
      ]
    };

    test('should process webhook event for story ready for review', async () => {
      const response = await request(app)
        .post('/')
        .send(webhookEvent)
        .expect(200);

      expect(response.text).toBe('Event processed');
      
      // Verify that the Shortcut API was called
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.app.shortcut.com/api/v3/stories/2925',
        {
          headers: {
            "Shortcut-Token": 'test-shortcut-token',
            "Content-Type": "application/json"
          }
        }
      );
    });

    test('should handle malformed webhook payload gracefully', async () => {
      const malformedPayload = {
        "invalid": "payload"
      };

      // This should not crash the server
      const response = await request(app)
        .post('/')
        .send(malformedPayload);

      expect(response.status).toBe(200);
      expect(response.text).toBe('No actions to process');
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      axios.get.mockRejectedValue(new Error('API Error'));

      const webhookEvent = {
        actions: [
          {
            id: 2925,
            entity_type: "story",
            action: "update",
            changes: {
              workflow_state_id: {
                new: 500000009,
                old: 500000007
              }
            }
          }
        ]
      };

      await request(app)
        .post('/')
        .send(webhookEvent)
        .expect(500);

      expect(axios.get).toHaveBeenCalled();
    });
  });
}); 