import { parseDate, differenceInDays, formatDate } from '../utils/date.js';
import { normalizeModelName } from '../utils/format.js';
/**
 * Compute the complete WrappedStats from raw stats cache data and team configs.
 * All date-filterable metrics use the from/to range.
 */
export function computeWrappedStats(statsCache, teamConfigs, options) {
    const from = options?.from;
    const to = options?.to;
    // ─── Filter daily data by date range ───
    const filteredActivity = filterByDateRange(statsCache.dailyActivity, from, to);
    const filteredModelTokens = filterModelTokensByDateRange(statsCache.dailyModelTokens, from, to);
    // ─── Determine period boundaries ───
    const sortedDates = filteredActivity.map((d) => d.date).sort();
    const periodFrom = from ?? sortedDates[0] ?? statsCache.firstSessionDate.slice(0, 10);
    const periodTo = to ?? sortedDates[sortedDates.length - 1] ?? statsCache.lastComputedDate;
    // ─── Core metrics (filtered) ───
    const totalMessages = filteredActivity.reduce((s, d) => s + d.messageCount, 0);
    const totalSessions = filteredActivity.reduce((s, d) => s + d.sessionCount, 0);
    const totalToolCalls = filteredActivity.reduce((s, d) => s + d.toolCallCount, 0);
    const activeDays = filteredActivity.length;
    const totalDays = Math.max(1, differenceInDays(parseDate(periodTo), parseDate(periodFrom)) + 1);
    // ─── Tokens & models (filtered via dailyModelTokens) ───
    const { topModels, totalTokens } = computeTopModelsFromDaily(filteredModelTokens);
    // ─── Streaks (filtered) ───
    const { longestStreak, currentStreak } = computeStreaks(sortedDates);
    // ─── Peak day (filtered) ───
    const peakDayEntry = filteredActivity.reduce((best, d) => (d.messageCount > best.messageCount ? d : best), filteredActivity[0] ?? { date: periodFrom, messageCount: 0 });
    // ─── Average messages per active day (filtered) ───
    const avgMessagesPerDay = activeDays > 0 ? Math.round(totalMessages / activeDays) : 0;
    // ─── Hourly distribution (aggregate — no per-day data available) ───
    const hourlyDistribution = buildHourlyDistribution(statsCache.hourCounts);
    const peakHour = hourlyDistribution.indexOf(Math.max(...hourlyDistribution));
    // ─── Daily activity with intensity (filtered) ───
    const maxMessages = Math.max(...filteredActivity.map((d) => d.messageCount), 1);
    const dailyActivity = filteredActivity.map((d) => ({
        date: d.date,
        messageCount: d.messageCount,
        sessionCount: d.sessionCount,
        toolCallCount: d.toolCallCount,
        intensity: computeIntensity(d.messageCount, maxMessages),
    }));
    // ─── Team stats (filtered by createdAt within period) ───
    const filteredTeams = filterTeamsByDateRange(teamConfigs, periodFrom, periodTo);
    const teamsCreated = filteredTeams.length;
    const totalAgentsSpawned = filteredTeams.reduce((sum, t) => sum + t.members.length, 0);
    // ─── Session stats (aggregate — no per-session date filter available) ───
    const longestSessionDuration = statsCache.longestSession.duration;
    const longestSessionMessages = statsCache.longestSession.messageCount;
    // ─── Period label ───
    const periodLabel = buildPeriodLabel(periodFrom, periodTo);
    // ─── Daily token chart (for time-series line chart) ───
    const chartModelNames = topModels.slice(0, 4).map((m) => m.displayName);
    const dailyTokenChart = buildDailyTokenChart(filteredModelTokens, chartModelNames);
    return {
        period: { from: periodFrom, to: periodTo },
        periodLabel,
        totalMessages,
        totalSessions,
        totalToolCalls,
        totalTokens,
        activeDays,
        totalDays,
        longestStreak,
        currentStreak,
        peakDay: { date: peakDayEntry.date, messageCount: peakDayEntry.messageCount },
        avgMessagesPerDay,
        peakHour,
        topModels,
        hourlyDistribution,
        dailyActivity,
        teamsCreated,
        totalAgentsSpawned,
        longestSessionDuration,
        longestSessionMessages,
        firstSessionDate: statsCache.firstSessionDate,
        featureUsage: options?.featureUsage ?? {
            topTools: [],
            topSubAgents: [],
            topSkills: [],
        },
        dailyTokenChart,
        chartModelNames,
    };
}
// ─── Filtering helpers ───
function filterByDateRange(activities, from, to) {
    return activities.filter((d) => {
        const date = parseDate(d.date);
        if (from && date < parseDate(from))
            return false;
        if (to && date > parseDate(to))
            return false;
        return true;
    });
}
function filterModelTokensByDateRange(dailyModelTokens, from, to) {
    return dailyModelTokens.filter((d) => {
        const date = parseDate(d.date);
        if (from && date < parseDate(from))
            return false;
        if (to && date > parseDate(to))
            return false;
        return true;
    });
}
function filterTeamsByDateRange(teams, from, to) {
    const fromMs = parseDate(from).getTime();
    const toMs = parseDate(to).getTime() + 86_400_000; // include the end date
    return teams.filter((t) => t.createdAt >= fromMs && t.createdAt <= toMs);
}
// ─── Computation helpers ───
function computeTopModelsFromDaily(filteredModelTokens) {
    // Aggregate tokens by model across filtered days
    const modelTotals = new Map();
    for (const day of filteredModelTokens) {
        for (const [model, tokens] of Object.entries(day.tokensByModel)) {
            modelTotals.set(model, (modelTotals.get(model) ?? 0) + tokens);
        }
    }
    const grandTotal = Array.from(modelTotals.values()).reduce((s, v) => s + v, 0);
    // Merge models with same display name
    const merged = new Map();
    for (const [model, tokens] of modelTotals.entries()) {
        const displayName = normalizeModelName(model);
        const existing = merged.get(displayName);
        if (existing) {
            existing.totalTokens += tokens;
        }
        else {
            merged.set(displayName, { model, displayName, totalTokens: tokens });
        }
    }
    const topModels = Array.from(merged.values())
        .sort((a, b) => b.totalTokens - a.totalTokens)
        .map((entry) => ({
        model: entry.model,
        displayName: entry.displayName,
        totalTokens: entry.totalTokens,
        percentage: grandTotal > 0
            ? Math.round((entry.totalTokens / grandTotal) * 1000) / 10
            : 0,
    }));
    return { topModels, totalTokens: grandTotal };
}
function computeStreaks(sortedDates) {
    if (sortedDates.length === 0) {
        return { longestStreak: 0, currentStreak: 0 };
    }
    let longestStreak = 1;
    let streak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
        const prev = parseDate(sortedDates[i - 1]);
        const curr = parseDate(sortedDates[i]);
        if (differenceInDays(curr, prev) === 1) {
            streak++;
            longestStreak = Math.max(longestStreak, streak);
        }
        else {
            streak = 1;
        }
    }
    let currentStreak = 1;
    for (let i = sortedDates.length - 1; i > 0; i--) {
        const curr = parseDate(sortedDates[i]);
        const prev = parseDate(sortedDates[i - 1]);
        if (differenceInDays(curr, prev) === 1) {
            currentStreak++;
        }
        else {
            break;
        }
    }
    return { longestStreak, currentStreak };
}
function buildHourlyDistribution(hourCounts) {
    const distribution = new Array(24).fill(0);
    for (const [hour, count] of Object.entries(hourCounts)) {
        const h = parseInt(hour, 10);
        if (h >= 0 && h < 24) {
            distribution[h] = count;
        }
    }
    return distribution;
}
function computeIntensity(count, max) {
    if (count === 0)
        return 0;
    const ratio = count / max;
    if (ratio <= 0.25)
        return 1;
    if (ratio <= 0.5)
        return 2;
    if (ratio <= 0.75)
        return 3;
    return 4;
}
function buildPeriodLabel(from, to) {
    const fromLabel = formatDate(parseDate(from), 'MMM yyyy');
    const toLabel = formatDate(parseDate(to), 'MMM yyyy');
    return fromLabel === toLabel ? fromLabel : `${fromLabel} \u2014 ${toLabel}`;
}
/**
 * Build daily token chart data, normalizing model names and grouping
 * non-top models into "Other". Sorted by date ascending.
 */
function buildDailyTokenChart(filteredModelTokens, chartModelNames) {
    const chartNameSet = new Set(chartModelNames);
    return filteredModelTokens
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((day) => {
        const tokensByModel = {};
        let otherTokens = 0;
        for (const [model, tokens] of Object.entries(day.tokensByModel)) {
            const displayName = normalizeModelName(model);
            if (chartNameSet.has(displayName)) {
                tokensByModel[displayName] = (tokensByModel[displayName] ?? 0) + tokens;
            }
            else {
                otherTokens += tokens;
            }
        }
        if (otherTokens > 0) {
            tokensByModel['Other'] = otherTokens;
        }
        return { date: day.date, tokensByModel };
    });
}
//# sourceMappingURL=stats.js.map