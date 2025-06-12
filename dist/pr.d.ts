import { ShortcutComment } from './types';
/**
 * Extracts GitHub Pull Request URLs from an array of text strings
 * @param texts - Array of text strings to search for GitHub PR URLs
 * @returns Array of GitHub PR URLs found in the texts
 */
export declare function extractGitHubPullRequestUrls(texts: string[]): string[];
/**
 * Checks if a text string contains GitHub Pull Request URLs
 * @param text - Text string to check for GitHub PR URLs
 * @returns Array of matches if found, null if no matches
 */
export declare function isGitHubPullRequestUrls(text: string): string[] | null;
/**
 * Extracts text content from an array of Shortcut comments
 * @param comments - Array of Shortcut comment objects
 * @returns Array of text strings from comments that have non-null text
 */
export declare function getComments(comments: ShortcutComment[]): string[];
/**
 * Extracts the most recent GitHub PR URL from comments
 * @param comments - Array of Shortcut comment objects
 * @returns The most recent GitHub PR URL found, or empty string if none found
 */
export declare function getLastPullRequestUrl(comments: ShortcutComment[]): string;
/**
 * Checks if a comment contains a GitHub PR URL
 * @param commentText - The comment text to check
 * @returns True if the comment contains a GitHub PR URL, false otherwise
 */
export declare function isCommentWithPullRequest(commentText: string): boolean;
//# sourceMappingURL=pr.d.ts.map