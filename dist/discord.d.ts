import { AppConfig, Logger } from './types';
export declare class DiscordService {
    private client;
    private config;
    private logger;
    private isReady;
    constructor(config: AppConfig, logger: Logger);
    /**
     * Sets up Discord client event handlers
     */
    private setupEventHandlers;
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