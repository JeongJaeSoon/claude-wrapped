/**
 * Lightweight date utilities replacing date-fns.
 * Only covers the patterns used in this project.
 */
const MONTHS_SHORT = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
/** Parse "YYYY-MM-DD" into a local Date (avoids UTC offset issues). */
export function parseDate(str) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
}
/** Format a Date using a limited set of patterns. */
export function formatDate(date, pattern) {
    switch (pattern) {
        case 'yyyy-MM-dd': {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }
        case 'MMM yyyy':
            return `${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
        case 'MMM d':
            return `${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}`;
    }
}
/** Number of calendar days between two dates (later - earlier). */
export function differenceInDays(later, earlier) {
    return Math.round((later.getTime() - earlier.getTime()) / 86_400_000);
}
//# sourceMappingURL=date.js.map