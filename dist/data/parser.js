import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as readline from 'node:readline';
/**
 * Return the path to the ~/.claude directory.
 */
export function getClaudeDir() {
    return path.join(os.homedir(), '.claude');
}
/**
 * Load and parse ~/.claude/stats-cache.json.
 * Returns null if the file doesn't exist or is invalid.
 */
export function loadStatsCache(claudeDir) {
    const dir = claudeDir ?? getClaudeDir();
    const filePath = path.join(dir, 'stats-cache.json');
    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
/**
 * Load all team configs from ~/.claude/teams/{team}/config.json.
 * Skips teams whose config is missing or invalid.
 */
export function loadTeamConfigs(claudeDir) {
    const dir = claudeDir ?? getClaudeDir();
    const teamsDir = path.join(dir, 'teams');
    const configs = [];
    let entries;
    try {
        entries = fs.readdirSync(teamsDir);
    }
    catch {
        return configs;
    }
    for (const entry of entries) {
        const configPath = path.join(teamsDir, entry, 'config.json');
        try {
            const raw = fs.readFileSync(configPath, 'utf-8');
            const config = JSON.parse(raw);
            configs.push(config);
        }
        catch {
            // Skip teams without valid config
        }
    }
    return configs;
}
// Tool names to exclude from the "Top Tools" display (internal/meta tools)
const META_TOOLS = new Set([
    'TodoWrite', 'TodoRead', 'TaskCreate', 'TaskUpdate', 'TaskGet', 'TaskList',
    'TaskOutput', 'TaskStop', 'SendMessage', 'TeamCreate', 'TeamDelete',
    'ExitPlanMode', 'EnterPlanMode', 'AskUserQuestion', 'ListMcpResourcesTool',
    'ReadMcpResourceTool', 'ToolSearch',
]);
/**
 * Scan all session JSONL files in ~/.claude/projects/ to extract feature usage.
 * Extracts: tool calls, sub-agent types, skill invocations.
 */
export async function loadFeatureUsage(claudeDir) {
    const dir = claudeDir ?? getClaudeDir();
    const projectsDir = path.join(dir, 'projects');
    const toolCounts = new Map();
    const subAgentCounts = new Map();
    const skillCounts = new Map();
    let projectEntries;
    try {
        projectEntries = fs.readdirSync(projectsDir);
    }
    catch {
        return buildFeatureUsage(toolCounts, subAgentCounts, skillCounts);
    }
    for (const project of projectEntries) {
        const projectPath = path.join(projectsDir, project);
        let stat;
        try {
            stat = fs.statSync(projectPath);
        }
        catch {
            continue;
        }
        if (!stat.isDirectory())
            continue;
        let files;
        try {
            files = fs.readdirSync(projectPath).filter(f => f.endsWith('.jsonl'));
        }
        catch {
            continue;
        }
        for (const file of files) {
            await parseSessionFile(path.join(projectPath, file), toolCounts, subAgentCounts, skillCounts);
        }
    }
    return buildFeatureUsage(toolCounts, subAgentCounts, skillCounts);
}
async function parseSessionFile(filePath, toolCounts, subAgentCounts, skillCounts) {
    let fileStream;
    try {
        fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
    }
    catch {
        return;
    }
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    for await (const line of rl) {
        // Quick string check to avoid parsing irrelevant lines
        if (!line.includes('tool_use'))
            continue;
        try {
            const obj = JSON.parse(line);
            extractToolCalls(obj, toolCounts, subAgentCounts, skillCounts);
        }
        catch {
            // Skip malformed lines
        }
    }
}
function extractToolCalls(obj, toolCounts, subAgentCounts, skillCounts) {
    // Session JSONL format: {"message":{"content":[{"type":"tool_use","name":"Read",...}]}}
    const content = obj?.message?.content;
    if (!Array.isArray(content))
        return;
    for (const block of content) {
        if (block.type !== 'tool_use' || !block.name)
            continue;
        const toolName = block.name;
        toolCounts.set(toolName, (toolCounts.get(toolName) ?? 0) + 1);
        // Extract sub-agent type from Task tool calls
        if (toolName === 'Task' && block.input?.subagent_type) {
            const agentType = block.input.subagent_type;
            subAgentCounts.set(agentType, (subAgentCounts.get(agentType) ?? 0) + 1);
        }
        // Extract skill name from Skill tool calls
        if (toolName === 'Skill' && block.input?.skill) {
            const skill = block.input.skill;
            skillCounts.set(skill, (skillCounts.get(skill) ?? 0) + 1);
        }
    }
}
function buildFeatureUsage(toolCounts, subAgentCounts, skillCounts) {
    return {
        topTools: buildRanking(toolCounts, 5, META_TOOLS),
        topSubAgents: buildRanking(subAgentCounts, 5),
        topSkills: buildRanking(skillCounts, 5),
    };
}
function buildRanking(counts, limit, exclude) {
    let entries = Array.from(counts.entries());
    if (exclude) {
        entries = entries.filter(([name]) => !exclude.has(name));
    }
    entries.sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((sum, [, count]) => sum + count, 0);
    return entries.slice(0, limit).map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    }));
}
//# sourceMappingURL=parser.js.map