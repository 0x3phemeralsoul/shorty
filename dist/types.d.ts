export interface Environment {
    DISCORD_TOKEN: string;
    DEV_DISCORD_CHANNEL_ID: string;
    CORE_DISCORD_CHANNEL_ID: string;
    SHORTCUT_API_TOKEN: string;
    LOGGER_LEVEL: string;
    MAX_RETRIES: string;
    RETRY_DELAY: string;
    PRODUCT_DEVELOPMENT_WORKFLOW_ID: string;
    OPERATIONAL_TASKS_WORKFLOW_ID: string;
    PRODUCT_DEVELOPEMENT_READY_FOR_REVIEW_STATE_ID: string;
    OPERATIONAL_TASKS_READY_FOR_REVIEW_STATE_ID: string;
    PORT?: string | undefined;
    NODE_ENV?: string | undefined;
}
export interface ShortcutTask {
    owner_ids: string[];
    id?: number;
    description?: string;
    complete?: boolean;
}
export interface ShortcutComment {
    id: number;
    text: string;
    author_id: string;
    created_at: string;
    updated_at: string;
    app_url: string;
    entity_type: 'story-comment';
    deleted: boolean;
    story_id: number;
    mention_ids: string[];
    member_mention_ids: string[];
    group_mention_ids: string[];
    external_id: string | null;
    parent_id: string | null;
    position: number;
    reactions: unknown[];
    linked_to_slack: boolean;
}
export interface ShortcutStory {
    id: number;
    name: string;
    app_url: string;
    workflow_id: number;
    workflow_state_id: number;
    deadline: string | null;
    tasks: ShortcutTask[];
    comments: ShortcutComment[];
    owner_ids: string[];
    story_type: string;
    description?: string;
    created_at: string;
    updated_at: string;
    archived: boolean;
    started: boolean;
    completed: boolean;
    started_at?: string;
    completed_at?: string;
    estimate?: number;
    external_id?: string;
    follower_ids: string[];
    group_id?: string;
    iteration_id?: number;
    labels: unknown[];
    linked_files: unknown[];
    member_mention_ids: string[];
    mention_ids: string[];
    moved_at?: string;
    position: number;
    previous_iteration_ids: number[];
    project_id?: number;
    requested_by_id: string;
    stats: {
        num_tasks_completed: number;
        num_tasks_total: number;
    };
    story_links: unknown[];
    workflow_state_id_history: number[];
}
export interface ShortcutIteration {
    id: number;
    name: string;
    description?: string;
    status: 'unstarted' | 'started' | 'done';
    start_date: string;
    end_date: string;
    created_at: string;
    updated_at: string;
    app_url: string;
    entity_type: 'iteration';
    follower_ids: string[];
    group_id?: string;
    group_mention_ids: string[];
    label_ids: number[];
    member_mention_ids: string[];
    mention_ids: string[];
    stats: {
        num_points: number;
        num_points_done: number;
        num_points_started: number;
        num_points_unstarted: number;
        num_stories: number;
        num_stories_done: number;
        num_stories_started: number;
        num_stories_unstarted: number;
    };
}
export interface SearchStoriesRequest {
    iteration_id?: number;
    workflow_state_ids?: number[];
    owner_id?: string;
    archived?: boolean;
    page_size?: number;
}
export interface WorkflowStateChange {
    new: number;
    old: number;
}
export interface WebhookActionChanges {
    started?: {
        new: boolean;
        old: boolean;
    };
    position?: {
        new: number;
        old: number;
    };
    workflow_state_id?: WorkflowStateChange;
    started_at?: {
        new: string;
    };
}
export interface WebhookAction {
    id: number;
    entity_type: 'story' | 'story-comment' | 'task' | 'epic' | 'iteration';
    action: 'create' | 'update' | 'delete';
    name?: string;
    story_type?: string;
    app_url?: string;
    changes?: WebhookActionChanges;
    text?: string;
    author_id?: string;
    mention_ids?: string[];
}
export interface WebhookReference {
    id: number;
    entity_type: 'workflow-state' | 'story' | 'member';
    name: string;
    type?: string;
}
export interface WebhookEvent {
    id: string;
    changed_at: string;
    version: string;
    primary_id: number;
    actor_name: string;
    member_id: string;
    actions: WebhookAction[];
    references?: WebhookReference[];
}
export interface UserMapping {
    shortcutId: string;
    discordId: string;
}
export interface UserStory {
    name: string;
    app_url: string;
}
export interface AppConfig {
    env: Environment;
    userMappings: Map<string, string>;
    workflowIds: {
        productDevelopment: number;
        operationalTasks: number;
    };
    readyForReviewStateIds: {
        productDevelopment: number;
        operationalTasks: number;
    };
    discordChannels: {
        dev: string;
        core: string;
    };
}
export interface Logger {
    info: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
    error: (message: string, error?: Error | unknown, ...args: unknown[]) => void;
    debug: (message: string, ...args: unknown[]) => void;
}
export interface ShortcutApiResponse {
    data: ShortcutStory;
}
export interface ProcessedWebhookResult {
    success: boolean;
    message: string;
    storyId?: number;
}
export interface WebhookRequest {
    body: WebhookEvent;
}
export interface CommentProcessingResult {
    isCommentCreated: boolean;
    commentText: string;
    authorId: string;
    mentionIds: string[];
    storyInfo: {
        id: number;
        name: string;
        url: string;
    } | null;
}
//# sourceMappingURL=types.d.ts.map