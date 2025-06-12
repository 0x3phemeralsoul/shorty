"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShortcutService = void 0;
const axios_1 = __importDefault(require("axios"));
class ShortcutService {
    config;
    logger;
    baseUrl = 'https://api.app.shortcut.com/api/v3';
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
    }
    /**
     * Gets the configuration for debugging purposes
     * @returns The app configuration
     */
    getConfig() {
        return this.config;
    }
    /**
     * Fetches a story from the Shortcut API
     * @param storyId - The ID of the story to fetch
     * @returns Promise that resolves to the story data
     * @throws Error if the API request fails
     */
    async getStory(storyId) {
        try {
            this.logger.debug(`Fetching story ${storyId} from Shortcut API`);
            const response = await axios_1.default.get(`${this.baseUrl}/stories/${storyId}`, {
                headers: {
                    'Shortcut-Token': this.config.env.SHORTCUT_API_TOKEN,
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // 10 second timeout
            });
            this.logger.debug(`Successfully fetched story ${storyId}`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to fetch story ${storyId} from Shortcut API:`, error);
            if (axios_1.default.isAxiosError(error)) {
                if (error.response) {
                    throw new Error(`Shortcut API error: ${error.response.status} - ${error.response.statusText}`);
                }
                else if (error.request) {
                    throw new Error('Shortcut API request failed: No response received');
                }
                else {
                    throw new Error(`Shortcut API request setup error: ${error.message}`);
                }
            }
            throw new Error(`Unknown error fetching story: ${error}`);
        }
    }
    /**
     * Fetches all iterations from the Shortcut API
     * @returns Promise that resolves to an array of iterations
     */
    async getIterations() {
        try {
            this.logger.debug('Fetching iterations from Shortcut API');
            const response = await axios_1.default.get(`${this.baseUrl}/iterations`, {
                headers: {
                    'Shortcut-Token': this.config.env.SHORTCUT_API_TOKEN,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            this.logger.debug(`Successfully fetched ${response.data.length} iterations`);
            return response.data;
        }
        catch (error) {
            this.logger.error('Failed to fetch iterations from Shortcut API:', error);
            if (axios_1.default.isAxiosError(error)) {
                if (error.response) {
                    throw new Error(`Shortcut API error: ${error.response.status} - ${error.response.statusText}`);
                }
                else if (error.request) {
                    throw new Error('Shortcut API request failed: No response received');
                }
                else {
                    throw new Error(`Shortcut API request setup error: ${error.message}`);
                }
            }
            throw new Error(`Unknown error fetching iterations: ${error}`);
        }
    }
    /**
     * Finds the current "started" iteration
     * @returns Promise that resolves to the started iteration, or null if not found
     */
    async getCurrentIteration() {
        try {
            const iterations = await this.getIterations();
            // Sort iterations by created_at in descending order (newest first)
            const sortedIterations = iterations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            // Look for the first iteration with status "started"
            const startedIteration = sortedIterations.find(iteration => iteration.status === 'started');
            if (startedIteration) {
                this.logger.debug(`Found started iteration: ${startedIteration.name} (ID: ${startedIteration.id})`);
                return startedIteration;
            }
            this.logger.warn('No started iteration found');
            return null;
        }
        catch (error) {
            this.logger.error('Failed to get current iteration:', error);
            throw error;
        }
    }
    /**
     * Searches for stories using the Shortcut API
     * @param searchParams - The search parameters
     * @returns Promise that resolves to an array of stories
     */
    async searchStories(searchParams) {
        try {
            this.logger.debug('Searching stories with params:', searchParams);
            const response = await axios_1.default.post(`${this.baseUrl}/stories/search`, searchParams, {
                headers: {
                    'Shortcut-Token': this.config.env.SHORTCUT_API_TOKEN,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            this.logger.debug(`Found ${response.data.length} stories`);
            return response.data;
        }
        catch (error) {
            this.logger.error('Failed to search stories:', error);
            if (axios_1.default.isAxiosError(error)) {
                if (error.response) {
                    throw new Error(`Shortcut API error: ${error.response.status} - ${error.response.statusText}`);
                }
                else if (error.request) {
                    throw new Error('Shortcut API request failed: No response received');
                }
                else {
                    throw new Error(`Shortcut API request setup error: ${error.message}`);
                }
            }
            throw new Error(`Unknown error searching stories: ${error}`);
        }
    }
    /**
     * Gets stories for a specific iteration
     * @param iterationId - The iteration ID
     * @returns Promise that resolves to an array of stories
     */
    async getStoriesForIteration(iterationId) {
        return this.searchStories({
            iteration_id: iterationId,
            archived: false
        });
    }
    /**
     * Checks if a story belongs to the Product Development workflow
     * @param story - The story to check
     * @returns True if the story is in the Product Development workflow
     */
    isProductDevelopmentStory(story) {
        return story.workflow_id === this.config.workflowIds.productDevelopment;
    }
    /**
     * Checks if a story belongs to the Operational Tasks workflow
     * @param story - The story to check
     * @returns True if the story is in the Operational Tasks workflow
     */
    isOperationalTasksStory(story) {
        return story.workflow_id === this.config.workflowIds.operationalTasks;
    }
    /**
     * Checks if a story is in a relevant workflow (Product Development or Operational Tasks)
     * @param story - The story to check
     * @returns True if the story is in a relevant workflow
     */
    isRelevantStory(story) {
        return this.isProductDevelopmentStory(story) || this.isOperationalTasksStory(story);
    }
    /**
     * Checks if a story is in a "Ready for Review" state
     * @param story - The story to check
     * @returns True if the story is ready for review
     */
    isStoryReadyForReview(story) {
        const { readyForReviewStateIds } = this.config;
        return (story.workflow_state_id === readyForReviewStateIds.productDevelopment ||
            story.workflow_state_id === readyForReviewStateIds.operationalTasks);
    }
    /**
     * Determines which Discord channel should receive notifications for a story
     * @param story - The story to check
     * @returns The appropriate Discord channel ID, or null if no channel is configured
     */
    getDiscordChannelForStory(story) {
        if (this.isProductDevelopmentStory(story)) {
            return this.config.discordChannels.dev;
        }
        if (this.isOperationalTasksStory(story)) {
            return this.config.discordChannels.core;
        }
        return null;
    }
    /**
     * Extracts task owner IDs from a story
     * @param story - The story to extract owners from
     * @returns Array of owner IDs
     */
    getTaskOwnerIds(story) {
        if (!story.tasks || !Array.isArray(story.tasks)) {
            return [];
        }
        return story.tasks
            .map(task => task.owner_ids[0])
            .filter((ownerId) => ownerId !== undefined);
    }
    /**
     * Formats a story deadline for display
     * @param story - The story containing the deadline
     * @returns Formatted deadline string, or null if no deadline
     */
    formatDeadline(story) {
        if (!story.deadline) {
            return null;
        }
        try {
            return story.deadline.split('T')[0] || null;
        }
        catch (error) {
            this.logger.warn(`Failed to format deadline for story ${story.id}:`, error);
            return null;
        }
    }
    /**
     * Validates that a story has the required fields for processing
     * @param story - The story to validate
     * @returns True if the story is valid
     */
    validateStory(story) {
        const requiredFields = ['id', 'name', 'app_url', 'workflow_id', 'workflow_state_id'];
        for (const field of requiredFields) {
            if (!(field in story) || story[field] === undefined) {
                this.logger.warn(`Story ${story.id || 'unknown'} is missing required field: ${field}`);
                return false;
            }
        }
        return true;
    }
}
exports.ShortcutService = ShortcutService;
//# sourceMappingURL=shortcut.js.map