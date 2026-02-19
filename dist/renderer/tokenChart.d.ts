import type { SKRSContext2D } from '@napi-rs/canvas';
import type { Theme, DailyTokenChartPoint } from '../types.js';
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
export declare function drawTokenChart(ctx: SKRSContext2D, theme: Theme, x: number, y: number, w: number, h: number, data: DailyTokenChartPoint[], modelNames: string[]): void;
