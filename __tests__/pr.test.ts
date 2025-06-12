import { extractGitHubPullRequestUrls, getComments, isGitHubPullRequestUrls } from '../src/pr';
import { ShortcutComment } from '../src/types';

describe('PR Utility Functions', () => {
  describe('getComments', () => {
    test('should extract text from comments array', () => {
      const comments: ShortcutComment[] = [
        {
          id: 1,
          text: 'First comment',
          author_id: 'user1',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          app_url: 'https://app.shortcut.com/test/story/1/comment/1',
          entity_type: 'story-comment',
          deleted: false,
          story_id: 1,
          mention_ids: [],
          member_mention_ids: [],
          group_mention_ids: [],
          external_id: null,
          parent_id: null,
          position: 1,
          reactions: [],
          linked_to_slack: false
        },
        {
          id: 2,
          text: 'Second comment with PR: https://github.com/example/repo/pull/123',
          author_id: 'user2',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          app_url: 'https://app.shortcut.com/test/story/1/comment/2',
          entity_type: 'story-comment',
          deleted: false,
          story_id: 1,
          mention_ids: [],
          member_mention_ids: [],
          group_mention_ids: [],
          external_id: null,
          parent_id: null,
          position: 2,
          reactions: [],
          linked_to_slack: false
        },
        {
          id: 3,
          text: 'Third comment',
          author_id: 'user3',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          app_url: 'https://app.shortcut.com/test/story/1/comment/3',
          entity_type: 'story-comment',
          deleted: false,
          story_id: 1,
          mention_ids: [],
          member_mention_ids: [],
          group_mention_ids: [],
          external_id: null,
          parent_id: null,
          position: 3,
          reactions: [],
          linked_to_slack: false
        }
      ];

      const result = getComments(comments);
      expect(result).toEqual(['First comment', 'Second comment with PR: https://github.com/example/repo/pull/123', 'Third comment']);
    });

    test('should handle empty comments array', () => {
      const result = getComments([]);
      expect(result).toEqual([]);
    });

    test('should handle comments with null text', () => {
      const comments: ShortcutComment[] = [
        {
          id: 1,
          text: 'Valid comment',
          author_id: 'user1',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          app_url: 'https://app.shortcut.com/test/story/1/comment/1',
          entity_type: 'story-comment',
          deleted: false,
          story_id: 1,
          mention_ids: [],
          member_mention_ids: [],
          group_mention_ids: [],
          external_id: null,
          parent_id: null,
          position: 1,
          reactions: [],
          linked_to_slack: false
        },
        {
          id: 2,
          text: null as any, // Simulate null text
          author_id: 'user2',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          app_url: 'https://app.shortcut.com/test/story/1/comment/2',
          entity_type: 'story-comment',
          deleted: false,
          story_id: 1,
          mention_ids: [],
          member_mention_ids: [],
          group_mention_ids: [],
          external_id: null,
          parent_id: null,
          position: 2,
          reactions: [],
          linked_to_slack: false
        },
        {
          id: 3,
          text: 'Another valid comment',
          author_id: 'user3',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          app_url: 'https://app.shortcut.com/test/story/1/comment/3',
          entity_type: 'story-comment',
          deleted: false,
          story_id: 1,
          mention_ids: [],
          member_mention_ids: [],
          group_mention_ids: [],
          external_id: null,
          parent_id: null,
          position: 3,
          reactions: [],
          linked_to_slack: false
        }
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
      const comments: ShortcutComment[] = [
        {
          id: 1,
          text: 'Initial comment',
          author_id: 'user1',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          app_url: 'https://app.shortcut.com/test/story/1/comment/1',
          entity_type: 'story-comment',
          deleted: false,
          story_id: 1,
          mention_ids: [],
          member_mention_ids: [],
          group_mention_ids: [],
          external_id: null,
          parent_id: null,
          position: 1,
          reactions: [],
          linked_to_slack: false
        },
        {
          id: 2,
          text: 'First PR: https://github.com/example/repo/pull/100',
          author_id: 'user2',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          app_url: 'https://app.shortcut.com/test/story/1/comment/2',
          entity_type: 'story-comment',
          deleted: false,
          story_id: 1,
          mention_ids: [],
          member_mention_ids: [],
          group_mention_ids: [],
          external_id: null,
          parent_id: null,
          position: 2,
          reactions: [],
          linked_to_slack: false
        },
        {
          id: 3,
          text: 'Updated PR: https://github.com/example/repo/pull/101',
          author_id: 'user3',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          app_url: 'https://app.shortcut.com/test/story/1/comment/3',
          entity_type: 'story-comment',
          deleted: false,
          story_id: 1,
          mention_ids: [],
          member_mention_ids: [],
          group_mention_ids: [],
          external_id: null,
          parent_id: null,
          position: 3,
          reactions: [],
          linked_to_slack: false
        },
        {
          id: 4,
          text: 'Final PR: https://github.com/example/repo/pull/102',
          author_id: 'user4',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          app_url: 'https://app.shortcut.com/test/story/1/comment/4',
          entity_type: 'story-comment',
          deleted: false,
          story_id: 1,
          mention_ids: [],
          member_mention_ids: [],
          group_mention_ids: [],
          external_id: null,
          parent_id: null,
          position: 4,
          reactions: [],
          linked_to_slack: false
        }
      ];

      const commentsText = getComments(comments);
      const prUrls = extractGitHubPullRequestUrls(commentsText);
      const lastPr = prUrls.slice(-1)[0];

      expect(lastPr).toBe('https://github.com/example/repo/pull/102');
    });

    test('should handle comments with no PRs', () => {
      const comments: ShortcutComment[] = [
        {
          id: 1,
          text: 'Just a regular comment',
          author_id: 'user1',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          app_url: 'https://app.shortcut.com/test/story/1/comment/1',
          entity_type: 'story-comment',
          deleted: false,
          story_id: 1,
          mention_ids: [],
          member_mention_ids: [],
          group_mention_ids: [],
          external_id: null,
          parent_id: null,
          position: 1,
          reactions: [],
          linked_to_slack: false
        },
        {
          id: 2,
          text: 'Another comment without PR links',
          author_id: 'user2',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          app_url: 'https://app.shortcut.com/test/story/1/comment/2',
          entity_type: 'story-comment',
          deleted: false,
          story_id: 1,
          mention_ids: [],
          member_mention_ids: [],
          group_mention_ids: [],
          external_id: null,
          parent_id: null,
          position: 2,
          reactions: [],
          linked_to_slack: false
        }
      ];

      const commentsText = getComments(comments);
      const prUrls = extractGitHubPullRequestUrls(commentsText);

      expect(prUrls).toEqual([]);
    });
  });
}); 