"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const config_1 = require("./config");
const logger_1 = require("./logger");
const discord_1 = require("./discord");
const shortcut_1 = require("./shortcut");
const review_1 = require("./review");
const pr_1 = require("./pr");
class ShortyBot {
    app;
    discordService;
    shortcutService;
    reviewService;
    constructor() {
        this.app = (0, express_1.default)();
        this.app.use(express_1.default.json());
        this.discordService = new discord_1.DiscordService(config_1.appConfig, logger_1.logger);
        this.shortcutService = new shortcut_1.ShortcutService(config_1.appConfig, logger_1.logger);
        this.reviewService = new review_1.ReviewService(this.shortcutService, this.discordService, logger_1.logger);
        this.setupRoutes();
        this.setupDiscordEventHandlers();
    }
    /**
     * Sets up Express routes
     */
    setupRoutes() {
        this.app.post('/', this.handleWebhook.bind(this));
        // Health check endpoint
        this.app.get('/health', (req, res) => {
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
    setupDiscordEventHandlers() {
        this.discordService.getClient().on('reviewCommand', async (interaction, discordUserId) => {
            await this.reviewService.handleReviewCommand(interaction, discordUserId);
        });
    }
    /**
     * Handles incoming webhook events from Shortcut
     */
    async handleWebhook(req, res) {
        try {
            const event = req.body;
            // Validate webhook event structure
            if (!this.validateWebhookEvent(event)) {
                logger_1.logger.warn('Received webhook event with no actions');
                res.status(200).send('No actions to process');
                return;
            }
            const storyId = this.extractStoryId(event.actions);
            if (storyId === null) {
                logger_1.logger.warn('No story ID found in webhook event');
                res.status(200).send('No story ID to process');
                return;
            }
            logger_1.logger.info(`Received webhook event for story ID: ${storyId}`);
            // Fetch story details from Shortcut API
            const story = await this.shortcutService.getStory(storyId);
            if (!this.shortcutService.validateStory(story)) {
                logger_1.logger.warn(`Invalid story data for story ${storyId}`);
                res.status(400).send('Invalid story data');
                return;
            }
            // Process the webhook event
            const processed = await this.processWebhookEvent(event, story);
            if (processed) {
                res.status(200).send('Event processed');
            }
            else {
                res.status(200).send('No action required');
            }
        }
        catch (error) {
            logger_1.logger.error('Error processing webhook event:', error);
            res.status(500).send('Internal Server Error');
        }
    }
    /**
     * Validates the structure of a webhook event
     */
    validateWebhookEvent(event) {
        return !!(event.actions && Array.isArray(event.actions) && event.actions.length > 0);
    }
    /**
     * Extracts story ID from webhook actions
     */
    extractStoryId(actions) {
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
    async processWebhookEvent(event, story) {
        // Check if this is a workflow state change to "Ready for Review"
        const isReadyForReview = this.isReadyForReviewStateChange(event, story);
        if (isReadyForReview) {
            return await this.handleReadyForReviewEvent(story);
        }
        // Check if this is a comment event
        const commentResult = this.processCommentEvent(event);
        if (commentResult.isCommentCreated && !(0, pr_1.isCommentWithPullRequest)(commentResult.commentText)) {
            return await this.handleCommentEvent(commentResult, story);
        }
        return false;
    }
    /**
     * Checks if the webhook event represents a state change to "Ready for Review"
     */
    isReadyForReviewStateChange(event, story) {
        const firstAction = event.actions[0];
        if (!firstAction?.changes?.workflow_state_id) {
            return false;
        }
        const newStateId = firstAction.changes.workflow_state_id.new;
        const { readyForReviewStateIds } = config_1.appConfig;
        return (newStateId === readyForReviewStateIds.productDevelopment ||
            newStateId === readyForReviewStateIds.operationalTasks);
    }
    /**
     * Handles a "Ready for Review" event
     */
    async handleReadyForReviewEvent(story) {
        const channelId = this.shortcutService.getDiscordChannelForStory(story);
        if (!channelId) {
            logger_1.logger.warn(`No Discord channel configured for story ${story.id} workflow ${story.workflow_id}`);
            return false;
        }
        const message = this.buildReadyForReviewMessage(story);
        try {
            await this.discordService.sendMessage(channelId, message);
            logger_1.logger.info(`Sent ready for review message for story ${story.id}`);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Failed to send ready for review message for story ${story.id}:`, error);
            throw error;
        }
    }
    /**
     * Builds a Discord message for a "Ready for Review" event
     */
    buildReadyForReviewMessage(story) {
        const taskOwnerIds = this.shortcutService.getTaskOwnerIds(story);
        const discordMentions = this.discordService.mapUsersToDiscordMentions(taskOwnerIds);
        const lastPrUrl = (0, pr_1.getLastPullRequestUrl)(story.comments);
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
    processCommentEvent(event) {
        let isCommentCreated = false;
        let commentText = '';
        let authorId = '';
        let mentionIds = [];
        let storyInfo = null;
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
    async handleCommentEvent(commentResult, story) {
        const channelId = this.shortcutService.getDiscordChannelForStory(story);
        if (!channelId) {
            logger_1.logger.warn(`No Discord channel configured for story ${story.id}`);
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
                logger_1.logger.info(`Sent comment notification for story ${story.id}`);
                return true;
            }
            catch (error) {
                logger_1.logger.error(`Failed to send comment notification for story ${story.id}:`, error);
                throw error;
            }
        }
        return false;
    }
    /**
     * Starts the bot application
     */
    async start() {
        try {
            // Initialize Discord connection
            await this.discordService.loginWithRetry();
            logger_1.logger.info('ShortyBot started successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to start ShortyBot:', error);
            throw error;
        }
    }
    /**
     * Gracefully shuts down the bot
     */
    async shutdown() {
        logger_1.logger.info('Shutting down ShortyBot...');
        await this.discordService.shutdown();
    }
    /**
     * Gets the Express application instance
     */
    getApp() {
        return this.app;
    }
}
// Create and export the bot instance
const bot = new ShortyBot();
// Export the Express app for testing
exports.default = bot.getApp();
// Only start the server if this file is run directly (not imported for testing)
if (require.main === module) {
    const PORT = parseInt(config_1.appConfig.env.PORT || '3000', 10);
    bot.getApp().listen(PORT, () => {
        logger_1.logger.info(`Server is listening on port ${PORT}`);
    });
    // Start the bot
    bot.start().catch((error) => {
        logger_1.logger.error('Failed to start bot:', error);
        process.exit(1);
    });
    // Graceful shutdown handling
    process.on('SIGINT', async () => {
        logger_1.logger.info('Received SIGINT, shutting down gracefully...');
        await bot.shutdown();
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        logger_1.logger.info('Received SIGTERM, shutting down gracefully...');
        await bot.shutdown();
        process.exit(0);
    });
}
//# sourceMappingURL=bot.js.map