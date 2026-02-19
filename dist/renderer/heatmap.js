import { drawRoundedRect, FONT } from './components.js';
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = [[1, 'Mon'], [3, 'Wed'], [5, 'Fri']];
/**
 * Draw a GitHub-style activity heatmap that always shows 52 weeks.
 * endDate defaults to today; the grid extends 52 weeks back from endDate.
 */
export function drawHeatmap(ctx, theme, x, y, w, h, dailyActivity, endDate) {
    // Section label
    ctx.fillStyle = theme.text.secondary;
    ctx.font = `28px ${FONT}`;
    ctx.textBaseline = 'top';
    ctx.fillText('ACTIVITY', x, y);
    // Build activity map for quick lookup
    const activityMap = new Map();
    for (const entry of dailyActivity) {
        activityMap.set(entry.date, entry.intensity);
    }
    // Determine end date (today or specified)
    const end = endDate ? new Date(endDate + 'T00:00:00') : new Date();
    end.setHours(0, 0, 0, 0);
    // Align end to the next Saturday (end of week) for clean grid
    const endDow = end.getDay(); // 0=Sun
    const alignedEnd = new Date(end);
    if (endDow < 6) {
        alignedEnd.setDate(alignedEnd.getDate() + (6 - endDow));
    }
    // Always 52 weeks
    const COLS = 52;
    const ROWS = 7;
    const alignedStart = new Date(alignedEnd);
    alignedStart.setDate(alignedStart.getDate() - (COLS * 7 - 1));
    // Layout calculations
    const dayLabelWidth = 60;
    const monthLabelHeight = 30;
    const gridX = x + dayLabelWidth;
    const gridY = y + 50 + monthLabelHeight;
    const availableW = w - dayLabelWidth;
    const gap = 4;
    const cellSize = Math.floor((availableW - gap * (COLS - 1)) / COLS);
    const effectiveCellSize = Math.max(cellSize, 6);
    // Draw month labels
    ctx.fillStyle = theme.text.muted;
    ctx.font = `20px ${FONT}`;
    ctx.textBaseline = 'top';
    let lastMonthDrawn = -1;
    for (let col = 0; col < COLS; col++) {
        const colDate = new Date(alignedStart);
        colDate.setDate(colDate.getDate() + col * 7);
        const month = colDate.getMonth();
        if (month !== lastMonthDrawn) {
            const lx = gridX + col * (effectiveCellSize + gap);
            ctx.fillText(MONTH_LABELS[month], lx, y + 50);
            lastMonthDrawn = month;
        }
    }
    // Draw day-of-week labels
    ctx.fillStyle = theme.text.muted;
    ctx.font = `18px ${FONT}`;
    ctx.textBaseline = 'middle';
    for (const [row, label] of DAY_LABELS) {
        const ly = gridY + row * (effectiveCellSize + gap) + effectiveCellSize / 2;
        ctx.fillText(label, x, ly);
    }
    // Draw cells — 52 columns × 7 rows
    for (let col = 0; col < COLS; col++) {
        for (let row = 0; row < ROWS; row++) {
            const dayOffset = col * 7 + row;
            const cellDate = new Date(alignedStart);
            cellDate.setDate(cellDate.getDate() + dayOffset);
            // Don't draw future dates
            if (cellDate > end)
                continue;
            const dateKey = cellDate.toISOString().slice(0, 10);
            const intensity = activityMap.get(dateKey) ?? 0;
            const cx = gridX + col * (effectiveCellSize + gap);
            const cy = gridY + row * (effectiveCellSize + gap);
            const color = intensity === 0
                ? theme.heatmap.empty
                : theme.heatmap.levels[Math.min(intensity - 1, 3)];
            drawRoundedRect(ctx, cx, cy, effectiveCellSize, effectiveCellSize, 2, color);
        }
    }
}
//# sourceMappingURL=heatmap.js.map