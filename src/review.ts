import { ShortcutService } from './shortcut';
import { DiscordService } from './discord';
import { UserStory, Logger } from './types';
import { CommandInteraction, CacheType } from 'discord.js';

export class ReviewService {
  private shortcutService: ShortcutService;
  private discordService: DiscordService;
  private logger: Logger;

  constructor(shortcutService: ShortcutService, discordService: DiscordService, logger: Logger) {
    this.shortcutService = shortcutService;
    this.discordService = discordService;
    this.logger = logger;
  }

  /**
   * Handles the review command for a Discord user
   * @param interaction - The Discord command interaction
   * @param discordUserId - The Discord user ID to get stories for
   */
  async handleReviewCommand(interaction: CommandInteraction<CacheType>, discordUserId: string): Promise<void> {
    try {
      this.logger.info(`Processing review command for Discord user: ${discordUserId}`);

      // Step 1: Map Discord user ID to Shortcut user ID
      const shortcutUserId = this.discordService.mapDiscordUserToShortcutUser(discordUserId);
      
      if (!shortcutUserId) {
        await this.discordService.replyToInteraction(
          interaction,
          'Sorry, I could not find your Shortcut account. Please make sure you are mapped in the system.'
        );
        return;
      }

      this.logger.debug(`Mapped Discord user ${discordUserId} to Shortcut user ${shortcutUserId}`);

      // Step 2: Get the current "started" iteration
      const currentIteration = await this.shortcutService.getCurrentIteration();
      
      if (!currentIteration) {
        await this.discordService.replyToInteraction(
          interaction,
          'No active iteration found. Please check if there is a started iteration in Shortcut.'
        );
        return;
      }

      this.logger.debug(`Found current iteration: ${currentIteration.name} (ID: ${currentIteration.id})`);

      // Step 3: Get all stories for the current iteration
      const iterationStories = await this.shortcutService.getStoriesForIteration(currentIteration.id);
      
      this.logger.debug(`Found ${iterationStories.length} stories in iteration ${currentIteration.id}`);

      // Step 4: Filter for relevant stories (Product Development or Operational Tasks workflows)
      const relevantStories = iterationStories.filter(story => 
        this.shortcutService.isRelevantStory(story)
      );

      this.logger.debug(`Found ${relevantStories.length} relevant stories`);

      // Step 5: Find stories where the user is assigned to tasks
      const userStories: UserStory[] = [];

      for (const story of relevantStories) {
        const taskOwnerIds = this.shortcutService.getTaskOwnerIds(story);
        
        if (taskOwnerIds.includes(shortcutUserId)) {
          userStories.push({
            name: story.name,
            app_url: story.app_url
          });
        }
      }

      this.logger.debug(`Found ${userStories.length} stories assigned to user ${shortcutUserId}`);

      // Step 6: Format and send the response
      await this.sendReviewResponse(interaction, userStories, currentIteration.name);

    } catch (error) {
      this.logger.error('Error processing review command:', error);
      
      await this.discordService.replyToInteraction(
        interaction,
        'Sorry, there was an error retrieving your assigned stories. Please try again later.'
      );
    }
  }

  /**
   * Formats and sends the review response to Discord
   * @param interaction - The Discord command interaction
   * @param userStories - Array of stories assigned to the user
   * @param iterationName - Name of the current iteration
   */
  private async sendReviewResponse(
    interaction: CommandInteraction<CacheType>,
    userStories: UserStory[],
    iterationName: string
  ): Promise<void> {
    if (userStories.length === 0) {
      await this.discordService.replyToInteraction(
        interaction,
        `No stories assigned to you in the current iteration: **${iterationName}**`
      );
      return;
    }

    // Format the stories as markdown links
    const storyLinks = userStories.map(story => 
      `[${story.name}](${story.app_url})`
    ).join('\n');

    const message = `**Your assigned stories in iteration: ${iterationName}**\n\n${storyLinks}`;

    await this.discordService.replyToInteraction(interaction, message);
  }
} 