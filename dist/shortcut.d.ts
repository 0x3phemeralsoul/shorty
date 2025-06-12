import { ShortcutStory, ShortcutIteration, SearchStoriesRequest, AppConfig, Logger } from './types';
export declare class ShortcutService {
    private config;
    private logger;
    private baseUrl;
    constructor(config: AppConfig, logger: Logger);
    /**
     * Gets the configuration for debugging purposes
     * @returns The app configuration
     */
    getConfig(): AppConfig;
    /**
     * Fetches a story from the Shortcut API
     * @param storyId - The ID of the story to fetch
     * @returns Promise that resolves to the story data
     * @throws Error if the API request fails
     */
    getStory(storyId: number): Promise<ShortcutStory>;
    /**
     * Fetches all iterations from the Shortcut API
     * @returns Promise that resolves to an array of iterations
     */
    getIterations(): Promise<ShortcutIteration[]>;
    /**
     * Finds the current "started" iteration
     * @returns Promise that resolves to the started iteration, or null if not found
     */
    getCurrentIteration(): Promise<ShortcutIteration | null>;
    /**
     * Searches for stories using the Shortcut API
     * @param searchParams - The search parameters
     * @returns Promise that resolves to an array of stories
     */
    searchStories(searchParams: SearchStoriesRequest): Promise<ShortcutStory[]>;
    /**
     * Gets stories for a specific iteration
     * @param iterationId - The iteration ID
     * @returns Promise that resolves to an array of stories
     */
    getStoriesForIteration(iterationId: number): Promise<ShortcutStory[]>;
    /**
     * Checks if a story belongs to the Product Development workflow
     * @param story - The story to check
     * @returns True if the story is in the Product Development workflow
     */
    isProductDevelopmentStory(story: ShortcutStory): boolean;
    /**
     * Checks if a story belongs to the Operational Tasks workflow
     * @param story - The story to check
     * @returns True if the story is in the Operational Tasks workflow
     */
    isOperationalTasksStory(story: ShortcutStory): boolean;
    /**
     * Checks if a story is in a relevant workflow (Product Development or Operational Tasks)
     * @param story - The story to check
     * @returns True if the story is in a relevant workflow
     */
    isRelevantStory(story: ShortcutStory): boolean;
    /**
     * Checks if a story is in a "Ready for Review" state
     * @param story - The story to check
     * @returns True if the story is ready for review
     */
    isStoryReadyForReview(story: ShortcutStory): boolean;
    /**
     * Determines which Discord channel should receive notifications for a story
     * @param story - The story to check
     * @returns The appropriate Discord channel ID, or null if no channel is configured
     */
    getDiscordChannelForStory(story: ShortcutStory): string | null;
    /**
     * Extracts task owner IDs from a story
     * @param story - The story to extract owners from
     * @returns Array of owner IDs
     */
    getTaskOwnerIds(story: ShortcutStory): string[];
    /**
     * Formats a story deadline for display
     * @param story - The story containing the deadline
     * @returns Formatted deadline string, or null if no deadline
     */
    formatDeadline(story: ShortcutStory): string | null;
    /**
     * Validates that a story has the required fields for processing
     * @param story - The story to validate
     * @returns True if the story is valid
     */
    validateStory(story: ShortcutStory): boolean;
}
//# sourceMappingURL=shortcut.d.ts.map