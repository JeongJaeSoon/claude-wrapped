import { formatCompact } from '../utils/format.js';
import { FONT } from './components.js';
/**
 * Draw a time-series line chart showing daily token usage per model.
 * Inspired by the Hive dashboard's multi-line model usage graphs.
 *
 * Layout:
 *   - Section title "TOKEN USAGE"
 *   - Legend row (colored dots + model names)
 *   - Chart area with Y-axis labels, grid lines, and colored lines
 *   - X-axis date labels
 */
export function drawTokenChart(ctx, theme, x, y, w, h, data, modelNames) {
    if (data.length === 0)
        return;
    // Include "Other" in display if present in any data point
    const hasOther = data.some((d) => (d.tokensByModel['Other'] ?? 0) > 0);
    const allModels = hasOther ? [...modelNames, 'Other'] : [...modelNames];
    // Section title
    ctx.fillStyle = theme.text.secondary;
    ctx.font = `28px ${FONT}`;
    ctx.textBaseline = 'top';
    ctx.fillText('TOKEN USAGE', x, y);
    // Legend
    const legendY = y + 40;
    let legendX = x;
    for (let i = 0; i < allModels.length; i++) {
        const color = theme.chart.lines[i % theme.chart.lines.length];
        // Colored dot
        ctx.beginPath();
        ctx.arc(legendX + 8, legendY + 10, 6, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        // Model name
        ctx.fillStyle = theme.text.secondary;
        ctx.font = `22px ${FONT}`;
        ctx.textBaseline = 'top';
        const label = allModels[i];
        ctx.fillText(label, legendX + 20, legendY);
        legendX += ctx.measureText(label).width + 50;
    }
    // Chart dimensions
    const chartX = x + 80; // space for Y-axis labels
    const chartY = legendY + 36;
    const chartW = w - 80;
    const chartH = h - (chartY - y) - 40; // space for X-axis labels
    // Compute max token value across all days and models
    let maxTokens = 0;
    for (const point of data) {
        for (const tokens of Object.values(point.tokensByModel)) {
            if (tokens > maxTokens)
                maxTokens = tokens;
        }
    }
    if (maxTokens === 0)
        maxTokens = 1;
    // Round up max to a nice number for grid
    const niceMax = computeNiceMax(maxTokens);
    // Draw grid lines (4 horizontal lines)
    const gridLines = 4;
    ctx.strokeStyle = theme.divider;
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridLines; i++) {
        const gy = chartY + chartH - (i / gridLines) * chartH;
        // Grid line
        ctx.beginPath();
        ctx.moveTo(chartX, gy);
        ctx.lineTo(chartX + chartW, gy);
        ctx.stroke();
        // Y-axis label
        const value = (i / gridLines) * niceMax;
        ctx.fillStyle = theme.text.muted;
        ctx.font = `18px ${FONT}`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'right';
        ctx.fillText(formatCompact(Math.round(value)), chartX - 10, gy);
    }
    ctx.textAlign = 'left'; // reset
    // Draw lines for each model
    const pointSpacing = data.length > 1 ? chartW / (data.length - 1) : 0;
    for (let mi = 0; mi < allModels.length; mi++) {
        const modelName = allModels[mi];
        const color = theme.chart.lines[mi % theme.chart.lines.length];
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        let hasStarted = false;
        for (let di = 0; di < data.length; di++) {
            const tokens = data[di].tokensByModel[modelName] ?? 0;
            const px = chartX + di * pointSpacing;
            const py = chartY + chartH - (tokens / niceMax) * chartH;
            if (!hasStarted) {
                ctx.moveTo(px, py);
                hasStarted = true;
            }
            else {
                ctx.lineTo(px, py);
            }
        }
        ctx.stroke();
        // Draw small dots on data points (only if not too many)
        if (data.length <= 60) {
            ctx.fillStyle = color;
            for (let di = 0; di < data.length; di++) {
                const tokens = data[di].tokensByModel[modelName] ?? 0;
                if (tokens === 0)
                    continue;
                const px = chartX + di * pointSpacing;
                const py = chartY + chartH - (tokens / niceMax) * chartH;
                ctx.beginPath();
                ctx.arc(px, py, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    // X-axis date labels (show ~6 evenly spaced labels)
    const labelCount = Math.min(6, data.length);
    ctx.fillStyle = theme.text.muted;
    ctx.font = `18px ${FONT}`;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';
    for (let i = 0; i < labelCount; i++) {
        const di = Math.round(i * (data.length - 1) / Math.max(labelCount - 1, 1));
        const dateStr = data[di].date;
        // Format as "M/D"
        const [, month, day] = dateStr.split('-');
        const label = `${parseInt(month)}/${parseInt(day)}`;
        const px = chartX + di * pointSpacing;
        ctx.fillText(label, px, chartY + chartH + 8);
    }
    ctx.textAlign = 'left'; // reset
}
/**
 * Round up to a "nice" number for chart Y-axis maximum.
 * E.g., 13400 → 15000, 890000 → 1000000
 */
function computeNiceMax(value) {
    if (value <= 0)
        return 1;
    const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
    const normalized = value / magnitude;
    let nice;
    if (normalized <= 1.5)
        nice = 1.5;
    else if (normalized <= 2)
        nice = 2;
    else if (normalized <= 3)
        nice = 3;
    else if (normalized <= 5)
        nice = 5;
    else if (normalized <= 7.5)
        nice = 7.5;
    else
        nice = 10;
    return nice * magnitude;
}
//# sourceMappingURL=tokenChart.js.map