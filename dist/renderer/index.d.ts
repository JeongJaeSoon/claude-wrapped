import type { WrappedStats } from '../types.js';
interface RenderOptions {
    theme: 'dark' | 'light';
    username?: string;
    compact?: boolean;
}
export declare function renderWrapped(stats: WrappedStats, options: RenderOptions): Promise<Buffer>;
export {};
