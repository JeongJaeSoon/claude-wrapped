/**
 * Format a number with commas (e.g., 88605 -> "88,605")
 */
export declare function formatNumber(n: number): string;
/**
 * Format a number in compact form (e.g., 88605 -> "88.6K", 1200000 -> "1.2M")
 */
export declare function formatCompact(n: number): string;
/**
 * Format an hour number to 12-hour format (e.g., 0 -> "12 AM", 13 -> "1 PM", 23 -> "11 PM")
 */
export declare function formatHour(h: number): string;
/**
 * Normalize raw model identifiers into human-readable display names.
 *
 * Handles:
 * - Standard Claude model IDs (e.g., "claude-opus-4-6" -> "Claude Opus 4.6")
 * - Dated model IDs (e.g., "claude-sonnet-4-5-20250929" -> "Claude Sonnet 4.5")
 * - AWS Bedrock ARNs (extracts last segment or returns "Bedrock Model")
 * - converse/ prefixed models
 */
export declare function normalizeModelName(model: string): string;
