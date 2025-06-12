"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordService = void 0;
const discord_js_1 = require("discord.js");
class DiscordService {
    client;
    config;
    logger;
    isReady = false;
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.client = new discord_js_1.Client({
            intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildMessages]
        });
        this.setupEventHandlers();
    }
    /**
     * Sets up Discord client event handlers
     */
    setupEventHandlers() {
        this.client.on('ready', () => {
            this.isReady = true;
            this.logger.info(`Discord bot logged in as ${this.client.user?.tag}`);
        });
        this.client.on('error', (error) => {
            this.logger.error('Discord client error:', error);
        });
        this.client.on('disconnect', () => {
            this.isReady = false;
            this.logger.warn('Discord client disconnected');
        });
    }
    /**
     * Logs in to Discord with retry mechanism
     * @param retries - Current retry count
     * @returns Promise that resolves when login is successful
     */
    async loginWithRetry(retries = 0) {
        const maxRetries = parseInt(this.config.env.MAX_RETRIES, 10);
        const retryDelay = parseInt(this.config.env.RETRY_DELAY, 10);
        try {
            await this.client.login(this.config.env.DISCORD_TOKEN);
            this.logger.info('Logged in to Discord successfully');
        }
        catch (error) {
            if (retries < maxRetries) {
                this.logger.warn(`Login attempt ${retries + 1} failed. Retrying in ${retryDelay / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                await this.loginWithRetry(retries + 1);
            }
            else {
                this.logger.error('Max login attempts reached. Failed to log in to Discord:', error);
                throw new Error('Failed to login to Discord after maximum retries');
            }
        }
    }
    /**
     * Sends a message to a Discord channel
     * @param channelId - The Discord channel ID
     * @param message - The message to send
     * @returns Promise that resolves when message is sent
     */
    async sendMessage(channelId, message) {
        if (!this.isReady) {
            throw new Error('Discord client is not ready');
        }
        try {
            const channel = await this.client.channels.fetch(channelId);
            if (!channel) {
                throw new Error(`Channel with ID ${channelId} not found`);
            }
            if (!channel.isTextBased()) {
                throw new Error(`Channel with ID ${channelId} is not a text channel`);
            }
            await channel.send(message);
            this.logger.info(`Sent message to Discord channel ${channelId}: ${message}`);
        }
        catch (error) {
            this.logger.error(`Failed to send message to channel ${channelId}:`, error);
            throw error;
        }
    }
    /**
     * Sends a message to the development Discord channel
     * @param message - The message to send
     * @returns Promise that resolves when message is sent
     */
    async sendToDevChannel(message) {
        await this.sendMessage(this.config.discordChannels.dev, message);
    }
    /**
     * Sends a message to the core Discord channel
     * @param message - The message to send
     * @returns Promise that resolves when message is sent
     */
    async sendToCoreChannel(message) {
        await this.sendMessage(this.config.discordChannels.core, message);
    }
    /**
     * Maps Shortcut user IDs to Discord mentions
     * @param userIds - Array of Shortcut user IDs
     * @returns Array of Discord mention strings
     */
    mapUsersToDiscordMentions(userIds) {
        return userIds
            .map(userId => this.config.userMappings.get(userId))
            .filter((mention) => mention !== undefined)
            .map(mention => `<${mention}>`);
    }
    /**
     * Checks if the Discord client is ready
     * @returns True if the client is ready, false otherwise
     */
    isClientReady() {
        return this.isReady;
    }
    /**
     * Gracefully shuts down the Discord client
     * @returns Promise that resolves when client is destroyed
     */
    async shutdown() {
        if (this.client) {
            this.logger.info('Shutting down Discord client...');
            this.client.destroy();
            this.isReady = false;
        }
    }
}
exports.DiscordService = DiscordService;
//# sourceMappingURL=discord.js.map