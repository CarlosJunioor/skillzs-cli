import { mkdir, writeFile, access, constants, unlink } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { detectRuntime, runtimeRoot } from "./detect-runtime.mjs";
import { fetchManifest } from "./fetch-manifest.mjs";

/**
 * Install a single skill by slug.
 *
 * Steps:
 *   1. Fetch manifest from the skillZs registry.
 *   2. Resolve target directory (--dir > --runtime > auto-detect).
 *   3. Write <target>/skills/<slug>/SKILL.md.
 *   4. Recompute sha256 of the written body and check it matches manifest.checksum.
 *      If not, delete the partial file and abort.
 *
 * Returns { slug, path } on success. Throws on any failure.
 */
export async function install(slug, opts = {}) {
  const manifest = await fetchManifest(slug, { baseUrl: opts.registryBaseUrl });

  const target = await resolveTarget(opts);
  const skillDir = join(target, "skills", manifest.slug);
  const skillFile = join(skillDir, "SKILL.md");

  if (!opts.force && await fileExists(skillFile)) {
    throw new Error(
      `${skillFile} already exists. Pass --force to overwrite.`,
    );
  }

  await mkdir(skillDir, { recursive: true });
  await writeFile(skillFile, manifest.skill_md, "utf8");

  const expected = parseChecksum(manifest.checksum);
  if (expected !== null) {
    const actual = sha256(manifest.skill_md);
    if (expected !== actual) {
      // Clean up the partial install so the user can retry safely.
      try { await unlink(skillFile); } catch {}
      throw new Error(
        `checksum mismatch for ${slug}. registry advertised ${expected.slice(0, 12)}... but body hashed to ${actual.slice(0, 12)}...`,
      );
    }
  }

  return { slug: manifest.slug, path: skillFile };
}

async function resolveTarget(opts) {
  if (opts.targetDir) return opts.targetDir;

  const runtime = opts.runtime ?? (await detectRuntime());
  if (!runtime) {
    throw new Error(
      [
        "no AI runtime detected.",
        "Pass --runtime claude|codex|cursor or --dir <path> to install anyway.",
      ].join("\n"),
    );
  }
  return runtimeRoot(runtime);
}

function parseChecksum(value) {
  if (!value) return null;
  const match = /^sha256:([a-f0-9]{64})$/i.exec(value.trim());
  return match ? match[1].toLowerCase() : null;
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

async function fileExists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
