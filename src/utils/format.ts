/**
 * Format a number with commas (e.g., 88605 -> "88,605")
 */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

/**
 * Format a number in compact form (e.g., 88605 -> "88.6K", 1200000 -> "1.2M")
 */
export function formatCompact(n: number): string {
  if (n >= 1_000_000_000) {
    return `${(n / 1_000_000_000).toFixed(1)}B`;
  }
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1)}K`;
  }
  return String(n);
}

/**
 * Format an hour number to 12-hour format (e.g., 0 -> "12 AM", 13 -> "1 PM", 23 -> "11 PM")
 */
export function formatHour(h: number): string {
  if (h === 0) return '12 AM';
  if (h === 12) return '12 PM';
  if (h < 12) return `${h} AM`;
  return `${h - 12} PM`;
}

/**
 * Normalize raw model identifiers into human-readable display names.
 *
 * Handles:
 * - Standard Claude model IDs (e.g., "claude-opus-4-6" -> "Claude Opus 4.6")
 * - Dated model IDs (e.g., "claude-sonnet-4-5-20250929" -> "Claude Sonnet 4.5")
 * - AWS Bedrock ARNs (extracts last segment or returns "Bedrock Model")
 * - converse/ prefixed models
 */
export function normalizeModelName(model: string): string {
  // Strip "converse/" prefix
  let cleaned = model.replace(/^converse\//, '');

  // Handle AWS Bedrock ARNs
  if (cleaned.startsWith('arn:aws:bedrock:')) {
    const segments = cleaned.split('/');
    const profileId = segments[segments.length - 1];
    // If the last segment looks like a random ID, just label it
    if (/^[a-z0-9]{10,}$/.test(profileId)) {
      return 'Bedrock Model';
    }
    cleaned = profileId;
  }

  // Match Claude model pattern: claude-{variant}-{major}-{minor}[-date]
  const claudeMatch = cleaned.match(
    /^claude-([a-z]+)-(\d+)-(\d+)(?:-\d{8})?$/
  );
  if (claudeMatch) {
    const [, variant, major, minor] = claudeMatch;
    const displayVariant = variant.charAt(0).toUpperCase() + variant.slice(1);
    return `Claude ${displayVariant} ${major}.${minor}`;
  }

  // Return as-is if no pattern matched
  return cleaned;
}
