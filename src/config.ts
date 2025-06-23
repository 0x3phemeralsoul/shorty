import { config } from 'dotenv';
import { Environment, AppConfig } from './types';

// Load environment variables
config();

/**
 * Validates that a required environment variable exists
 * @param key - The environment variable key
 * @param value - The environment variable value
 * @returns The validated value
 * @throws Error if the value is undefined or empty
 */
function requireEnvVar(key: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value.trim();
}

/**
 * Gets an optional environment variable with a default value
 * @param key - The environment variable key
 * @param defaultValue - The default value to use if not set
 * @returns The environment variable value or default
 */
function getEnvVar(key: string, defaultValue: string): string {
  return process.env[key]?.trim() || defaultValue;
}

/**
 * Gets an optional environment variable that can be undefined
 * @param key - The environment variable key
 * @returns The environment variable value or undefined
 */
function getOptionalEnvVar(key: string): string | undefined {
  const value = process.env[key];
  return value ? value.trim() : undefined;
}

/**
 * Validates and creates the environment configuration
 * @returns Validated environment configuration
 */
function createEnvironment(): Environment {
  return {
    DISCORD_TOKEN: requireEnvVar('DISCORD_TOKEN', process.env.DISCORD_TOKEN),
    DEV_DISCORD_CHANNEL_ID: requireEnvVar('DEV_DISCORD_CHANNEL_ID', process.env.DEV_DISCORD_CHANNEL_ID),
    CORE_DISCORD_CHANNEL_ID: requireEnvVar('CORE_DISCORD_CHANNEL_ID', process.env.CORE_DISCORD_CHANNEL_ID),
    SHORTCUT_API_TOKEN: requireEnvVar('SHORTCUT_API_TOKEN', process.env.SHORTCUT_API_TOKEN),
    LOGGER_LEVEL: getEnvVar('LOGGER_LEVEL', 'info'),
    MAX_RETRIES: getEnvVar('MAX_RETRIES', '3'),
    RETRY_DELAY: getEnvVar('RETRY_DELAY', '1000'),
    PRODUCT_DEVELOPMENT_WORKFLOW_ID: requireEnvVar('PRODUCT_DEVELOPMENT_WORKFLOW_ID', process.env.PRODUCT_DEVELOPMENT_WORKFLOW_ID),
    OPERATIONAL_TASKS_WORKFLOW_ID: requireEnvVar('OPERATIONAL_TASKS_WORKFLOW_ID', process.env.OPERATIONAL_TASKS_WORKFLOW_ID),
    PRODUCT_DEVELOPEMENT_READY_FOR_REVIEW_STATE_ID: requireEnvVar('PRODUCT_DEVELOPEMENT_READY_FOR_REVIEW_STATE_ID', process.env.PRODUCT_DEVELOPEMENT_READY_FOR_REVIEW_STATE_ID),
    OPERATIONAL_TASKS_READY_FOR_REVIEW_STATE_ID: requireEnvVar('OPERATIONAL_TASKS_READY_FOR_REVIEW_STATE_ID', process.env.OPERATIONAL_TASKS_READY_FOR_REVIEW_STATE_ID),
    PORT: getOptionalEnvVar('PORT'),
    NODE_ENV: getOptionalEnvVar('NODE_ENV')
  };
}

/**
 * Creates the user mapping from Shortcut user IDs to Discord user IDs
 * @returns Map of Shortcut user IDs to Discord user IDs
 */
function createUserMappings(): Map<string, string> {
  const users = new Map<string, string>();
  
  // User mappings from Shortcut to Discord
  users.set('64d22622-528c-4615-9314-2e9939307824', '@674714406218891327'); // decr1pto
  users.set('6380d6b1-fb27-4965-bfa2-f08f2c948292', '@593551141921357862'); // amusing
  users.set('6380d4da-0ae7-4ca5-a7f4-59ba335b4460', '@1041280647655850064'); // 3phy
  users.set('656f49bd-1c7a-42bb-874e-2a028317b06b', '@1157492699415457892'); // oddaf
  users.set('64d0f1b4-991e-4d95-b3fe-521a7cd53e04', '@1138099723807494295'); // p3th1um
  users.set('67cf13d4-f0d8-4dfe-898e-fcb90a063d9d', '@351468603209547798'); // pedro
  users.set('67b339e3-d196-42f1-8b85-4c4091f81366', '@871743111867564124'); // basset
  
  
  return users;
}

/**
 * Creates the complete application configuration
 * @returns Application configuration object
 */
export function createAppConfig(): AppConfig {
  const env = createEnvironment();
  
  return {
    env,
    userMappings: createUserMappings(),
    workflowIds: {
      productDevelopment: parseInt(env.PRODUCT_DEVELOPMENT_WORKFLOW_ID, 10),
      operationalTasks: parseInt(env.OPERATIONAL_TASKS_WORKFLOW_ID, 10)
    },
    readyForReviewStateIds: {
      productDevelopment: parseInt(env.PRODUCT_DEVELOPEMENT_READY_FOR_REVIEW_STATE_ID, 10),
      operationalTasks: parseInt(env.OPERATIONAL_TASKS_READY_FOR_REVIEW_STATE_ID, 10)
    },
    discordChannels: {
      dev: env.DEV_DISCORD_CHANNEL_ID,
      core: env.CORE_DISCORD_CHANNEL_ID
    }
  };
}

// Export the configuration instance
export const appConfig = createAppConfig(); 