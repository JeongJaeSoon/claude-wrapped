# claude-wrapped

Generate beautiful Wrapped-style summaries of your Claude Code usage.

Reads `~/.claude/stats-cache.json` and session history to produce a shareable PNG image with:

- Usage stats (messages, sessions, tool calls, active days)
- GitHub-style activity heatmap (52 weeks)
- Model usage ranking + donut chart
- Hourly activity distribution
- Daily token usage line chart (per model)
- Fun facts (late-night coding ratio, messages per session, etc.)
- Most used features (tools, sub-agents, skills)

## Requirements

- **Node.js 18+**
- **Claude Code** installed and used at least once (generates `~/.claude/stats-cache.json`)

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Run
node dist/index.js
```

The generated image is saved to `./claude-wrapped.png` by default.

## Installation (global)

```bash
# From this directory
npm link

# Now you can run from anywhere
claude-wrapped
claude-wrapped --help
```

## Usage

```
claude-wrapped [options]
```

### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--theme <theme>` | `-t` | Color theme: `dark` or `light` | `dark` |
| `--output <path>` | `-o` | Output PNG file path | `./claude-wrapped.png` |
| `--from <date>` | `-f` | Start date (YYYY-MM-DD) | all data |
| `--to <date>` | `-T` | End date (YYYY-MM-DD) | all data |
| `--username <name>` | `-u` | Display name on image | OS username |
| `--compact` | `-c` | Compact numbers (1000 → 1K) | off |
| `--version` | `-V` | Show version | |
| `--help` | `-h` | Show help | |

### Date Range Rules

| Input | Behavior |
|-------|----------|
| Neither | Uses all available data |
| `--from` only | from → today |
| `--to` only | (to − 365 days) → to |
| Both | from → to (max 365 days) |

### Examples

```bash
# Dark theme, all-time stats
claude-wrapped

# Light theme
claude-wrapped -t light

# January 2026 only
claude-wrapped -f 2026-01-01 -T 2026-01-31

# From Feb 1 to today
claude-wrapped -f 2026-02-01

# Custom display name and output path
claude-wrapped -u "My Team" -o ~/Desktop/wrapped.png

# Compact number format
claude-wrapped -c
```

## Development

```bash
# Install dependencies
npm install

# Build (one-time)
npm run build

# Watch mode (auto-rebuild on changes)
npm run dev

# Run after build
npm start
# or
node dist/index.js [options]
```

### Project Structure

```
src/
├── index.ts              # CLI entry point
├── cli.ts                # Argument parsing & validation
├── types.ts              # Shared TypeScript interfaces
├── data/
│   ├── parser.ts         # Load stats-cache.json, teams, session JSONL
│   └── stats.ts          # Compute WrappedStats from raw data
├── renderer/
│   ├── index.ts          # Main render orchestrator (layout)
│   ├── themes.ts         # Dark & light theme definitions
│   ├── components.ts     # Reusable drawing primitives
│   ├── heatmap.ts        # GitHub-style activity heatmap
│   ├── donut.ts          # Model share donut chart
│   └── tokenChart.ts     # Daily token usage line chart
└── utils/
    └── format.ts         # Number/date/model name formatting
```

## Data Sources

| Source | Contents |
|--------|----------|
| `~/.claude/stats-cache.json` | Daily activity, model tokens, hourly counts, session stats |
| `~/.claude/teams/*/config.json` | Team creation history, member counts |
| `~/.claude/projects/*/*.jsonl` | Session logs (tool calls, sub-agents, skills) |

## License

MIT
