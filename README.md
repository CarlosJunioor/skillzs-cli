# skillzs

> Install [skillZs](https://skillzs.dev) catalog entries into Claude Code, Codex, or Cursor with one command.

```bash
npx github:CarlosJunioor/skillzs-cli install pr-review
```

skillzs detects your AI runtime (`~/.claude`, `~/.codex`, `~/.cursor`) and writes the skill's `SKILL.md` into its `skills/<slug>/` directory. Reload your runtime and the skill is live.

## Install

No global install needed — every command runs through `npx`:

```bash
npx github:CarlosJunioor/skillzs-cli install <slug>
```

## Commands

```text
install <slug>             install one skill
--version                  print version
--help                     print help
```

### `install` options

| Flag | Description |
|---|---|
| `--runtime <claude\|codex\|cursor>` | Override auto-detection. |
| `--dir <path>`                      | Write to an explicit directory; useful for project-local skill stores. |
| `--registry <url>`                  | Override the default `https://skillzs.dev` registry. |
| `--force`                           | Overwrite an existing `SKILL.md` for this slug. |

## How runtime detection works

1. `CLAUDE_PROJECT_DIR` env var present → Claude Code.
2. `~/.claude/` exists → Claude Code.
3. `~/.codex/` exists → Codex CLI.
4. `~/.cursor/` exists → Cursor.
5. None of the above → the CLI bails and asks for `--runtime` or `--dir`.

## Security

- Reads the manifest from the public skillZs API (`https://skillzs.dev/api/raw/<slug>`).
- Verifies the body against `sha256` advertised by the registry. If the checksum doesn't match, the partial file is deleted and the install aborts.
- Zero runtime dependencies (`node:` modules only). Node 18.17+.

## Telemetry

None. The CLI does not phone home. The web app records an anonymous install-click counter when you copy a command in the browser; the CLI itself sends nothing.

## License

MIT.
