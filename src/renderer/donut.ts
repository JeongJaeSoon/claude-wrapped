import type { SKRSContext2D } from '@napi-rs/canvas';
import type { Theme, ModelRanking } from '../types.js';
import { FONT } from './components.js';

/**
 * Draw a donut chart showing model usage distribution.
 * The circle is sized by available height; the legend sits to the right.
 */
export function drawDonutChart(
  ctx: SKRSContext2D,
  theme: Theme,
  x: number,
  y: number,
  w: number,
  h: number,
  models: ModelRanking[],
): void {
  if (models.length === 0) return;

  // Section title
  ctx.fillStyle = theme.text.secondary;
  ctx.font = `600 26px ${FONT}`;
  ctx.textBaseline = 'top';
  ctx.fillText('MODEL SHARE', x, y);

  const titleH = 44;
  const chartAreaH = h - titleH;

  // Donut sizing — constrained by height
  const diameter = Math.min(chartAreaH - 8, 240);
  const radius = diameter / 2;
  const innerRadius = radius * 0.56;
  const centerX = x + radius + 10;
  const centerY = y + titleH + chartAreaH / 2;

  // Segments
  const topModels = models.slice(0, 5);
  const otherPct = Math.max(0, 100 - topModels.reduce((s, m) => s + m.percentage, 0));

  const segments: Array<{ label: string; pct: number; color: string }> = topModels.map(
    (m, i) => ({
      label: m.displayName,
      pct: m.percentage,
      color: theme.chart.lines[i % theme.chart.lines.length],
    }),
  );

  if (otherPct > 0.5) {
    segments.push({ label: 'Other', pct: otherPct, color: theme.text.muted });
  }

  // Draw donut arcs
  let currentAngle = -Math.PI / 2;
  for (const seg of segments) {
    const sliceAngle = (seg.pct / 100) * Math.PI * 2;
    if (sliceAngle < 0.01) { currentAngle += sliceAngle; continue; }

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();

    currentAngle += sliceAngle;
  }

  // Center label — top model %
  if (topModels.length > 0) {
    const top = topModels[0];
    ctx.fillStyle = theme.text.primary;
    ctx.font = `bold 32px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${top.percentage.toFixed(0)}%`, centerX, centerY);
    ctx.textAlign = 'left';
  }

  // Legend — to the right of the donut with comfortable gap
  const legendX = centerX + radius + 36;
  const legendRowH = 34;
  const legendStartY = centerY - (segments.length * legendRowH) / 2;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const ly = legendStartY + i * legendRowH;

    // Color dot
    ctx.beginPath();
    ctx.arc(legendX + 6, ly + 9, 6, 0, Math.PI * 2);
    ctx.fillStyle = seg.color;
    ctx.fill();

    // Name
    ctx.fillStyle = theme.text.primary;
    ctx.font = `22px ${FONT}`;
    ctx.textBaseline = 'top';
    const name = seg.label.length > 20 ? seg.label.slice(0, 18) + '..' : seg.label;
    ctx.fillText(name, legendX + 20, ly);

    // Percentage — right-aligned within legend area
    ctx.fillStyle = theme.text.muted;
    ctx.font = `20px ${FONT}`;
    const pctText = `${seg.pct.toFixed(1)}%`;
    const nameWidth = ctx.measureText(name).width;
    ctx.fillText(pctText, legendX + 20 + nameWidth + 10, ly + 2);
  }
}
