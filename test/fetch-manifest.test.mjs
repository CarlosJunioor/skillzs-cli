import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { fetchManifest } from "../lib/fetch-manifest.mjs";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("fetchManifest", () => {
  it("rejects malformed slugs before issuing a request", async () => {
    let called = false;
    await assert.rejects(
      fetchManifest("BAD SLUG", { fetchImpl: () => { called = true; } }),
      /invalid slug/,
    );
    assert.equal(called, false);
  });

  it("returns the parsed manifest on 200", async () => {
    const payload = {
      slug: "pr-review",
      name: "PR Review",
      source_url: "https://github.com/x/y",
      skill_md: "# PR Review\nbody",
      checksum: "sha256:deadbeef",
    };
    const res = await fetchManifest("pr-review", {
      fetchImpl: async () => jsonResponse(payload),
    });
    assert.deepEqual(res, payload);
  });

  it("translates 404 into a friendly error", async () => {
    await assert.rejects(
      fetchManifest("missing", { fetchImpl: async () => new Response("", { status: 404 }) }),
      /not found/,
    );
  });

  it("translates 410 into a friendly error", async () => {
    await assert.rejects(
      fetchManifest("removed", { fetchImpl: async () => new Response("", { status: 410 }) }),
      /unpublished/,
    );
  });

  it("surfaces other non-2xx with status + body snippet", async () => {
    await assert.rejects(
      fetchManifest("any", {
        fetchImpl: async () => new Response("boom", { status: 500 }),
      }),
      /registry 500: boom/,
    );
  });

  it("rejects responses missing required fields", async () => {
    await assert.rejects(
      fetchManifest("any", {
        fetchImpl: async () => jsonResponse({ slug: "any" }),
      }),
      /malformed manifest/,
    );
  });
});
