import { Client, GatewayIntentBits, TextChannel, SlashCommandBuilder, REST, Routes, CommandInteraction, CacheType } from 'discord.js';
import { AppConfig, Logger } from './types';
import { ReviewService } from './review';

export class DiscordService {
  private client: Client;
  private config: AppConfig;
  private logger: Logger;
  private reviewService: ReviewService;
  private isReady: boolean = false;

  constructor(config: AppConfig, logger: Logger, reviewService: ReviewService) {
    this.client = new Client({ intents: [GatewayIntentBits.Guilds] });
    this.config = config;
    this.logger = logger;
    this.reviewService = reviewService;
    this.setupEventHandlers();
  }

  /**
   * Sets up Discord client event handlers
   */
  private setupEventHandlers(): void {
    this.client.on('ready', async () => {
      this.isReady = true;
      this.logger.info(`Discord bot logged in as ${this.client.user?.tag}`);
      await this.registerSlashCommands();
    });

    this.client.on('error', (error: Error) => {
      this.logger.error('Discord client error:', error);
    });

    this.client.on('disconnect', () => {
      this.isReady = false;
      this.logger.warn('Discord client disconnected');
    });

    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      await this.handleSlashCommand(interaction);
    });
  }

  /**
   * Registers slash commands with Discord
   */
  private async registerSlashCommands(): Promise<void> {
    try {
      const commands = [
        new SlashCommandBuilder()
          .setName('review')
          .setDescription('Get your assigned stories in the current iteration')
      ];

      const rest = new REST({ version: '10' }).setToken(this.config.env.DISCORD_TOKEN);

      if (this.client.user) {
        await rest.put(
          Routes.applicationCommands(this.client.user.id),
          { body: commands }
        );
        this.logger.info('Successfully registered slash commands');
      }
    } catch (error) {
      this.logger.error('Failed to register slash commands:', error);
    }
  }

  /**
   * Handles slash command interactions
   */
  private async handleSlashCommand(interaction: CommandInteraction<CacheType>): Promise<void> {
    if (interaction.commandName === 'review') {
      await this.handleReviewCommand(interaction);
    }
  }

  /**
   * Handles the /review command
   */
  private async handleReviewCommand(interaction: CommandInteraction<CacheType>): Promise<void> {
    try {
      this.logger.info(`Review command requested for Discord user: ${interaction.user.id}`);
      await this.reviewService.handleReviewCommand(interaction, interaction.user.id);
    } catch (error) {
      this.logger.error('Error handling review command:', error);
      await this.replyToInteraction(
        interaction,
        'Sorry, there was an error processing your review command. Please try again later.'
      );
    }
  }

  /**
   * Logs in to Discord with retry mechanism
   * @param retries - Current retry count
   * @returns Promise that resolves when login is successful
   */
  async loginWithRetry(retries: number = 0): Promise<void> {
    const maxRetries = parseInt(this.config.env.MAX_RETRIES, 10);
    const retryDelay = parseInt(this.config.env.RETRY_DELAY, 10);

    try {
      await this.client.login(this.config.env.DISCORD_TOKEN);
      this.logger.info('Logged in to Discord successfully');
    } catch (error) {
      if (retries < maxRetries) {
        this.logger.warn(`Login attempt ${retries + 1} failed. Retrying in ${retryDelay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        await this.loginWithRetry(retries + 1);
      } else {
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
  async sendMessage(channelId: string, message: string): Promise<void> {
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

      await (channel as TextChannel).send(message);
      this.logger.info(`Sent message to Discord channel ${channelId}: ${message}`);
    } catch (error) {
      this.logger.error(`Failed to send message to channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Sends a message to the development Discord channel
   * @param message - The message to send
   * @returns Promise that resolves when message is sent
   */
  async sendToDevChannel(message: string): Promise<void> {
    await this.sendMessage(this.config.discordChannels.dev, message);
  }

  /**
   * Sends a message to the core Discord channel
   * @param message - The message to send
   * @returns Promise that resolves when message is sent
   */
  async sendToCoreChannel(message: string): Promise<void> {
    await this.sendMessage(this.config.discordChannels.core, message);
  }

  /**
   * Maps Shortcut user IDs to Discord mentions
   * @param userIds - Array of Shortcut user IDs
   * @returns Array of Discord mention strings
   */
  mapUsersToDiscordMentions(userIds: string[]): string[] {
    return userIds
      .map(userId => this.config.userMappings.get(userId))
      .filter((mention): mention is string => mention !== undefined)
      .map(mention => `<${mention}>`);
  }

  /**
   * Maps a Discord user ID to a Shortcut user ID
   * @param discordUserId - The Discord user ID
   * @returns The corresponding Shortcut user ID, or null if not found
   */
  mapDiscordUserToShortcutUser(discordUserId: string): string | null {
    for (const [shortcutUserId, discordMention] of this.config.userMappings.entries()) {
      // Remove the @ symbol and angle brackets from the mention to get the Discord user ID
      const cleanDiscordId = discordMention.replace(/[@<>]/g, '');
      if (cleanDiscordId === discordUserId) {
        return shortcutUserId;
      }
    }
    return null;
  }

  /**
   * Replies to a slash command interaction
   * @param interaction - The command interaction
   * @param message - The message to send
   * @param ephemeral - Whether the message should be ephemeral (default: true)
   */
  async replyToInteraction(
    interaction: CommandInteraction<CacheType>, 
    message: string, 
    ephemeral: boolean = true
  ): Promise<void> {
    try {
      if (interaction.deferred) {
        await interaction.editReply(message);
      } else {
        await interaction.reply({ content: message, ephemeral });
      }
    } catch (error) {
      this.logger.error('Failed to reply to interaction:', error);
    }
  }

  /**
   * Gets the Discord client for event listening
   * @returns The Discord client instance
   */
  getClient(): Client {
    return this.client;
  }

  /**
   * Checks if the Discord client is ready
   * @returns True if the client is ready, false otherwise
   */
  isClientReady(): boolean {
    return this.isReady;
  }

  /**
   * Gracefully shuts down the Discord client
   * @returns Promise that resolves when client is destroyed
   */
  async shutdown(): Promise<void> {
    if (this.client) {
      this.logger.info('Shutting down Discord client...');
      this.client.destroy();
      this.isReady = false;
    }
  }
} 