import type { SKRSContext2D } from '@napi-rs/canvas';
import type { Theme, ModelRanking, FeatureRanking } from '../types.js';
import { formatHour } from '../utils/format.js';

export const FONT = '"Segoe UI", "Helvetica Neue", Arial, sans-serif';

// ─── Drawing primitives ───

export function drawRoundedRect(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  fill?: string,
  stroke?: string,
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();

  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

// ─── Header ───

export function drawHeader(
  ctx: SKRSContext2D,
  theme: Theme,
  x: number,
  y: number,
  username: string,
  periodLabel: string,
): void {
  // Title — large, primary
  ctx.fillStyle = theme.text.primary;
  ctx.font = `bold 72px ${FONT}`;
  ctx.textBaseline = 'top';
  ctx.fillText('Claude Code Wrapped', x, y);

  // Subtitle — secondary, lighter weight
  ctx.fillStyle = theme.text.secondary;
  ctx.font = `34px ${FONT}`;
  ctx.fillText(`@${username}  ·  ${periodLabel}`, x, y + 90);
}

// ─── Single stat block ───

interface StatBlockOptions {
  compact?: boolean;
}

export function drawStatBlock(
  ctx: SKRSContext2D,
  theme: Theme,
  x: number,
  y: number,
  label: string,
  value: string,
  options?: StatBlockOptions,
): void {
  const compact = options?.compact ?? false;

  // Label — secondary (visible but not dominant)
  ctx.fillStyle = theme.text.secondary;
  ctx.font = `${compact ? 20 : 23}px ${FONT}`;
  ctx.textBaseline = 'top';
  ctx.fillText(label.toUpperCase(), x, y);

  // Value — prominent, primary color (not accent)
  ctx.fillStyle = theme.text.primary;
  ctx.font = `bold ${compact ? 42 : 56}px ${FONT}`;
  ctx.fillText(value, x, y + (compact ? 28 : 34));
}

// ─── 2×N stat grid ───

interface StatGridOptions {
  compact?: boolean;
}

export function drawStatGrid(
  ctx: SKRSContext2D,
  theme: Theme,
  x: number,
  y: number,
  stats: Array<{ label: string; value: string }>,
  options?: StatGridOptions,
): void {
  const compact = options?.compact ?? false;
  const colWidth = compact ? 430 : 460;
  const rowHeight = compact ? 110 : 130;

  stats.forEach((stat, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    drawStatBlock(
      ctx,
      theme,
      x + col * colWidth,
      y + row * rowHeight,
      stat.label,
      stat.value,
      { compact },
    );
  });
}

// ─── Section title helper ───

export function drawSectionTitle(
  ctx: SKRSContext2D,
  theme: Theme,
  x: number,
  y: number,
  text: string,
): void {
  ctx.fillStyle = theme.text.secondary;
  ctx.font = `600 26px ${FONT}`;
  ctx.textBaseline = 'top';
  ctx.fillText(text, x, y);
}

// ─── Model ranking list ───

export function drawModelRanking(
  ctx: SKRSContext2D,
  theme: Theme,
  x: number,
  y: number,
  models: ModelRanking[],
): void {
  drawSectionTitle(ctx, theme, x, y, 'TOP MODELS');

  const barMaxWidth = 400;
  const rowHeight = 72;
  const startY = y + 46;

  models.slice(0, 3).forEach((model, i) => {
    const ry = startY + i * rowHeight;

    // Rank number — muted
    ctx.fillStyle = theme.text.muted;
    ctx.font = `bold 30px ${FONT}`;
    ctx.textBaseline = 'top';
    ctx.fillText(`${i + 1}`, x, ry);

    // Model name — primary
    ctx.fillStyle = theme.text.primary;
    ctx.font = `28px ${FONT}`;
    ctx.fillText(model.displayName, x + 40, ry);

    // Percentage text — secondary
    const pctText = `${model.percentage.toFixed(1)}%`;
    ctx.fillStyle = theme.text.secondary;
    ctx.font = `24px ${FONT}`;
    ctx.fillText(pctText, x + barMaxWidth + 60, ry + 38);

    // Background bar
    const barY = ry + 36;
    drawRoundedRect(ctx, x + 40, barY, barMaxWidth, 14, 7, theme.chart.barMuted);

    // Filled bar — accent color
    const filledWidth = Math.max(14, (model.percentage / 100) * barMaxWidth);
    drawRoundedRect(ctx, x + 40, barY, filledWidth, 14, 7, theme.chart.bar);
  });
}

// ─── Hourly activity bar chart ───

export function drawHourlyChart(
  ctx: SKRSContext2D,
  theme: Theme,
  x: number,
  y: number,
  w: number,
  h: number,
  distribution: number[],
): void {
  drawSectionTitle(ctx, theme, x, y, 'HOURLY ACTIVITY');

  const chartY = y + 46;
  const chartH = h - 76;
  const maxVal = Math.max(...distribution, 1);
  const barGap = 4;
  const barWidth = (w - barGap * 23) / 24;

  for (let i = 0; i < 24; i++) {
    const bx = x + i * (barWidth + barGap);
    const ratio = distribution[i] / maxVal;
    const barH = Math.max(4, ratio * chartH);

    // Background bar
    drawRoundedRect(ctx, bx, chartY, barWidth, chartH, 4, theme.chart.barMuted);

    // Filled bar from bottom — accent
    drawRoundedRect(ctx, bx, chartY + chartH - barH, barWidth, barH, 4, theme.chart.bar);
  }

  // Hour labels (every 6 hours)
  ctx.fillStyle = theme.text.muted;
  ctx.font = `20px ${FONT}`;
  ctx.textBaseline = 'top';
  for (const hr of [0, 6, 12, 18]) {
    const lx = x + hr * (barWidth + barGap);
    ctx.fillText(formatHour(hr), lx, chartY + chartH + 10);
  }
}

// ─── Feature ranking columns ───

export function drawFeatureColumns(
  ctx: SKRSContext2D,
  theme: Theme,
  x: number,
  y: number,
  w: number,
  columns: Array<{ title: string; items: FeatureRanking[] }>,
): void {
  const colCount = columns.filter(c => c.items.length > 0).length;
  if (colCount === 0) return;

  const colWidth = Math.floor(w / colCount);
  let colIndex = 0;

  for (const col of columns) {
    if (col.items.length === 0) continue;

    const cx = x + colIndex * colWidth;

    // Column title — secondary
    ctx.fillStyle = theme.text.secondary;
    ctx.font = `22px ${FONT}`;
    ctx.textBaseline = 'top';
    ctx.fillText(col.title, cx, y);

    // Ranked items
    const maxPct = col.items[0]?.percentage ?? 1;
    const barMaxW = colWidth - 120;

    col.items.slice(0, 3).forEach((item, i) => {
      const iy = y + 34 + i * 52;

      // Rank + name
      ctx.fillStyle = theme.text.muted;
      ctx.font = `bold 24px ${FONT}`;
      ctx.fillText(`${i + 1}`, cx, iy);

      ctx.fillStyle = theme.text.primary;
      ctx.font = `22px ${FONT}`;
      const displayName = item.name.length > 18 ? item.name.slice(0, 16) + '..' : item.name;
      ctx.fillText(displayName, cx + 28, iy);

      // Percentage bar
      const barY = iy + 28;
      const barW = Math.max(8, (item.percentage / Math.max(maxPct, 1)) * barMaxW);
      drawRoundedRect(ctx, cx + 28, barY, barMaxW, 8, 4, theme.chart.barMuted);
      drawRoundedRect(ctx, cx + 28, barY, barW, 8, 4, theme.chart.bar);

      // Percentage text
      ctx.fillStyle = theme.text.muted;
      ctx.font = `18px ${FONT}`;
      ctx.fillText(`${item.percentage.toFixed(1)}%`, cx + barMaxW + 36, iy + 4);
    });

    colIndex++;
  }
}

// ─── Footer ───

export function drawFooter(
  ctx: SKRSContext2D,
  theme: Theme,
  x: number,
  y: number,
  w: number,
): void {
  // Divider line
  ctx.strokeStyle = theme.divider;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();

  // Footer text — muted, centered
  ctx.fillStyle = theme.text.muted;
  ctx.font = `22px ${FONT}`;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';
  ctx.fillText('Generated by claude-wrapped', x + w / 2, y + 18);
  ctx.textAlign = 'left';
}
