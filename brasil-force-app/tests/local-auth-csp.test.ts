import test from "node:test";
import assert from "node:assert/strict";
import { supabaseConnectSources } from "../src/lib/content-security";
test("local Auth browser connections are permitted only for an exact loopback origin in development", () => {
  assert.match(
    supabaseConnectSources("http://127.0.0.1:55321", "development"),
    /http:\/\/127\.0\.0\.1:55321/,
  );
  for (const mode of ["production", "test"])
    assert.ok(
      !supabaseConnectSources("http://127.0.0.1:55321", mode).includes(
        "http://",
      ),
    );
  for (const url of [
    "http://evil.example:55321",
    "http://127.0.0.1:55321/other",
    "http://user:password@127.0.0.1:55321",
    "http://127.0.0.1:55321/?source=evil",
  ])
    assert.ok(!supabaseConnectSources(url, "development").includes("http://"));
  assert.equal(
    supabaseConnectSources(undefined, "production"),
    "https://*.supabase.co wss://*.supabase.co",
  );
});
