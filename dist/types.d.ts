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
export interface ModelRanking {
    model: string;
    displayName: string;
    totalTokens: number;
    percentage: number;
}
export interface WrappedStats {
    period: {
        from: string;
        to: string;
    };
    periodLabel: string;
    totalMessages: number;
    totalSessions: number;
    totalToolCalls: number;
    totalTokens: number;
    activeDays: number;
    totalDays: number;
    longestStreak: number;
    currentStreak: number;
    peakDay: {
        date: string;
        messageCount: number;
    };
    avgMessagesPerDay: number;
    peakHour: number;
    topModels: ModelRanking[];
    hourlyDistribution: number[];
    dailyActivity: Array<{
        date: string;
        messageCount: number;
        sessionCount: number;
        toolCallCount: number;
        intensity: number;
    }>;
    teamsCreated: number;
    totalAgentsSpawned: number;
    longestSessionDuration: number;
    longestSessionMessages: number;
    firstSessionDate: string;
    featureUsage: FeatureUsage;
    dailyTokenChart: DailyTokenChartPoint[];
    chartModelNames: string[];
}
export interface DailyTokenChartPoint {
    date: string;
    tokensByModel: Record<string, number>;
}
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
        lines: string[];
    };
}
export interface CLIOptions {
    theme: 'dark' | 'light';
    output: string;
    from?: string;
    to?: string;
    username?: string;
    compact?: boolean;
}
