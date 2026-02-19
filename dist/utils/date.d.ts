/**
 * Lightweight date utilities replacing date-fns.
 * Only covers the patterns used in this project.
 */
/** Parse "YYYY-MM-DD" into a local Date (avoids UTC offset issues). */
export declare function parseDate(str: string): Date;
/** Format a Date using a limited set of patterns. */
export declare function formatDate(date: Date, pattern: 'yyyy-MM-dd' | 'MMM yyyy' | 'MMM d'): string;
/** Number of calendar days between two dates (later - earlier). */
export declare function differenceInDays(later: Date, earlier: Date): number;
