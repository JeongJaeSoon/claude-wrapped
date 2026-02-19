import type { StatsCache, TeamConfig, WrappedStats, FeatureUsage } from '../types.js';
interface ComputeOptions {
    from?: string;
    to?: string;
    featureUsage?: FeatureUsage;
}
/**
 * Compute the complete WrappedStats from raw stats cache data and team configs.
 * All date-filterable metrics use the from/to range.
 */
export declare function computeWrappedStats(statsCache: StatsCache, teamConfigs: TeamConfig[], options?: ComputeOptions): WrappedStats;
export {};
