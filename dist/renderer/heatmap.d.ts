import type { SKRSContext2D } from '@napi-rs/canvas';
import type { Theme } from '../types.js';
interface DayEntry {
    date: string;
    messageCount: number;
    sessionCount: number;
    toolCallCount: number;
    intensity: number;
}
/**
 * Draw a GitHub-style activity heatmap that always shows 52 weeks.
 * endDate defaults to today; the grid extends 52 weeks back from endDate.
 */
export declare function drawHeatmap(ctx: SKRSContext2D, theme: Theme, x: number, y: number, w: number, h: number, dailyActivity: DayEntry[], endDate?: string): void;
export {};
