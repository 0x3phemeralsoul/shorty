import { Client, CommandInteraction, CacheType } from 'discord.js';
import { AppConfig, Logger } from './types';
import { ReviewService } from './review';
export declare class DiscordService {
    private client;
    private config;
    private logger;
    private reviewService;
    private isReady;
    constructor(config: AppConfig, logger: Logger, reviewService: ReviewService);
    /**
     * Sets up Discord client event handlers
     */
    private setupEventHandlers;
    /**
     * Registers slash commands with Discord
     */
    private registerSlashCommands;
    /**
     * Handles slash command interactions
     */
    private handleSlashCommand;
    /**
     * Handles the /review command
     */
    private handleReviewCommand;
    /**
     * Logs in to Discord with retry mechanism
     * @param retries - Current retry count
     * @returns Promise that resolves when login is successful
     */
    loginWithRetry(retries?: number): Promise<void>;
    /**
     * Sends a message to a Discord channel
     * @param channelId - The Discord channel ID
     * @param message - The message to send
     * @returns Promise that resolves when message is sent
     */
    sendMessage(channelId: string, message: string): Promise<void>;
    /**
     * Sends a message to the development Discord channel
     * @param message - The message to send
     * @returns Promise that resolves when message is sent
     */
    sendToDevChannel(message: string): Promise<void>;
    /**
     * Sends a message to the core Discord channel
     * @param message - The message to send
     * @returns Promise that resolves when message is sent
     */
    sendToCoreChannel(message: string): Promise<void>;
    /**
     * Maps Shortcut user IDs to Discord mentions
     * @param userIds - Array of Shortcut user IDs
     * @returns Array of Discord mention strings
     */
    mapUsersToDiscordMentions(userIds: string[]): string[];
    /**
     * Maps a Discord user ID to a Shortcut user ID
     * @param discordUserId - The Discord user ID
     * @returns The corresponding Shortcut user ID, or null if not found
     */
    mapDiscordUserToShortcutUser(discordUserId: string): string | null;
    /**
     * Replies to a slash command interaction
     * @param interaction - The command interaction
     * @param message - The message to send
     * @param ephemeral - Whether the message should be ephemeral (default: true)
     */
    replyToInteraction(interaction: CommandInteraction<CacheType>, message: string, ephemeral?: boolean): Promise<void>;
    /**
     * Gets the Discord client for event listening
     * @returns The Discord client instance
     */
    getClient(): Client;
    /**
     * Checks if the Discord client is ready
     * @returns True if the client is ready, false otherwise
     */
    isClientReady(): boolean;
    /**
     * Gracefully shuts down the Discord client
     * @returns Promise that resolves when client is destroyed
     */
    shutdown(): Promise<void>;
}
//# sourceMappingURL=discord.d.ts.map