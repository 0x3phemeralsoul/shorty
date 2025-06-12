import request from 'supertest';
import app from '../src/bot';
import { WebhookEvent } from '../src/types';

// Mock Discord.js
jest.mock('discord.js', () => ({
  Client: jest.fn().mockImplementation(() => ({
    login: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    channels: {
      fetch: jest.fn().mockResolvedValue({
        isTextBased: () => true,
        send: jest.fn().mockResolvedValue(undefined)
      })
    },
    user: { tag: 'TestBot#1234' },
    destroy: jest.fn()
  })),
  GatewayIntentBits: {
    Guilds: 1,
    GuildMessages: 2
  }
}));

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({
    data: {
      id: 123,
      name: 'Test Story',
      app_url: 'https://app.shortcut.com/test/story/123',
      workflow_id: 500000016,
      workflow_state_id: 500000017,
      deadline: null,
      tasks: [],
      comments: [],
      owner_ids: ['test-user-id'],
      story_type: 'feature',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      archived: false,
      started: false,
      completed: false,
      follower_ids: [],
      labels: [],
      linked_files: [],
      member_mention_ids: [],
      mention_ids: [],
      position: 1,
      previous_iteration_ids: [],
      requested_by_id: 'test-user-id',
      stats: {
        num_tasks_completed: 0,
        num_tasks_total: 0
      },
      story_links: [],
      workflow_state_id_history: []
    }
  }),
  isAxiosError: jest.fn().mockReturnValue(false)
}));

describe('Webhook Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should handle webhook event with no actions', async () => {
    const event: WebhookEvent = {
      id: 'test-event-id',
      changed_at: '2023-01-01T00:00:00Z',
      version: 'v1',
      primary_id: 123,
      actor_name: 'Test User',
      member_id: 'test-member-id',
      actions: []
    };

    const response = await request(app)
      .post('/')
      .send(event)
      .expect(200);

    expect(response.text).toBe('No actions to process');
  });

  test('should handle webhook event with no story ID', async () => {
    const event: WebhookEvent = {
      id: 'test-event-id',
      changed_at: '2023-01-01T00:00:00Z',
      version: 'v1',
      primary_id: 123,
      actor_name: 'Test User',
      member_id: 'test-member-id',
      actions: [
        {
          id: 456,
          entity_type: 'epic',
          action: 'create',
          name: 'Test Epic'
        }
      ]
    };

    const response = await request(app)
      .post('/')
      .send(event)
      .expect(200);

    expect(response.text).toBe('No story ID to process');
  });

  test('should handle valid webhook event', async () => {
    const event: WebhookEvent = {
      id: 'test-event-id',
      changed_at: '2023-01-01T00:00:00Z',
      version: 'v1',
      primary_id: 123,
      actor_name: 'Test User',
      member_id: 'test-member-id',
      actions: [
        {
          id: 123,
          entity_type: 'story',
          action: 'update',
          name: 'Test Story',
          changes: {
            workflow_state_id: {
              new: 500000017,
              old: 500000016
            }
          }
        }
      ]
    };

    const response = await request(app)
      .post('/')
      .send(event)
      .expect(200);

    expect(response.text).toBe('No action required');
  });

  test('should handle comment creation event', async () => {
    const event: WebhookEvent = {
      id: 'test-event-id',
      changed_at: '2023-01-01T00:00:00Z',
      version: 'v1',
      primary_id: 123,
      actor_name: 'Test User',
      member_id: 'test-member-id',
      actions: [
        {
          id: 456,
          entity_type: 'story-comment',
          action: 'create',
          text: 'This is a test comment',
          author_id: 'test-author-id',
          mention_ids: ['test-user-id']
        },
        {
          id: 123,
          entity_type: 'story',
          action: 'update',
          name: 'Test Story',
          app_url: 'https://app.shortcut.com/test/story/123'
        }
      ]
    };

    const response = await request(app)
      .post('/')
      .send(event)
      .expect(200);

    expect(response.text).toBe('No action required');
  });

  test('should handle malformed webhook event gracefully', async () => {
    const malformedEvent = {
      id: 'test-event-id',
      // Missing required fields
      actions: null
    };

    const response = await request(app)
      .post('/')
      .send(malformedEvent)
      .expect(200);

    expect(response.text).toBe('No actions to process');
  });

  test('should handle webhook event with undefined actions', async () => {
    const event = {
      id: 'test-event-id',
      changed_at: '2023-01-01T00:00:00Z',
      version: 'v1',
      primary_id: 123,
      actor_name: 'Test User',
      member_id: 'test-member-id'
      // actions is undefined
    };

    const response = await request(app)
      .post('/')
      .send(event)
      .expect(200);

    expect(response.text).toBe('No actions to process');
  });

  test('should handle health check endpoint', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('discord');
    expect(response.body).toHaveProperty('timestamp');
  });
}); 