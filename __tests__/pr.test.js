const { extractGitHubPullRequestUrls, getComments, isGitHubPullRequestUrls } = require('../pr');

describe('PR Utility Functions', () => {
  describe('getComments', () => {
    test('should extract text from comments array', () => {
      const comments = [
        { text: 'First comment' },
        { text: 'Second comment with PR: https://github.com/example/repo/pull/123' },
        { text: 'Third comment' }
      ];

      const result = getComments(comments);
      expect(result).toEqual(['First comment', 'Second comment with PR: https://github.com/example/repo/pull/123', 'Third comment']);
    });

    test('should handle empty comments array', () => {
      const result = getComments([]);
      expect(result).toEqual([]);
    });

    test('should handle comments without text property', () => {
      const comments = [
        { text: 'Valid comment' },
        { author: 'John' }, // No text property
        { text: 'Another valid comment' }
      ];

      const result = getComments(comments);
      expect(result).toEqual(['Valid comment', 'Another valid comment']);
    });

    test('should handle comments with null text', () => {
      const comments = [
        { text: 'Valid comment' },
        { text: null }, // Null text
        { text: 'Another valid comment' }
      ];

      const result = getComments(comments);
      expect(result).toEqual(['Valid comment', 'Another valid comment']);
    });
  });

  describe('isGitHubPullRequestUrls', () => {
    test('should return match array for valid GitHub PR URLs', () => {
      const result = isGitHubPullRequestUrls('https://github.com/owner/repo/pull/123');
      expect(result).toEqual(['https://github.com/owner/repo/pull/123']);
    });

    test('should return null for invalid URLs', () => {
      expect(isGitHubPullRequestUrls('https://gitlab.com/owner/repo/merge_requests/123')).toBeNull();
      expect(isGitHubPullRequestUrls('https://github.com/owner/repo/issues/123')).toBeNull();
      expect(isGitHubPullRequestUrls('https://github.com/owner/repo')).toBeNull();
      expect(isGitHubPullRequestUrls('not-a-url')).toBeNull();
      expect(isGitHubPullRequestUrls('')).toBeNull();
    });

    test('should handle different GitHub URL formats', () => {
      expect(isGitHubPullRequestUrls('http://github.com/owner/repo/pull/123')).toEqual(['http://github.com/owner/repo/pull/123']);
      expect(isGitHubPullRequestUrls('https://www.github.com/owner/repo/pull/123')).toBeNull(); // www. is not supported by the regex
    });
  });

  describe('extractGitHubPullRequestUrls', () => {
    test('should extract GitHub PR URLs from text array', () => {
      const texts = ['Here is the PR: https://github.com/example/repo/pull/123', 'and another one https://github.com/test/project/pull/456'];
      const result = extractGitHubPullRequestUrls(texts);
      
      expect(result).toEqual([
        'https://github.com/example/repo/pull/123',
        'https://github.com/test/project/pull/456'
      ]);
    });

    test('should return empty array when no PR URLs found', () => {
      const texts = ['This is just a regular comment with no PR links'];
      const result = extractGitHubPullRequestUrls(texts);
      
      expect(result).toEqual([]);
    });

    test('should handle mixed URLs and only return GitHub PR URLs', () => {
      const texts = [
        'Check out this issue: https://github.com/example/repo/issues/123',
        'And this PR: https://github.com/example/repo/pull/456',
        'Also this GitLab MR: https://gitlab.com/example/repo/merge_requests/789',
        'And another PR: https://github.com/another/repo/pull/101'
      ];
      
      const result = extractGitHubPullRequestUrls(texts);
      
      expect(result).toEqual([
        'https://github.com/example/repo/pull/456',
        'https://github.com/another/repo/pull/101'
      ]);
    });

    test('should handle empty array input', () => {
      expect(extractGitHubPullRequestUrls([])).toEqual([]);
    });

    test('should extract URLs with different protocols', () => {
      const texts = [
        'HTTP PR: http://github.com/example/repo/pull/123',
        'HTTPS PR: https://github.com/example/repo/pull/456'
      ];
      
      const result = extractGitHubPullRequestUrls(texts);
      
      expect(result).toEqual([
        'http://github.com/example/repo/pull/123',
        'https://github.com/example/repo/pull/456'
      ]);
    });

    test('should handle URLs in markdown format', () => {
      const texts = ['PR link: [Pull Request](https://github.com/example/repo/pull/123)', 'and another [PR](https://github.com/test/project/pull/456)'];
      const result = extractGitHubPullRequestUrls(texts);
      
      expect(result).toEqual([
        'https://github.com/example/repo/pull/123',
        'https://github.com/test/project/pull/456'
      ]);
    });
  });

  describe('Integration test', () => {
    test('should extract last PR from comments', () => {
      const comments = [
        { text: 'Initial comment' },
        { text: 'First PR: https://github.com/example/repo/pull/100' },
        { text: 'Updated PR: https://github.com/example/repo/pull/101' },
        { text: 'Final PR: https://github.com/example/repo/pull/102' }
      ];

      const commentsText = getComments(comments);
      const prUrls = extractGitHubPullRequestUrls(commentsText);
      const lastPr = prUrls.slice(-1)[0];

      expect(lastPr).toBe('https://github.com/example/repo/pull/102');
    });

    test('should handle comments with no PRs', () => {
      const comments = [
        { text: 'Just a regular comment' },
        { text: 'Another comment without PR links' }
      ];

      const commentsText = getComments(comments);
      const prUrls = extractGitHubPullRequestUrls(commentsText);

      expect(prUrls).toEqual([]);
    });
  });
}); 