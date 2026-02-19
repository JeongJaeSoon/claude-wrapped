import type { StatsCache, TeamConfig, FeatureUsage } from '../types.js';
/**
 * Return the path to the ~/.claude directory.
 */
export declare function getClaudeDir(): string;
/**
 * Load and parse ~/.claude/stats-cache.json.
 * Returns null if the file doesn't exist or is invalid.
 */
export declare function loadStatsCache(claudeDir?: string): StatsCache | null;
/**
 * Load all team configs from ~/.claude/teams/{team}/config.json.
 * Skips teams whose config is missing or invalid.
 */
export declare function loadTeamConfigs(claudeDir?: string): TeamConfig[];
/**
 * Scan all session JSONL files in ~/.claude/projects/ to extract feature usage.
 * Extracts: tool calls, sub-agent types, skill invocations.
 */
export declare function loadFeatureUsage(claudeDir?: string): Promise<FeatureUsage>;
