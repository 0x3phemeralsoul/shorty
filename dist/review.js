"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewService = void 0;
class ReviewService {
    shortcutService;
    discordService;
    logger;
    constructor(shortcutService, discordService, logger) {
        this.shortcutService = shortcutService;
        this.discordService = discordService;
        this.logger = logger;
    }
    /**
     * Sets the Discord service after construction
     * @param discordService - The Discord service to set
     */
    setDiscordService(discordService) {
        this.discordService = discordService;
    }
    /**
     * Handles the review command for a Discord user
     * @param interaction - The Discord command interaction
     * @param discordUserId - The Discord user ID to get stories for
     */
    async handleReviewCommand(interaction, discordUserId) {
        try {
            this.logger.info(`Processing review command for Discord user: ${discordUserId}`);
            // Acknowledge the interaction immediately to prevent timeout
            await interaction.deferReply();
            // Step 1: Map Discord user ID to Shortcut user ID
            const shortcutUserId = this.discordService?.mapDiscordUserToShortcutUser(discordUserId);
            if (!shortcutUserId) {
                await interaction.editReply('Sorry, I could not find your Shortcut account. Please make sure you are mapped in the system.');
                return;
            }
            this.logger.debug(`Mapped Discord user ${discordUserId} to Shortcut user ${shortcutUserId}`);
            // Step 2: Get the current "started" iteration
            const currentIteration = await this.shortcutService.getCurrentIteration();
            if (!currentIteration) {
                await interaction.editReply('No active iteration found. Please check if there is a started iteration in Shortcut.');
                return;
            }
            this.logger.debug(`Found current iteration: ${currentIteration.name} (ID: ${currentIteration.id})`);
            // Debug: Log workflow configuration
            this.logger.info(`Workflow configuration - Product Development: ${this.shortcutService.getConfig().workflowIds.productDevelopment}, Operational Tasks: ${this.shortcutService.getConfig().workflowIds.operationalTasks}`);
            // Step 3: Get all stories for the current iteration
            const iterationStories = await this.shortcutService.getStoriesForIteration(currentIteration.id);
            this.logger.info(`Found ${iterationStories.length} stories in iteration ${currentIteration.id}`);
            // Special check for story 2925
            const targetStory = iterationStories.find(story => story.id === 2925);
            if (targetStory) {
                this.logger.info(`🎯 FOUND TARGET STORY 2925: Name="${targetStory.name}", WorkflowID=${targetStory.workflow_id}, OwnerIDs=${JSON.stringify(targetStory.owner_ids)}, Tasks=${targetStory.tasks ? targetStory.tasks.length : 'undefined'}`);
                if (targetStory.tasks && targetStory.tasks.length > 0) {
                    targetStory.tasks.forEach((task, taskIndex) => {
                        this.logger.info(`🎯   Task ${taskIndex + 1}: "${task.description}", OwnerIDs=${JSON.stringify(task.owner_ids)}`);
                    });
                }
            }
            else {
                this.logger.info(`❌ TARGET STORY 2925 NOT FOUND in iteration stories`);
            }
            // Step 4: Filter for relevant stories (Product Development or Operational Tasks workflows)
            const relevantStories = iterationStories.filter(story => this.shortcutService.isRelevantStory(story));
            this.logger.info(`Found ${relevantStories.length} relevant stories (after workflow filtering)`);
            // Debug: Log which stories were filtered out
            const filteredOutStories = iterationStories.filter(story => !this.shortcutService.isRelevantStory(story));
            if (filteredOutStories.length > 0) {
                this.logger.info(`Filtered out ${filteredOutStories.length} stories with workflow IDs: ${filteredOutStories.map(s => s.workflow_id).join(', ')}`);
            }
            // Step 5: Get full story details for relevant stories and check tasks
            const userStories = [];
            for (const story of relevantStories) {
                this.logger.info(`Fetching full details for story "${story.name}" (ID: ${story.id})`);
                const fullStory = await this.shortcutService.getStory(story.id);
                this.logger.info(`Story "${fullStory.name}" (ID: ${fullStory.id}) - Tasks: ${fullStory.tasks ? fullStory.tasks.length : 'undefined'}`);
                if (fullStory.tasks && fullStory.tasks.length > 0) {
                    fullStory.tasks.forEach((task, taskIndex) => {
                        this.logger.info(`  Task ${taskIndex + 1}: "${task.description}", OwnerIDs=${JSON.stringify(task.owner_ids)}`);
                    });
                    // Check if any task is assigned to the user
                    const hasUserTask = fullStory.tasks.some(task => task.owner_ids && task.owner_ids.includes(shortcutUserId));
                    if (hasUserTask) {
                        this.logger.info(`✓ Found match for user ${shortcutUserId} in story "${fullStory.name}"`);
                        userStories.push({
                            name: fullStory.name,
                            app_url: fullStory.app_url
                        });
                    }
                    else {
                        this.logger.info(`✗ No match for user ${shortcutUserId} in story "${fullStory.name}"`);
                    }
                }
                else {
                    this.logger.info(`✗ No tasks found in story "${fullStory.name}"`);
                }
            }
            this.logger.info(`Found ${userStories.length} stories assigned to user ${shortcutUserId}`);
            // Step 6: Format and send the response
            await this.sendReviewResponse(interaction, userStories, currentIteration.name);
        }
        catch (error) {
            this.logger.error('Error processing review command:', error);
            if (interaction.deferred) {
                await interaction.editReply('Sorry, there was an error retrieving your assigned stories. Please try again later.');
            }
            else {
                await interaction.reply('Sorry, there was an error retrieving your assigned stories. Please try again later.');
            }
        }
    }
    /**
     * Formats and sends the review response to Discord
     * @param interaction - The Discord command interaction
     * @param userStories - Array of stories assigned to the user
     * @param iterationName - Name of the current iteration
     */
    async sendReviewResponse(interaction, userStories, iterationName) {
        if (userStories.length === 0) {
            await interaction.editReply(`No stories assigned to you in the current iteration: **${iterationName}**`);
            return;
        }
        // Format the stories as markdown links
        const storyLinks = userStories.map(story => `[${story.name}](${story.app_url})`).join('\n');
        const message = `**Your assigned stories in iteration: ${iterationName}**\n\n${storyLinks}`;
        await interaction.editReply(message);
    }
}
exports.ReviewService = ReviewService;
//# sourceMappingURL=review.js.map