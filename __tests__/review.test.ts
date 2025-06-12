import { ReviewService } from '../src/review';
import { ShortcutService } from '../src/shortcut';
import { DiscordService } from '../src/discord';
import { logger } from '../src/logger';
import { appConfig } from '../src/config';
import { ShortcutIteration, ShortcutStory } from '../src/types';

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
    user: { tag: 'TestBot#1234', id: 'test-bot-id' },
    destroy: jest.fn(),
    emit: jest.fn()
  })),
  GatewayIntentBits: {
    Guilds: 1,
    GuildMessages: 2
  },
  SlashCommandBuilder: jest.fn().mockImplementation(() => ({
    setName: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    addUserOption: jest.fn().mockReturnThis()
  })),
  REST: jest.fn().mockImplementation(() => ({
    setToken: jest.fn().mockReturnThis(),
    put: jest.fn().mockResolvedValue(undefined)
  })),
  Routes: {
    applicationCommands: jest.fn().mockReturnValue('test-route')
  }
}));

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  isAxiosError: jest.fn().mockReturnValue(false)
}));

describe('ReviewService', () => {
  let reviewService: ReviewService;
  let shortcutService: ShortcutService;
  let discordService: DiscordService;
  let mockInteraction: any;

  beforeEach(() => {
    shortcutService = new ShortcutService(appConfig, logger);
    discordService = new DiscordService(appConfig, logger);
    reviewService = new ReviewService(shortcutService, discordService, logger);

    mockInteraction = {
      deferred: true,
      editReply: jest.fn().mockResolvedValue(undefined),
      reply: jest.fn().mockResolvedValue(undefined)
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleReviewCommand', () => {
    test('should handle user not found in mapping', async () => {
      const discordUserId = 'unknown-user-id';
      
      jest.spyOn(discordService, 'mapDiscordUserToShortcutUser').mockReturnValue(null);
      jest.spyOn(discordService, 'replyToInteraction').mockResolvedValue(undefined);

      await reviewService.handleReviewCommand(mockInteraction, discordUserId);

      expect(discordService.replyToInteraction).toHaveBeenCalledWith(
        mockInteraction,
        'Sorry, I could not find your Shortcut account. Please make sure you are mapped in the system.'
      );
    });

    test('should handle no active iteration', async () => {
      const discordUserId = '1041280647655850064'; // 3phy's Discord ID
      const shortcutUserId = '6380d4da-0ae7-4ca5-a7f4-59ba335b4460'; // 3phy's Shortcut ID
      
      jest.spyOn(discordService, 'mapDiscordUserToShortcutUser').mockReturnValue(shortcutUserId);
      jest.spyOn(shortcutService, 'getCurrentIteration').mockResolvedValue(null);
      jest.spyOn(discordService, 'replyToInteraction').mockResolvedValue(undefined);

      await reviewService.handleReviewCommand(mockInteraction, discordUserId);

      expect(discordService.replyToInteraction).toHaveBeenCalledWith(
        mockInteraction,
        'No active iteration found. Please check if there is a started iteration in Shortcut.'
      );
    });

    test('should handle successful review with stories', async () => {
      const discordUserId = '1041280647655850064'; // 3phy's Discord ID
      const shortcutUserId = '6380d4da-0ae7-4ca5-a7f4-59ba335b4460'; // 3phy's Shortcut ID
      
      const mockIteration: ShortcutIteration = {
        id: 1,
        name: 'Sprint 1',
        status: 'started',
        start_date: '2023-01-01',
        end_date: '2023-01-14',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        app_url: 'https://app.shortcut.com/test/iteration/1',
        entity_type: 'iteration',
        follower_ids: [],
        group_mention_ids: [],
        label_ids: [],
        member_mention_ids: [],
        mention_ids: [],
        stats: {
          num_points: 10,
          num_points_done: 0,
          num_points_started: 5,
          num_points_unstarted: 5,
          num_stories: 2,
          num_stories_done: 0,
          num_stories_started: 1,
          num_stories_unstarted: 1
        }
      };

      const mockStories: ShortcutStory[] = [
        {
          id: 123,
          name: 'Test Story 1',
          app_url: 'https://app.shortcut.com/test/story/123',
          workflow_id: 500000016, // Product Development workflow
          workflow_state_id: 500000017,
          deadline: null,
          tasks: [
            {
              owner_ids: [shortcutUserId],
              id: 1,
              description: 'Test task',
              complete: false
            }
          ],
          comments: [],
          owner_ids: [],
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
            num_tasks_total: 1
          },
          story_links: [],
          workflow_state_id_history: []
        }
      ];
      
      jest.spyOn(discordService, 'mapDiscordUserToShortcutUser').mockReturnValue(shortcutUserId);
      jest.spyOn(shortcutService, 'getCurrentIteration').mockResolvedValue(mockIteration);
      jest.spyOn(shortcutService, 'getStoriesForIteration').mockResolvedValue(mockStories);
      jest.spyOn(shortcutService, 'isRelevantStory').mockReturnValue(true);
      jest.spyOn(shortcutService, 'getTaskOwnerIds').mockReturnValue([shortcutUserId]);
      jest.spyOn(discordService, 'replyToInteraction').mockResolvedValue(undefined);

      await reviewService.handleReviewCommand(mockInteraction, discordUserId);

      expect(discordService.replyToInteraction).toHaveBeenCalledWith(
        mockInteraction,
        '**Your assigned stories in iteration: Sprint 1**\n\n[Test Story 1](https://app.shortcut.com/test/story/123)'
      );
    });

    test('should handle no assigned stories', async () => {
      const discordUserId = '1041280647655850064'; // 3phy's Discord ID
      const shortcutUserId = '6380d4da-0ae7-4ca5-a7f4-59ba335b4460'; // 3phy's Shortcut ID
      
      const mockIteration: ShortcutIteration = {
        id: 1,
        name: 'Sprint 1',
        status: 'started',
        start_date: '2023-01-01',
        end_date: '2023-01-14',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        app_url: 'https://app.shortcut.com/test/iteration/1',
        entity_type: 'iteration',
        follower_ids: [],
        group_mention_ids: [],
        label_ids: [],
        member_mention_ids: [],
        mention_ids: [],
        stats: {
          num_points: 0,
          num_points_done: 0,
          num_points_started: 0,
          num_points_unstarted: 0,
          num_stories: 0,
          num_stories_done: 0,
          num_stories_started: 0,
          num_stories_unstarted: 0
        }
      };
      
      jest.spyOn(discordService, 'mapDiscordUserToShortcutUser').mockReturnValue(shortcutUserId);
      jest.spyOn(shortcutService, 'getCurrentIteration').mockResolvedValue(mockIteration);
      jest.spyOn(shortcutService, 'getStoriesForIteration').mockResolvedValue([]);
      jest.spyOn(discordService, 'replyToInteraction').mockResolvedValue(undefined);

      await reviewService.handleReviewCommand(mockInteraction, discordUserId);

      expect(discordService.replyToInteraction).toHaveBeenCalledWith(
        mockInteraction,
        'No stories assigned to you in the current iteration: **Sprint 1**'
      );
    });
  });
}); 