import os from 'node:os';
import { Command } from 'commander';
import { parseDate, differenceInDays, formatDate } from './utils/date.js';
import pc from 'picocolors';
import type { CLIOptions } from './types.js';

export function run(): CLIOptions {
  const program = new Command();

  program
    .name('claude-wrapped')
    .description('Generate beautiful Wrapped-style summaries of your Claude Code usage')
    .version('0.1.0')
    .option('-t, --theme <theme>', 'color theme (dark / light)', 'dark')
    .option('-o, --output <path>', 'output file path', './claude-wrapped.png')
    .option('-f, --from <date>', 'start date (YYYY-MM-DD)')
    .option('-T, --to <date>', 'end date (YYYY-MM-DD)')
    .option('-u, --username <name>', 'display name on the image', os.userInfo().username)
    .option('-c, --compact', 'compact number format (1000 → 1K)')
    .addHelpText('after', `
${pc.bold('Examples:')}
  $ claude-wrapped                            ${pc.dim('# dark theme, all-time stats')}
  $ claude-wrapped -t light                   ${pc.dim('# light theme')}
  $ claude-wrapped -f 2026-01-01              ${pc.dim('# from Jan 1 to today')}
  $ claude-wrapped -f 2026-02-01 -T 2026-02-28  ${pc.dim('# February only')}
  $ claude-wrapped -u "Team Alpha" -o out.png ${pc.dim('# custom name & path')}

${pc.bold('Date range rules:')}
  --from only   →  from ~ today
  --to only     →  (to - 365 days) ~ to
  both          →  from ~ to  (max 365 days)
  neither       →  all available data

${pc.bold('Data source:')}
  Reads ${pc.cyan('~/.claude/stats-cache.json')} and session JSONL files.
  Make sure you've used Claude Code at least once.
`);

  program.parse();
  const opts = program.opts();

  // ── Theme ──
  if (opts.theme !== 'dark' && opts.theme !== 'light') {
    exitWithError(
      `Unknown theme "${opts.theme}"`,
      `Use ${pc.cyan('--theme dark')} or ${pc.cyan('--theme light')}`,
    );
  }

  // ── Dates ──
  const { from, to } = validateAndResolveDates(opts.from, opts.to);

  return {
    theme: opts.theme as 'dark' | 'light',
    output: opts.output,
    from,
    to,
    username: opts.username,
    compact: opts.compact ?? false,
  };
}

// ─── Date validation ───

function validateAndResolveDates(
  rawFrom?: string,
  rawTo?: string,
): { from?: string; to?: string } {
  const today = formatDate(new Date(), 'yyyy-MM-dd');

  const from = rawFrom ? validateDate(rawFrom, '--from') : undefined;
  const to = rawTo ? validateDate(rawTo, '--to') : undefined;

  if (!from && !to) return {};

  let resolvedFrom = from;
  let resolvedTo = to;

  if (resolvedFrom && !resolvedTo) {
    resolvedTo = today;
  } else if (!resolvedFrom && resolvedTo) {
    const autoFrom = new Date(parseDate(resolvedTo));
    autoFrom.setDate(autoFrom.getDate() - 365);
    resolvedFrom = formatDate(autoFrom, 'yyyy-MM-dd');
  }

  if (resolvedFrom! > resolvedTo!) {
    exitWithError(
      `--from (${resolvedFrom}) is after --to (${resolvedTo})`,
      'Swap the two dates or remove one to auto-fill.',
    );
  }

  const span = differenceInDays(parseDate(resolvedTo!), parseDate(resolvedFrom!));
  if (span > 365) {
    exitWithError(
      `Range spans ${span} days`,
      'Maximum is 365 days. Narrow the range.',
    );
  }

  return { from: resolvedFrom, to: resolvedTo };
}

function validateDate(value: string, flag: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    exitWithError(
      `${flag} "${value}" is not in YYYY-MM-DD format`,
      `Example: ${pc.cyan(`${flag} 2026-01-15`)}`,
    );
  }

  const parsed = parseDate(value);
  if (isNaN(parsed.getTime())) {
    exitWithError(`${flag} "${value}" is not a valid date`);
  }

  const roundTrip = formatDate(parsed, 'yyyy-MM-dd');
  if (roundTrip !== value) {
    exitWithError(
      `${flag} "${value}" is not a real calendar date`,
      `Did you mean ${pc.cyan(roundTrip)}?`,
    );
  }

  return value;
}

// ─── Error helper ───

function exitWithError(message: string, hint?: string): never {
  console.error();
  console.error(`  ${pc.red('Error:')} ${message}`);
  if (hint) {
    console.error(`  ${pc.dim(hint)}`);
  }
  console.error();
  process.exit(1);
}
