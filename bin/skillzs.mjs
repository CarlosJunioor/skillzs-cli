#!/usr/bin/env node
// Entry point for the `skillzs` CLI. Keep this file tiny — argument dispatch
// only. All real work lives in lib/*.

import { install } from "../lib/install.mjs";
import { kleur } from "../lib/kleur.mjs";

const VERSION = "0.1.0";
const argv = process.argv.slice(2);

if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
  printHelp();
  process.exit(0);
}

if (argv[0] === "--version" || argv[0] === "-v") {
  process.stdout.write(`${VERSION}\n`);
  process.exit(0);
}

if (argv[0] === "install") {
  if (!argv[1]) {
    process.stderr.write(kleur.red("error:") + " missing <slug>\n");
    process.stderr.write("usage: skillzs install <slug>\n");
    process.exit(2);
  }
  install(argv[1], parseOptions(argv.slice(2)))
    .then((res) => {
      process.stdout.write(
        `${kleur.green("✓ Installed")} ${res.slug} → ${res.path}\n`,
      );
      process.stdout.write(`  Reload your agent to use it.\n`);
      process.exit(0);
    })
    .catch((err) => {
      process.stderr.write(kleur.red("error:") + " " + err.message + "\n");
      process.exit(1);
    });
} else {
  process.stderr.write(kleur.red("error:") + " unknown command \"" + argv[0] + "\"\n");
  printHelp();
  process.exit(2);
}

function parseOptions(rest) {
  const opts = {};
  for (let i = 0; i < rest.length; i++) {
    const token = rest[i];
    if (token === "--runtime") {
      opts.runtime = rest[++i];
    } else if (token === "--registry") {
      opts.registryBaseUrl = rest[++i];
    } else if (token === "--dir") {
      opts.targetDir = rest[++i];
    } else if (token === "--force") {
      opts.force = true;
    }
  }
  return opts;
}

function printHelp() {
  process.stdout.write([
    "skillzs " + VERSION,
    "  install skillZs catalog entries into your AI runtime.",
    "",
    "usage:",
    "  skillzs install <slug>             install one skill",
    "  skillzs --version                  print version",
    "",
    "options:",
    "  --runtime <claude|codex|cursor>    override detection",
    "  --dir <path>                       write to this dir instead",
    "  --registry <url>                   override https://skillzs.dev",
    "  --force                            overwrite if SKILL.md already exists",
    "",
  ].join("\n"));
}
