import { ReviewService } from '../src/review';
import { ShortcutService } from '../src/shortcut';
import { DiscordService } from '../src/discord';
import { CommandInteraction, CacheType } from 'discord.js';
import { Logger, ShortcutStory, ShortcutIteration } from '../src/types';

// Mock the dependencies
jest.mock('../src/shortcut');
jest.mock('../src/discord');

describe('ReviewService', () => {
  let reviewService: ReviewService;
  let mockShortcutService: jest.Mocked<ShortcutService>;
  let mockDiscordService: jest.Mocked<DiscordService>;
  let mockLogger: jest.Mocked<Logger>;
  let mockInteraction: jest.Mocked<CommandInteraction<CacheType>>;

  const mockStoryData: ShortcutStory = {
    app_url: "https://app.shortcut.com/dewiz/story/2925",
    description: "",
    archived: false,
    started: true,
    story_links: [],
    labels: [],
    mention_ids: [],
    member_mention_ids: [],
    story_type: "feature",
    linked_files: [],
    workflow_id: 500000005,
    started_at: "2025-06-11T11:02:12Z",
    name: "test for shorty app",
    completed: false,
    comments: [
      {
        app_url: "https://app.shortcut.com/dewiz/story/2925/test-for-shorty-app#activity-2927",
        entity_type: "story-comment",
        deleted: false,
        story_id: 2925,
        mention_ids: [],
        author_id: "6380d4da-0ae7-4ca5-a7f4-59ba335b4460",
        member_mention_ids: [],
        linked_to_slack: false,
        updated_at: "2025-06-11T11:01:59Z",
        group_mention_ids: [],
        external_id: null,
        parent_id: null,
        id: 2927,
        position: 0,
        reactions: [],
        created_at: "2025-06-11T11:01:59Z",
        text: "https://github.com/makerdao/dss-exec-lib/pull/102"
      }
    ],
    previous_iteration_ids: [],
    requested_by_id: "6380d4da-0ae7-4ca5-a7f4-59ba335b4460",
    iteration_id: 2860,
    tasks: [
      {
        description: "Review",
        owner_ids: [
          "6380d4da-0ae7-4ca5-a7f4-59ba335b4460"
        ],
        id: 2926,
        complete: false
      }
    ],
    group_id: "618164b9-9faa-48b8-a42f-81f72f9b5cdc",
    workflow_state_id: 500000009,
    updated_at: "2025-06-12T10:00:16Z",
    follower_ids: [
      "6380d6b1-fb27-4965-bfa2-f08f2c948292",
      "6380d4da-0ae7-4ca5-a7f4-59ba335b4460"
    ],
    owner_ids: [
      "6380d6b1-fb27-4965-bfa2-f08f2c948292",
      "6380d4da-0ae7-4ca5-a7f4-59ba335b4460"
    ],
    id: 2925,
    position: 32173460480,
    deadline: null,
    stats: {
      num_tasks_completed: 0,
      num_tasks_total: 1
    },
    created_at: "2025-06-11T11:01:30Z",
    moved_at: "2025-06-12T10:00:16Z",
    workflow_state_id_history: []
  };

  const mockIteration: ShortcutIteration = {
    id: 2860,
    name: "2025/Q3 - Sprint 12",
    status: "started",
    start_date: "2025-06-10",
    end_date: "2025-06-24",
    created_at: "2025-06-10T00:00:00Z",
    updated_at: "2025-06-10T00:00:00Z",
    app_url: "https://app.shortcut.com/dewiz/iteration/2860",
    entity_type: "iteration",
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

  const testUserId = "6380d4da-0ae7-4ca5-a7f4-59ba335b4460";
  const testDiscordUserId = "1041280647655850064";

  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    // Create mock interaction
    mockInteraction = {
      deferReply: jest.fn().mockResolvedValue(undefined),
      editReply: jest.fn().mockResolvedValue(undefined),
      reply: jest.fn().mockResolvedValue(undefined),
      deferred: false
    } as any;

    // Create mock services
    mockShortcutService = new ShortcutService({} as any, mockLogger) as jest.Mocked<ShortcutService>;
    mockDiscordService = new DiscordService({} as any, mockLogger, {} as any) as jest.Mocked<DiscordService>;

    // Setup default mock implementations
    mockDiscordService.mapDiscordUserToShortcutUser.mockReturnValue(testUserId);
    mockShortcutService.getCurrentIteration.mockResolvedValue(mockIteration);
    mockShortcutService.getStoriesForIteration.mockResolvedValue([mockStoryData]);
    mockShortcutService.isRelevantStory.mockReturnValue(true);
    mockShortcutService.isStoryReadyForReview.mockReturnValue(true);
    mockShortcutService.getStory.mockResolvedValue(mockStoryData);
    mockShortcutService.getConfig.mockReturnValue({
      workflowIds: {
        productDevelopment: 500000005,
        operationalTasks: 500000183
      }
    } as any);

    // Create ReviewService instance
    reviewService = new ReviewService(mockShortcutService, mockDiscordService, mockLogger);
  });

  describe('handleReviewCommand', () => {
    it('should successfully find and return assigned stories', async () => {
      await reviewService.handleReviewCommand(mockInteraction, testDiscordUserId);

      expect(mockInteraction.deferReply).toHaveBeenCalled();
      expect(mockDiscordService.mapDiscordUserToShortcutUser).toHaveBeenCalledWith(testDiscordUserId);
      expect(mockShortcutService.getCurrentIteration).toHaveBeenCalled();
      expect(mockShortcutService.getStoriesForIteration).toHaveBeenCalledWith(2860);
      expect(mockShortcutService.getStory).toHaveBeenCalledWith(2925);
      expect(mockInteraction.editReply).toHaveBeenCalledWith(
        expect.stringContaining('**Your assigned stories in iteration: 2025/Q3 - Sprint 12**')
      );
      expect(mockInteraction.editReply).toHaveBeenCalledWith(
        expect.stringContaining('[test for shorty app](https://app.shortcut.com/dewiz/story/2925)')
      );
    });

    it('should handle user not found in mapping', async () => {
      mockDiscordService.mapDiscordUserToShortcutUser.mockReturnValue(null);

      await reviewService.handleReviewCommand(mockInteraction, testDiscordUserId);

      expect(mockInteraction.editReply).toHaveBeenCalledWith(
        'Sorry, I could not find your Shortcut account. Please make sure you are mapped in the system.'
      );
    });

    it('should handle no active iteration', async () => {
      mockShortcutService.getCurrentIteration.mockResolvedValue(null);

      await reviewService.handleReviewCommand(mockInteraction, testDiscordUserId);

      expect(mockInteraction.editReply).toHaveBeenCalledWith(
        'No active iteration found. Please check if there is a started iteration in Shortcut.'
      );
    });

    it('should handle no stories in iteration', async () => {
      mockShortcutService.getStoriesForIteration.mockResolvedValue([]);

      await reviewService.handleReviewCommand(mockInteraction, testDiscordUserId);

      expect(mockInteraction.editReply).toHaveBeenCalledWith(
        'No stories assigned to you in the current iteration: **2025/Q3 - Sprint 12**'
      );
    });

    it('should filter out irrelevant stories', async () => {
      const irrelevantStory = { ...mockStoryData, id: 9999, workflow_id: 999999999 };
      mockShortcutService.getStoriesForIteration.mockResolvedValue([mockStoryData, irrelevantStory]);
      mockShortcutService.isRelevantStory.mockImplementation((story) => story.workflow_id === 500000005);
      mockShortcutService.isStoryReadyForReview.mockImplementation((story) => story.id === 2925);

      await reviewService.handleReviewCommand(mockInteraction, testDiscordUserId);

      expect(mockShortcutService.getStory).toHaveBeenCalledTimes(1);
      expect(mockShortcutService.getStory).toHaveBeenCalledWith(2925);
      expect(mockShortcutService.getStory).not.toHaveBeenCalledWith(9999);
    });

    it('should handle stories with no tasks', async () => {
      const storyWithoutTasks = { ...mockStoryData, tasks: [] };
      mockShortcutService.getStory.mockResolvedValue(storyWithoutTasks);

      await reviewService.handleReviewCommand(mockInteraction, testDiscordUserId);

      expect(mockInteraction.editReply).toHaveBeenCalledWith(
        'No stories assigned to you in the current iteration: **2025/Q3 - Sprint 12**'
      );
    });

    it('should handle stories with tasks not assigned to user', async () => {
      const storyWithOtherUserTasks = {
        ...mockStoryData,
        tasks: [{
          ...mockStoryData.tasks![0],
          owner_ids: ["different-user-id"]
        }]
      };
      mockShortcutService.getStory.mockResolvedValue(storyWithOtherUserTasks);

      await reviewService.handleReviewCommand(mockInteraction, testDiscordUserId);

      expect(mockInteraction.editReply).toHaveBeenCalledWith(
        'No stories assigned to you in the current iteration: **2025/Q3 - Sprint 12**'
      );
    });

    it('should handle multiple assigned stories', async () => {
      const secondStory = {
        ...mockStoryData,
        id: 2926,
        name: "Another test story",
        app_url: "https://app.shortcut.com/dewiz/story/2926"
      };

      mockShortcutService.getStoriesForIteration.mockResolvedValue([mockStoryData, secondStory]);
      mockShortcutService.isStoryReadyForReview.mockReturnValue(true);
      mockShortcutService.getStory.mockImplementation((id) => {
        if (id === 2925) return Promise.resolve(mockStoryData);
        if (id === 2926) return Promise.resolve(secondStory);
        return Promise.reject(new Error('Story not found'));
      });

      await reviewService.handleReviewCommand(mockInteraction, testDiscordUserId);

      expect(mockInteraction.editReply).toHaveBeenCalledWith(
        expect.stringContaining('[test for shorty app](https://app.shortcut.com/dewiz/story/2925)')
      );
      expect(mockInteraction.editReply).toHaveBeenCalledWith(
        expect.stringContaining('[Another test story](https://app.shortcut.com/dewiz/story/2926)')
      );
    });

    it('should handle API errors gracefully', async () => {
      mockInteraction.deferred = true;
      mockShortcutService.getCurrentIteration.mockRejectedValue(new Error('API Error'));

      await reviewService.handleReviewCommand(mockInteraction, testDiscordUserId);

      expect(mockLogger.error).toHaveBeenCalledWith('Error processing review command:', expect.any(Error));
      expect(mockInteraction.editReply).toHaveBeenCalledWith(
        'Sorry, there was an error retrieving your assigned stories. Please try again later.'
      );
    });

    it('should handle interaction not deferred error case', async () => {
      mockInteraction.deferred = false;
      mockShortcutService.getCurrentIteration.mockRejectedValue(new Error('API Error'));

      await reviewService.handleReviewCommand(mockInteraction, testDiscordUserId);

      expect(mockInteraction.reply).toHaveBeenCalledWith(
        'Sorry, there was an error retrieving your assigned stories. Please try again later.'
      );
    });

    it('should log detailed information during processing', async () => {
      await reviewService.handleReviewCommand(mockInteraction, testDiscordUserId);

      expect(mockLogger.info).toHaveBeenCalledWith(`Processing review command for Discord user: ${testDiscordUserId}`);
      expect(mockLogger.info).toHaveBeenCalledWith('Found 1 stories in iteration 2860');
      expect(mockLogger.info).toHaveBeenCalledWith('Found 1 relevant stories (after workflow filtering)');
      expect(mockLogger.info).toHaveBeenCalledWith('Found 1 stories ready for review (after workflow state filtering)');
      expect(mockLogger.info).toHaveBeenCalledWith(`Found 1 stories assigned to user ${testUserId}`);
    });
  });

  describe('setDiscordService', () => {
    it('should set the discord service', () => {
      const newDiscordService = new DiscordService({} as any, mockLogger, {} as any);
      reviewService.setDiscordService(newDiscordService);
      
      // We can't directly test the private property, but we can test that it doesn't throw
      expect(() => reviewService.setDiscordService(newDiscordService)).not.toThrow();
    });
  });
}); 