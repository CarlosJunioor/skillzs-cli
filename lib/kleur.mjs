// Minimal ANSI color helpers. Avoids pulling in `kleur` as a dep so the CLI
// stays zero-dependency. Set NO_COLOR=1 to disable.

const enabled = !process.env.NO_COLOR && process.stdout.isTTY !== false;
const wrap = (code) => (s) => (enabled ? `[${code}m${s}[0m` : String(s));

export const kleur = {
  red: wrap(31),
  green: wrap(32),
  yellow: wrap(33),
  cyan: wrap(36),
  dim: wrap(2),
};
