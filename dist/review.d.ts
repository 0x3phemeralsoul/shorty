import { ShortcutService } from './shortcut';
import { DiscordService } from './discord';
import { Logger } from './types';
import { CommandInteraction, CacheType } from 'discord.js';
export declare class ReviewService {
    private shortcutService;
    private discordService;
    private logger;
    constructor(shortcutService: ShortcutService, discordService: DiscordService, logger: Logger);
    /**
     * Handles the review command for a Discord user
     * @param interaction - The Discord command interaction
     * @param discordUserId - The Discord user ID to get stories for
     */
    handleReviewCommand(interaction: CommandInteraction<CacheType>, discordUserId: string): Promise<void>;
    /**
     * Formats and sends the review response to Discord
     * @param interaction - The Discord command interaction
     * @param userStories - Array of stories assigned to the user
     * @param iterationName - Name of the current iteration
     */
    private sendReviewResponse;
}
//# sourceMappingURL=review.d.ts.map