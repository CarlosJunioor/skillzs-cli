import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detectRuntime, runtimeRoot } from "../lib/detect-runtime.mjs";

async function withTempHome(prefix, runtimes) {
  const home = await mkdtemp(join(tmpdir(), prefix));
  for (const r of runtimes) {
    await mkdir(join(home, `.${r}`), { recursive: true });
  }
  return home;
}

describe("detectRuntime", () => {
  it("prefers CLAUDE_PROJECT_DIR env var", async () => {
    const home = await withTempHome("skillzs-detect-", []);
    try {
      const result = await detectRuntime({
        env: { CLAUDE_PROJECT_DIR: "/whatever" },
        home,
      });
      assert.equal(result, "claude");
    } finally {
      await rm(home, { recursive: true, force: true });
    }
  });

  it("falls back to ~/.claude when env is empty", async () => {
    const home = await withTempHome("skillzs-detect-", ["claude"]);
    try {
      const result = await detectRuntime({ env: {}, home });
      assert.equal(result, "claude");
    } finally {
      await rm(home, { recursive: true, force: true });
    }
  });

  it("falls back to codex when only ~/.codex exists", async () => {
    const home = await withTempHome("skillzs-detect-", ["codex"]);
    try {
      const result = await detectRuntime({ env: {}, home });
      assert.equal(result, "codex");
    } finally {
      await rm(home, { recursive: true, force: true });
    }
  });

  it("falls back to cursor when only ~/.cursor exists", async () => {
    const home = await withTempHome("skillzs-detect-", ["cursor"]);
    try {
      const result = await detectRuntime({ env: {}, home });
      assert.equal(result, "cursor");
    } finally {
      await rm(home, { recursive: true, force: true });
    }
  });

  it("returns null when nothing matches", async () => {
    const home = await withTempHome("skillzs-detect-", []);
    try {
      const result = await detectRuntime({ env: {}, home });
      assert.equal(result, null);
    } finally {
      await rm(home, { recursive: true, force: true });
    }
  });
});

describe("runtimeRoot", () => {
  it("maps known runtimes to ~/.<runtime>", () => {
    assert.equal(runtimeRoot("claude", "/h"), join("/h", ".claude"));
    assert.equal(runtimeRoot("codex", "/h"), join("/h", ".codex"));
    assert.equal(runtimeRoot("cursor", "/h"), join("/h", ".cursor"));
  });

  it("throws on unknown runtimes", () => {
    assert.throws(() => runtimeRoot("vim", "/h"), /unknown runtime/);
  });
});
