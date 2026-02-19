#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import pc from 'picocolors';
import { formatDate } from './utils/date.js';
import { run } from './cli.js';
import { loadStatsCache, loadTeamConfigs, loadFeatureUsage } from './data/parser.js';
import { computeWrappedStats } from './data/stats.js';
import { renderWrapped } from './renderer/index.js';
import { formatNumber, formatCompact } from './utils/format.js';
async function main() {
    const options = run();
    // ─── Banner ───
    console.log();
    console.log(pc.bold(pc.cyan('  Claude Code Wrapped')));
    console.log(pc.dim(`  ${'─'.repeat(40)}`));
    console.log();
    // ─── Step 1: Load data ───
    step('Loading usage data');
    const statsCache = loadStatsCache();
    if (!statsCache) {
        console.error();
        console.error(`  ${pc.red('Error:')} Could not find stats-cache.json`);
        console.error();
        console.error(pc.dim('  Claude Code stores usage data in ~/.claude/stats-cache.json'));
        console.error(pc.dim('  Make sure you have used Claude Code at least once.'));
        console.error();
        process.exit(1);
    }
    const teamConfigs = loadTeamConfigs();
    step('Scanning session history');
    const featureUsage = await loadFeatureUsage();
    // ─── Step 2: Compute stats ───
    step('Computing stats');
    const stats = computeWrappedStats(statsCache, teamConfigs, {
        from: options.from,
        to: options.to,
        featureUsage,
    });
    // ─── Step 3: Print summary ───
    console.log();
    console.log(pc.bold(`  Your Stats  ${pc.cyan(stats.periodLabel)}`));
    console.log(pc.dim(`  ${'─'.repeat(40)}`));
    const fmt = options.compact ? formatCompact : formatNumber;
    const peakDateLabel = formatDate(new Date(stats.peakDay.date), 'MMM d');
    const topModelName = stats.topModels[0]?.displayName ?? 'N/A';
    const rows = [
        ['Messages', fmt(stats.totalMessages)],
        ['Sessions', fmt(stats.totalSessions)],
        ['Tool Calls', fmt(stats.totalToolCalls)],
        ['Active Days', `${stats.activeDays} / ${stats.totalDays} days`],
        ['Peak Day', `${peakDateLabel} (${fmt(stats.peakDay.messageCount)} msgs)`],
        ['Top Model', topModelName],
    ];
    for (const [label, value] of rows) {
        console.log(`  ${pc.dim(label.padEnd(14))}${pc.bold(value)}`);
    }
    console.log();
    // ─── Step 4: Render image ───
    step('Rendering image');
    const imageBuffer = await renderWrapped(stats, {
        theme: options.theme,
        username: options.username,
        compact: options.compact,
    });
    // ─── Step 5: Save ───
    const outputPath = path.resolve(options.output);
    fs.writeFileSync(outputPath, imageBuffer);
    console.log();
    console.log(pc.green(`  Done!  ${pc.bold(options.output)}`));
    console.log(pc.dim(`  Theme: ${options.theme} · ${imageBuffer.length > 1_000_000 ? `${(imageBuffer.length / 1_000_000).toFixed(1)}MB` : `${Math.round(imageBuffer.length / 1024)}KB`}`));
    console.log();
}
function step(label) {
    console.log(`  ${pc.dim('›')} ${label}...`);
}
main().catch((err) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error();
    console.error(`  ${pc.red('Error:')} ${message}`);
    console.error();
    process.exit(1);
});
//# sourceMappingURL=index.js.map