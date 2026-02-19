import type { SKRSContext2D } from '@napi-rs/canvas';
import type { Theme, ModelRanking, FeatureRanking } from '../types.js';
export declare const FONT = "\"Segoe UI\", \"Helvetica Neue\", Arial, sans-serif";
export declare function drawRoundedRect(ctx: SKRSContext2D, x: number, y: number, w: number, h: number, radius: number, fill?: string, stroke?: string): void;
export declare function drawHeader(ctx: SKRSContext2D, theme: Theme, x: number, y: number, username: string, periodLabel: string): void;
interface StatBlockOptions {
    compact?: boolean;
}
export declare function drawStatBlock(ctx: SKRSContext2D, theme: Theme, x: number, y: number, label: string, value: string, options?: StatBlockOptions): void;
interface StatGridOptions {
    compact?: boolean;
}
export declare function drawStatGrid(ctx: SKRSContext2D, theme: Theme, x: number, y: number, stats: Array<{
    label: string;
    value: string;
}>, options?: StatGridOptions): void;
export declare function drawSectionTitle(ctx: SKRSContext2D, theme: Theme, x: number, y: number, text: string): void;
export declare function drawModelRanking(ctx: SKRSContext2D, theme: Theme, x: number, y: number, models: ModelRanking[]): void;
export declare function drawHourlyChart(ctx: SKRSContext2D, theme: Theme, x: number, y: number, w: number, h: number, distribution: number[]): void;
export declare function drawFeatureColumns(ctx: SKRSContext2D, theme: Theme, x: number, y: number, w: number, columns: Array<{
    title: string;
    items: FeatureRanking[];
}>): void;
export declare function drawFooter(ctx: SKRSContext2D, theme: Theme, x: number, y: number, w: number): void;
export {};
