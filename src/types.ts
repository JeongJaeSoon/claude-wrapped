// ─── Raw data types from ~/.claude/stats-cache.json ───

export interface DailyActivity {
  date: string;
  messageCount: number;
  sessionCount: number;
  toolCallCount: number;
}

export interface DailyModelTokens {
  date: string;
  tokensByModel: Record<string, number>;
}

export interface ModelUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
  webSearchRequests: number;
  costUSD: number;
}

export interface LongestSession {
  sessionId: string;
  duration: number;
  messageCount: number;
  timestamp: string;
}

export interface StatsCache {
  version: number;
  lastComputedDate: string;
  dailyActivity: DailyActivity[];
  dailyModelTokens: DailyModelTokens[];
  modelUsage: Record<string, ModelUsage>;
  totalSessions: number;
  totalMessages: number;
  longestSession: LongestSession;
  firstSessionDate: string;
  hourCounts: Record<string, number>;
  totalSpeculationTimeSavedMs: number;
}

// ─── Team config from ~/.claude/teams/ ───

export interface TeamMember {
  name: string;
  agentId: string;
  agentType: string;
  model: string;
  joinedAt: number;
  color?: string;
}

export interface TeamConfig {
  name: string;
  description: string;
  createdAt: number;
  leadAgentId: string;
  members: TeamMember[];
}

// ─── Computed Wrapped statistics ───

export interface ModelRanking {
  model: string;
  displayName: string;
  totalTokens: number;
  percentage: number;
}

export interface WrappedStats {
  // Period
  period: { from: string; to: string };
  periodLabel: string;

  // Core metrics
  totalMessages: number;
  totalSessions: number;
  totalToolCalls: number;
  totalTokens: number;
  activeDays: number;
  totalDays: number;

  // Streaks
  longestStreak: number;
  currentStreak: number;

  // Peak metrics
  peakDay: { date: string; messageCount: number };
  avgMessagesPerDay: number;
  peakHour: number;

  // Rankings
  topModels: ModelRanking[];

  // Distributions
  hourlyDistribution: number[]; // 24 entries (0-23h)
  dailyActivity: Array<{
    date: string;
    messageCount: number;
    sessionCount: number;
    toolCallCount: number;
    intensity: number; // 0-4
  }>;

  // Team stats
  teamsCreated: number;
  totalAgentsSpawned: number;

  // Session stats
  longestSessionDuration: number;
  longestSessionMessages: number;

  // First use
  firstSessionDate: string;

  // Feature usage
  featureUsage: FeatureUsage;

  // Daily token chart data (for time-series line chart)
  dailyTokenChart: DailyTokenChartPoint[];
  chartModelNames: string[]; // display names of top models shown in chart
}

export interface DailyTokenChartPoint {
  date: string;
  tokensByModel: Record<string, number>; // display name -> tokens
}

// ─── Feature usage from session data ───

export interface FeatureRanking {
  name: string;
  count: number;
  percentage: number;
}

export interface FeatureUsage {
  topTools: FeatureRanking[];
  topSubAgents: FeatureRanking[];
  topSkills: FeatureRanking[];
}

// ─── Theme types ───

export interface Theme {
  name: 'dark' | 'light';
  background: string;
  surface: string;
  surfaceAlt: string;
  text: {
    primary: string;
    secondary: string;
    accent: string;
    muted: string;
  };
  heatmap: {
    empty: string;
    levels: [string, string, string, string];
  };
  border: string;
  divider: string;
  chart: {
    bar: string;
    barMuted: string;
    lines: string[]; // colors for multi-line charts (4-5 distinct colors)
  };
}

// ─── CLI options ───

export interface CLIOptions {
  theme: 'dark' | 'light';
  output: string;
  from?: string;
  to?: string;
  username?: string;
  compact?: boolean;
}
