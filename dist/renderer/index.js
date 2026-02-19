import { createCanvas } from '@napi-rs/canvas';
import { formatCompact, formatHour } from '../utils/format.js';
import { getTheme } from './themes.js';
import { FONT, drawRoundedRect, drawHeader, drawStatGrid, drawModelRanking, drawHourlyChart, drawFooter, drawFeatureColumns, drawSectionTitle, } from './components.js';
import { drawHeatmap } from './heatmap.js';
import { drawTokenChart } from './tokenChart.js';
import { drawDonutChart } from './donut.js';
// ─── Layout constants (all at 2x scale) ───
const W = 2400;
const PAD = 80;
const CONTENT_W = W - PAD * 2;
const HEADER_H = 190;
const FOOTER_H = 70;
const LEFT_RATIO = 0.42;
const GAP = 60;
const LEFT_W = Math.floor(CONTENT_W * LEFT_RATIO - GAP / 2);
const RIGHT_X = PAD + LEFT_W + GAP;
const RIGHT_W = CONTENT_W - LEFT_W - GAP;
export async function renderWrapped(stats, options) {
    const theme = getTheme(options.theme);
    // ═══════════════ Pre-compute layout Y positions ═══════════════
    const bodyY = PAD + HEADER_H;
    // Left panel: stats grid (2 rows × 130) → model ranking → highlights
    const statGridH = 2 * 130; // 260
    const modelY = bodyY + statGridH + 16;
    const modelSectionH = 46 + 3 * 72; // title + 3 rows = 262
    const highlightY = modelY + modelSectionH + 12;
    const highlightGridH = 2 * 110; // compact: 220
    const leftEnd = highlightY + 36 + highlightGridH; // section title + grid
    // Right panel: heatmap → hourly → callouts
    const heatmapH = 480;
    const hourlyY = bodyY + heatmapH + 24;
    const hourlyH = 320;
    const calloutY = hourlyY + hourlyH + 12;
    const calloutH = 76;
    const rightEnd = calloutY + calloutH;
    // Two-panel bottom
    let cursor = Math.max(leftEnd, rightEnd) + 28;
    // ── Donut chart + fun facts row (full width) ──
    const donutRowH = 310;
    const donutRowY = cursor;
    cursor += donutRowH + 24;
    // ── Token chart section (full width) ──
    const hasTokenChart = stats.dailyTokenChart.length > 1;
    const tokenChartH = 330;
    const tokenChartY = cursor;
    if (hasTokenChart) {
        cursor += tokenChartH + 20;
    }
    // ── Features section ──
    const { featureUsage } = stats;
    const hasFeatures = featureUsage.topTools.length > 0 ||
        featureUsage.topSubAgents.length > 0 ||
        featureUsage.topSkills.length > 0;
    const featY = cursor;
    const featSectionH = 230;
    if (hasFeatures) {
        cursor += featSectionH;
    }
    // Footer
    cursor += FOOTER_H + 16;
    // Dynamic canvas height
    const H = cursor + PAD;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');
    // ─── Background ───
    drawRoundedRect(ctx, 0, 0, W, H, 0, theme.background);
    // ─── Outer rounded border panel ───
    drawRoundedRect(ctx, PAD / 2, PAD / 2, W - PAD, H - PAD, 40, theme.surface, theme.border);
    // ─── Header ───
    const username = options.username ?? 'user';
    drawHeader(ctx, theme, PAD, PAD, username, stats.periodLabel);
    // Divider below header
    ctx.strokeStyle = theme.divider;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PAD, PAD + HEADER_H - 16);
    ctx.lineTo(W - PAD, PAD + HEADER_H - 16);
    ctx.stroke();
    // ═══════════════ Left panel ═══════════════
    // Key stats 2×2 grid — large values
    drawStatGrid(ctx, theme, PAD, bodyY, [
        { label: 'Messages', value: formatCompact(stats.totalMessages) },
        { label: 'Sessions', value: formatCompact(stats.totalSessions) },
        { label: 'Tool Calls', value: formatCompact(stats.totalToolCalls) },
        { label: 'Active Days', value: String(stats.activeDays) },
    ]);
    // Model ranking
    drawModelRanking(ctx, theme, PAD, modelY, stats.topModels);
    // Highlights 2×2 — compact style
    drawSectionTitle(ctx, theme, PAD, highlightY, 'HIGHLIGHTS');
    drawStatGrid(ctx, theme, PAD, highlightY + 36, [
        { label: 'Peak Day', value: `${formatCompact(stats.peakDay.messageCount)} msgs` },
        { label: 'Best Streak', value: `${stats.longestStreak} days` },
        { label: 'Tokens', value: formatCompact(stats.totalTokens) },
        { label: 'Teams / Agents', value: `${stats.teamsCreated} / ${stats.totalAgentsSpawned}` },
    ], { compact: true });
    // ═══════════════ Right panel ═══════════════
    // Activity heatmap (52 weeks)
    drawHeatmap(ctx, theme, RIGHT_X, bodyY, RIGHT_W, heatmapH, stats.dailyActivity, stats.period.to);
    // Hourly chart
    drawHourlyChart(ctx, theme, RIGHT_X, hourlyY, RIGHT_W, hourlyH, stats.hourlyDistribution);
    // Callouts row — mixed colors for visual variety
    const calloutItems = [
        { label: 'PEAK HOUR', value: formatHour(stats.peakHour), useAccent: true },
        { label: 'CURRENT STREAK', value: `${stats.currentStreak} days`, useAccent: false },
        { label: 'AVG / DAY', value: formatCompact(stats.avgMessagesPerDay), useAccent: false },
        { label: 'BEST SESSION', value: formatSessionDuration(stats.longestSessionDuration), useAccent: true },
    ];
    const calloutSpacing = Math.floor(RIGHT_W / calloutItems.length);
    for (let i = 0; i < calloutItems.length; i++) {
        const cx = RIGHT_X + i * calloutSpacing;
        ctx.fillStyle = theme.text.muted;
        ctx.font = `20px ${FONT}`;
        ctx.textBaseline = 'top';
        ctx.fillText(calloutItems[i].label, cx, calloutY);
        ctx.fillStyle = calloutItems[i].useAccent ? theme.text.accent : theme.text.primary;
        ctx.font = `bold 36px ${FONT}`;
        ctx.fillText(calloutItems[i].value, cx, calloutY + 26);
    }
    // ═══════════════ Full-width: Donut + Fun Facts ═══════════════
    // Divider
    ctx.strokeStyle = theme.divider;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PAD, donutRowY);
    ctx.lineTo(W - PAD, donutRowY);
    ctx.stroke();
    // Donut chart (left side, ~40% width)
    const donutW = Math.floor(CONTENT_W * 0.40);
    drawDonutChart(ctx, theme, PAD, donutRowY + 14, donutW, donutRowH - 20, stats.topModels);
    // Fun facts (right side, ~58% width)
    const factsX = PAD + donutW + 40;
    const factsW = CONTENT_W - donutW - 40;
    drawFunFacts(ctx, theme, factsX, donutRowY + 14, factsW, donutRowH - 20, stats);
    // ═══════════════ Full-width: TOKEN USAGE chart ═══════════════
    if (hasTokenChart) {
        ctx.strokeStyle = theme.divider;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(PAD, tokenChartY);
        ctx.lineTo(W - PAD, tokenChartY);
        ctx.stroke();
        drawTokenChart(ctx, theme, PAD, tokenChartY + 14, CONTENT_W, tokenChartH - 14, stats.dailyTokenChart, stats.chartModelNames);
    }
    // ═══════════════ Full-width: MOST USED FEATURES ═══════════════
    if (hasFeatures) {
        ctx.strokeStyle = theme.divider;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(PAD, featY);
        ctx.lineTo(W - PAD, featY);
        ctx.stroke();
        drawSectionTitle(ctx, theme, PAD, featY + 14, 'MOST USED FEATURES');
        drawFeatureColumns(ctx, theme, PAD, featY + 50, CONTENT_W, [
            { title: 'TOOLS', items: featureUsage.topTools },
            { title: 'SUB-AGENTS', items: featureUsage.topSubAgents },
            { title: 'SKILLS', items: featureUsage.topSkills },
        ]);
    }
    // ─── Footer ───
    drawFooter(ctx, theme, PAD, H - PAD - FOOTER_H + 10, CONTENT_W);
    return canvas.toBuffer('image/png');
}
// ─── Fun Facts panel ───
function drawFunFacts(ctx, theme, x, y, _w, _h, stats) {
    drawSectionTitle(ctx, theme, x, y, 'FUN FACTS');
    const facts = buildFunFacts(stats);
    const startY = y + 40;
    const rowH = 50;
    facts.slice(0, 4).forEach((fact, i) => {
        const fy = startY + i * rowH;
        // Bullet marker
        ctx.fillStyle = theme.chart.lines[i % theme.chart.lines.length];
        ctx.beginPath();
        ctx.arc(x + 5, fy + 11, 4, 0, Math.PI * 2);
        ctx.fill();
        // Label
        ctx.fillStyle = theme.text.secondary;
        ctx.font = `22px ${FONT}`;
        ctx.textBaseline = 'top';
        ctx.fillText(fact.label, x + 18, fy);
        // Value — accent for emphasis
        ctx.fillStyle = theme.text.accent;
        ctx.font = `bold 22px ${FONT}`;
        const labelWidth = ctx.measureText(fact.label).width;
        ctx.fillText(fact.value, x + 18 + labelWidth + 10, fy);
    });
}
function buildFunFacts(stats) {
    const facts = [];
    // Days since first session
    const firstDate = new Date(stats.firstSessionDate);
    const now = new Date();
    const daysSinceFirst = Math.floor((now.getTime() - firstDate.getTime()) / 86_400_000);
    if (daysSinceFirst > 0) {
        const months = Math.floor(daysSinceFirst / 30);
        facts.push({
            label: 'Using Claude Code for',
            value: daysSinceFirst > 30
                ? `${months} ${months === 1 ? 'month' : 'months'}`
                : `${daysSinceFirst} ${daysSinceFirst === 1 ? 'day' : 'days'}`,
        });
    }
    // Late night ratio (hours 0-5)
    const lateNightMessages = stats.hourlyDistribution
        .slice(0, 6)
        .reduce((s, v) => s + v, 0);
    const totalHourly = stats.hourlyDistribution.reduce((s, v) => s + v, 0);
    if (totalHourly > 0) {
        const lateNightPct = Math.round((lateNightMessages / totalHourly) * 100);
        if (lateNightPct >= 5) {
            facts.push({
                label: 'Late night coding:',
                value: `${lateNightPct}% of activity`,
            });
        }
    }
    // Messages per session
    if (stats.totalSessions > 0) {
        const msgsPerSession = Math.round(stats.totalMessages / stats.totalSessions);
        facts.push({
            label: 'Avg messages per session:',
            value: formatCompact(msgsPerSession),
        });
    }
    // Tool calls per message ratio
    if (stats.totalMessages > 0) {
        const toolRatio = (stats.totalToolCalls / stats.totalMessages).toFixed(1);
        facts.push({
            label: 'Tool calls per message:',
            value: `${toolRatio}×`,
        });
    }
    // Activity rate
    if (stats.totalDays > 0) {
        const activityRate = Math.round((stats.activeDays / stats.totalDays) * 100);
        facts.push({
            label: 'Activity rate:',
            value: `${activityRate}% of days`,
        });
    }
    // Tokens per active day
    if (stats.activeDays > 0) {
        const tokensPerDay = Math.round(stats.totalTokens / stats.activeDays);
        facts.push({
            label: 'Tokens per active day:',
            value: formatCompact(tokensPerDay),
        });
    }
    return facts;
}
// ─── Helpers ───
function formatSessionDuration(ms) {
    const totalMinutes = Math.floor(ms / 60_000);
    if (totalMinutes < 1)
        return `${Math.floor(ms / 1000)}s`;
    if (totalMinutes < 60)
        return `${totalMinutes}m`;
    const hours = Math.floor(totalMinutes / 60);
    const remMins = totalMinutes % 60;
    return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
}
//# sourceMappingURL=index.js.map