import type { SKRSContext2D } from '@napi-rs/canvas';
import type { Theme, ModelRanking } from '../types.js';
/**
 * Draw a donut chart showing model usage distribution.
 * The circle is sized by available height; the legend sits to the right.
 */
export declare function drawDonutChart(ctx: SKRSContext2D, theme: Theme, x: number, y: number, w: number, h: number, models: ModelRanking[]): void;
