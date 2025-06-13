import express, { Request, Response, Application } from 'express';
import { WebhookEvent, WebhookAction, CommentProcessingResult, ShortcutStory } from './types';
import { appConfig } from './config';
import { logger } from './logger';
import { DiscordService } from './discord';
import { ShortcutService } from './shortcut';
import { ReviewService } from './review';
import { 
  extractGitHubPullRequestUrls, 
  getComments, 
  isCommentWithPullRequest, 
  getLastPullRequestUrl 
} from './pr';
import { CommandInteraction, CacheType } from 'discord.js';

class ShortyBot {
  private app: Application;
  private discordService: DiscordService;
  private shortcutService: ShortcutService;
  private reviewService: ReviewService;

  constructor() {
    this.app = express();
    this.app.use(express.json());
    
    this.shortcutService = new ShortcutService(appConfig, logger);
    this.reviewService = new ReviewService(this.shortcutService, null, logger);
    this.discordService = new DiscordService(appConfig, logger, this.reviewService);
    
    // Update the reviewService with the discordService reference
    this.reviewService.setDiscordService(this.discordService);
    
    this.setupRoutes();
    this.setupDiscordEventHandlers();
  }

  /**
   * Sets up Express routes
   */
  private setupRoutes(): void {
    this.app.post('/', this.handleWebhook.bind(this));
    
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({ 
        status: 'ok', 
        discord: this.discordService.isClientReady(),
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Sets up Discord event handlers for slash commands
   */
  private setupDiscordEventHandlers(): void {
    this.discordService.getClient().on('reviewCommand', async (interaction: CommandInteraction<CacheType>, discordUserId: string) => {
      await this.reviewService.handleReviewCommand(interaction, discordUserId);
    });
  }

  /**
   * Handles incoming webhook events from Shortcut
   */
  private async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const event: WebhookEvent = req.body;
      
      // Validate webhook event structure
      if (!this.validateWebhookEvent(event)) {
        logger.warn('Received webhook event with no actions');
        res.status(200).send('No actions to process');
        return;
      }
      
      const storyId = this.extractStoryId(event.actions);
      
      if (storyId === null) {
        logger.warn('No story ID found in webhook event');
        res.status(200).send('No story ID to process');
        return;
      }
      
      logger.info(`Received webhook event for story ID: ${storyId}`);
      
      // Fetch story details from Shortcut API
      const story = await this.shortcutService.getStory(storyId);
      
      if (!this.shortcutService.validateStory(story)) {
        logger.warn(`Invalid story data for story ${storyId}`);
        res.status(400).send('Invalid story data');
        return;
      }
      
      // Process the webhook event
      const processed = await this.processWebhookEvent(event, story);
      
      if (processed) {
        res.status(200).send('Event processed');
      } else {
        res.status(200).send('No action required');
      }
      
    } catch (error) {
      logger.error('Error processing webhook event:', error);
      res.status(500).send('Internal Server Error');
    }
  }

  /**
   * Validates the structure of a webhook event
   */
  private validateWebhookEvent(event: WebhookEvent): boolean {
    return !!(event.actions && Array.isArray(event.actions) && event.actions.length > 0);
  }

  /**
   * Extracts story ID from webhook actions
   */
  private extractStoryId(actions: WebhookAction[]): number | null {
    for (const action of actions) {
      if (action.entity_type === 'story' && action.action === 'update') {
        return action.id;
      }
    }
    return null;
  }

  /**
   * Processes a webhook event and determines what action to take
   */
  private async processWebhookEvent(event: WebhookEvent, story: ShortcutStory): Promise<boolean> {
    // Check if this is a workflow state change to "Ready for Review"
    const isReadyForReview = this.isReadyForReviewStateChange(event, story);
    
    if (isReadyForReview) {
      return await this.handleReadyForReviewEvent(story);
    }
    
    // Check if this is a comment event
    const commentResult = this.processCommentEvent(event);
    
    if (commentResult.isCommentCreated && !isCommentWithPullRequest(commentResult.commentText)) {
      return await this.handleCommentEvent(commentResult, story);
    }
    
    return false;
  }

  /**
   * Checks if the webhook event represents a state change to "Ready for Review"
   */
  private isReadyForReviewStateChange(event: WebhookEvent, story: ShortcutStory): boolean {
    const firstAction = event.actions[0];
    
    if (!firstAction?.changes?.workflow_state_id) {
      return false;
    }
    
    const newStateId = firstAction.changes.workflow_state_id.new;
    const { readyForReviewStateIds } = appConfig;
    
    return (
      newStateId === readyForReviewStateIds.productDevelopment ||
      newStateId === readyForReviewStateIds.operationalTasks
    );
  }

  /**
   * Handles a "Ready for Review" event
   */
  private async handleReadyForReviewEvent(story: ShortcutStory): Promise<boolean> {
    const channelId = this.shortcutService.getDiscordChannelForStory(story);
    
    if (!channelId) {
      logger.warn(`No Discord channel configured for story ${story.id} workflow ${story.workflow_id}`);
      return false;
    }
    
    const message = this.buildReadyForReviewMessage(story);
    
    try {
      await this.discordService.sendMessage(channelId, message);
      logger.info(`Sent ready for review message for story ${story.id}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send ready for review message for story ${story.id}:`, error);
      throw error;
    }
  }

  /**
   * Builds a Discord message for a "Ready for Review" event
   */
  private buildReadyForReviewMessage(story: ShortcutStory): string {
    const taskOwnerIds = this.shortcutService.getTaskOwnerIds(story);
    const discordMentions = this.discordService.mapUsersToDiscordMentions(taskOwnerIds);
    const lastPrUrl = getLastPullRequestUrl(story.comments);
    const deadline = this.shortcutService.formatDeadline(story);
    
    let message = `[${story.name}](${story.app_url}) is ready for review`;
    
    if (discordMentions.length > 0) {
      message += ` by ${discordMentions.join(', ')}`;
    }
    
    if (lastPrUrl) {
      message += ` Link to [PR](<${lastPrUrl}>)`;
    }
    
    if (deadline) {
      message += ` :bangbang:**Story Due Date** is ${deadline} :bangbang: so the review should be in sooner than that! :exploding_head:`;
    }
    
    return message;
  }

  /**
   * Processes comment-related events from the webhook
   */
  private processCommentEvent(event: WebhookEvent): CommentProcessingResult {
    let isCommentCreated = false;
    let commentText = '';
    let authorId = '';
    let mentionIds: string[] = [];
    let storyInfo: { id: number; name: string; url: string } | null = null;
    
    for (const action of event.actions) {
      if (action.action === 'create' && action.entity_type === 'story-comment') {
        isCommentCreated = true;
        commentText = action.text || '';
        authorId = action.author_id || '';
        mentionIds = action.mention_ids || [];
      }
      
      if (action.action === 'update' && action.entity_type === 'story') {
        storyInfo = {
          id: action.id,
          name: action.name || '',
          url: action.app_url || ''
        };
      }
    }
    
    return {
      isCommentCreated,
      commentText,
      authorId,
      mentionIds,
      storyInfo
    };
  }

  /**
   * Handles comment events
   */
  private async handleCommentEvent(
    commentResult: CommentProcessingResult, 
    story: ShortcutStory
  ): Promise<boolean> {
    const channelId = this.shortcutService.getDiscordChannelForStory(story);
    
    if (!channelId) {
      logger.warn(`No Discord channel configured for story ${story.id}`);
      return false;
    }
    
    let message = '';
    let shouldSend = false;
    
    // If there are mentioned users in the comment, mention them
    if (commentResult.commentText && commentResult.mentionIds.length > 0) {
      const discordMentions = this.discordService.mapUsersToDiscordMentions(commentResult.mentionIds);
      if (discordMentions.length > 0) {
        message = `${discordMentions.join(', ')} New comment on [${story.name}](${story.app_url})`;
        shouldSend = true;
      }
    }
    // If no mentioned users but there's a comment, mention story owners (if author is not an owner)
    else if (commentResult.commentText && commentResult.isCommentCreated) {
      const storyOwners = story.owner_ids;
      const discordMentions = this.discordService.mapUsersToDiscordMentions(storyOwners);
      
      // Only send if the comment author is not one of the story owners
      if (!storyOwners.includes(commentResult.authorId) && discordMentions.length > 0) {
        message = `${discordMentions.join(', ')} New comment on [${story.name}](${story.app_url})`;
        shouldSend = true;
      }
    }
    
    if (shouldSend && message) {
      try {
        await this.discordService.sendMessage(channelId, message);
        logger.info(`Sent comment notification for story ${story.id}`);
        return true;
      } catch (error) {
        logger.error(`Failed to send comment notification for story ${story.id}:`, error);
        throw error;
      }
    }
    
    return false;
  }

  /**
   * Starts the bot application
   */
  async start(): Promise<void> {
    try {
      // Initialize Discord connection
      await this.discordService.loginWithRetry();
      
      logger.info('ShortyBot started successfully');
    } catch (error) {
      logger.error('Failed to start ShortyBot:', error);
      throw error;
    }
  }

  /**
   * Gracefully shuts down the bot
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down ShortyBot...');
    await this.discordService.shutdown();
  }

  /**
   * Gets the Express application instance
   */
  getApp(): Application {
    return this.app;
  }
}

// Create and export the bot instance
const bot = new ShortyBot();

// Export the Express app for testing
export default bot.getApp();

// Only start the server if this file is run directly (not imported for testing)
if (require.main === module) {
  const PORT = parseInt(appConfig.env.PORT || '3000', 10);
  
  bot.getApp().listen(PORT, () => {
    logger.info(`Server is listening on port ${PORT}`);
  });
  
  // Start the bot
  bot.start().catch((error) => {
    logger.error('Failed to start bot:', error);
    process.exit(1);
  });
  
  // Graceful shutdown handling
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    await bot.shutdown();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    await bot.shutdown();
    process.exit(0);
  });
} 