"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractGitHubPullRequestUrls = extractGitHubPullRequestUrls;
exports.isGitHubPullRequestUrls = isGitHubPullRequestUrls;
exports.getComments = getComments;
exports.getLastPullRequestUrl = getLastPullRequestUrl;
exports.isCommentWithPullRequest = isCommentWithPullRequest;
/**
 * Extracts GitHub Pull Request URLs from an array of text strings
 * @param texts - Array of text strings to search for GitHub PR URLs
 * @returns Array of GitHub PR URLs found in the texts
 */
function extractGitHubPullRequestUrls(texts) {
    // Define the regex pattern for GitHub PR URLs
    const githubPullRequestRegex = /https?:\/\/github\.com\/[^\/]+\/[^\/]+\/pull\/\d+/g;
    // Initialize an array to store the results
    const results = [];
    // Loop through each text string in the array
    texts.forEach((text) => {
        // Find all matches in the text
        const matches = text.match(githubPullRequestRegex);
        if (matches) {
            matches.forEach((match) => {
                results.push(match);
            });
        }
    });
    return results;
}
/**
 * Checks if a text string contains GitHub Pull Request URLs
 * @param text - Text string to check for GitHub PR URLs
 * @returns Array of matches if found, null if no matches
 */
function isGitHubPullRequestUrls(text) {
    // Define the regex pattern for GitHub PR URLs
    const githubPullRequestRegex = /https?:\/\/github\.com\/[^\/]+\/[^\/]+\/pull\/\d+/g;
    return text.match(githubPullRequestRegex);
}
/**
 * Extracts text content from an array of Shortcut comments
 * @param comments - Array of Shortcut comment objects
 * @returns Array of text strings from comments that have non-null text
 */
function getComments(comments) {
    const results = [];
    comments.forEach((comment) => {
        if (comment.text != null) {
            results.push(comment.text);
        }
    });
    return results;
}
/**
 * Extracts the most recent GitHub PR URL from comments
 * @param comments - Array of Shortcut comment objects
 * @returns The most recent GitHub PR URL found, or empty string if none found
 */
function getLastPullRequestUrl(comments) {
    const commentTexts = getComments(comments);
    const prUrls = extractGitHubPullRequestUrls(commentTexts);
    if (prUrls.length === 0) {
        return '';
    }
    return prUrls[prUrls.length - 1] || '';
}
/**
 * Checks if a comment contains a GitHub PR URL
 * @param commentText - The comment text to check
 * @returns True if the comment contains a GitHub PR URL, false otherwise
 */
function isCommentWithPullRequest(commentText) {
    const matches = isGitHubPullRequestUrls(commentText);
    return matches !== null && matches.length > 0;
}
//# sourceMappingURL=pr.js.map