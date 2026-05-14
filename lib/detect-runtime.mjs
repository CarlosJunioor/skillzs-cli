import { access, constants } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Inspect the host filesystem + env to figure out which AI runtime is
 * installed. Returns one of "claude" | "codex" | "cursor" | null. The CLI uses
 * this to choose a default install path; callers can override with `--runtime`
 * or `--dir` and skip detection entirely.
 *
 * Detection order:
 *   1. CLAUDE_PROJECT_DIR env var (set by Claude Code on every invocation)
 *   2. ~/.claude exists
 *   3. ~/.codex exists
 *   4. ~/.cursor exists
 *
 * The function never throws; missing dirs just shift detection to the next
 * step.
 */
export async function detectRuntime({ env = process.env, home = homedir() } = {}) {
  if (env.CLAUDE_PROJECT_DIR) return "claude";
  if (await exists(join(home, ".claude"))) return "claude";
  if (await exists(join(home, ".codex"))) return "codex";
  if (await exists(join(home, ".cursor"))) return "cursor";
  return null;
}

export function runtimeRoot(runtime, home = homedir()) {
  switch (runtime) {
    case "claude": return join(home, ".claude");
    case "codex":  return join(home, ".codex");
    case "cursor": return join(home, ".cursor");
    default: throw new Error(`unknown runtime: ${runtime}`);
  }
}

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
