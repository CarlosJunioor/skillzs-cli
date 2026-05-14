import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { mkdtemp, readFile, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { install } from "../lib/install.mjs";

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function makeFetch(payload, status = 200) {
  return async () => new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function withTempDir(prefix) {
  return await mkdtemp(join(tmpdir(), prefix));
}

describe("install", () => {
  it("writes SKILL.md to <targetDir>/skills/<slug>/", async () => {
    const target = await withTempDir("skillzs-install-");
    const origFetch = globalThis.fetch;
    try {
      const skillMd = "# pr-review\nbody";
      globalThis.fetch = makeFetch({
        slug: "pr-review",
        name: "PR Review",
        source_url: "https://github.com/x/y",
        skill_md: skillMd,
        checksum: `sha256:${sha256(skillMd)}`,
      });

      const result = await install("pr-review", {
        targetDir: target,
        registryBaseUrl: "https://example.test",
      });
      assert.equal(result.slug, "pr-review");
      assert.match(result.path, /skills[/\\]pr-review[/\\]SKILL\.md$/);
      const written = await readFile(result.path, "utf8");
      assert.equal(written, skillMd);
    } finally {
      globalThis.fetch = origFetch;
      await rm(target, { recursive: true, force: true });
    }
  });

  it("aborts on checksum mismatch and removes the partial file", async () => {
    const target = await withTempDir("skillzs-install-");
    const origFetch = globalThis.fetch;
    try {
      globalThis.fetch = makeFetch({
        slug: "fail",
        name: "Fail",
        source_url: "https://github.com/x/y",
        skill_md: "real body",
        checksum: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
      });
      await assert.rejects(
        install("fail", { targetDir: target, registryBaseUrl: "https://example.test" }),
        /checksum mismatch/,
      );
      const path = join(target, "skills", "fail", "SKILL.md");
      await assert.rejects(readFile(path), /ENOENT/);
    } finally {
      globalThis.fetch = origFetch;
      await rm(target, { recursive: true, force: true });
    }
  });

  it("refuses to overwrite an existing SKILL.md without --force", async () => {
    const target = await withTempDir("skillzs-install-");
    const origFetch = globalThis.fetch;
    try {
      const skillDir = join(target, "skills", "demo");
      await mkdir(skillDir, { recursive: true });
      await writeFile(join(skillDir, "SKILL.md"), "pre-existing", "utf8");

      globalThis.fetch = makeFetch({
        slug: "demo",
        name: "Demo",
        source_url: "https://github.com/x/y",
        skill_md: "new body",
        checksum: `sha256:${sha256("new body")}`,
      });
      await assert.rejects(
        install("demo", { targetDir: target, registryBaseUrl: "https://example.test" }),
        /already exists/,
      );
    } finally {
      globalThis.fetch = origFetch;
      await rm(target, { recursive: true, force: true });
    }
  });

  it("overwrites with --force when an existing SKILL.md is present", async () => {
    const target = await withTempDir("skillzs-install-");
    const origFetch = globalThis.fetch;
    try {
      const skillDir = join(target, "skills", "demo");
      await mkdir(skillDir, { recursive: true });
      await writeFile(join(skillDir, "SKILL.md"), "old", "utf8");

      globalThis.fetch = makeFetch({
        slug: "demo",
        name: "Demo",
        source_url: "https://github.com/x/y",
        skill_md: "fresh body",
        checksum: `sha256:${sha256("fresh body")}`,
      });
      const result = await install("demo", {
        targetDir: target,
        registryBaseUrl: "https://example.test",
        force: true,
      });
      assert.equal(result.slug, "demo");
      const written = await readFile(result.path, "utf8");
      assert.equal(written, "fresh body");
    } finally {
      globalThis.fetch = origFetch;
      await rm(target, { recursive: true, force: true });
    }
  });

  it("respects an explicit --runtime override", async () => {
    const target = await withTempDir("skillzs-install-");
    const origFetch = globalThis.fetch;
    try {
      globalThis.fetch = makeFetch({
        slug: "explicit",
        name: "Explicit",
        source_url: "https://github.com/x/y",
        skill_md: "body",
        checksum: `sha256:${sha256("body")}`,
      });
      const result = await install("explicit", {
        targetDir: target,
        registryBaseUrl: "https://example.test",
      });
      assert.match(result.path, /skills[/\\]explicit[/\\]SKILL\.md$/);
      const written = await readFile(result.path, "utf8");
      assert.equal(written, "body");
    } finally {
      globalThis.fetch = origFetch;
      await rm(target, { recursive: true, force: true });
    }
  });
});
