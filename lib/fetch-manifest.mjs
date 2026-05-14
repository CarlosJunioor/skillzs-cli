// Pulls the public skillZs manifest for a slug. The server response format is
// defined by app/api/raw/[slug]/route.ts in the skillZs Next.js app.

const DEFAULT_BASE = "https://skillzs.dev";
const VALID_SLUG = /^[a-z0-9][a-z0-9-]{0,119}$/;

export async function fetchManifest(slug, { baseUrl = DEFAULT_BASE, fetchImpl = globalThis.fetch } = {}) {
  if (!VALID_SLUG.test(slug)) {
    throw new Error(`invalid slug: "${slug}" (lowercase alphanumeric + hyphen)`);
  }
  const url = `${baseUrl.replace(/\/$/, "")}/api/raw/${encodeURIComponent(slug)}`;
  const res = await fetchImpl(url, {
    headers: { "User-Agent": "skillzs-cli/0.1" },
  });

  if (res.status === 404) throw new Error(`skill "${slug}" not found`);
  if (res.status === 410) throw new Error(`skill "${slug}" was unpublished`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`registry ${res.status}: ${body.slice(0, 200)}`);
  }

  const json = await res.json();
  if (
    typeof json !== "object" || json === null ||
    typeof json.slug !== "string" ||
    typeof json.skill_md !== "string" ||
    typeof json.checksum !== "string"
  ) {
    throw new Error("registry returned malformed manifest");
  }
  return json;
}
