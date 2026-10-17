import test from "node:test";
import assert from "node:assert/strict";
import {
  APP_DIR,
  assertLocalTarget,
  assertIsolatedEvidence,
} from "../scripts/first-seller/isolation.mjs";
const target = {
  projectId: "bf-first-seller",
  apiUrl: "http://127.0.0.1:55321",
  dbUrl: "postgresql://postgres:local-test@127.0.0.1:55322/postgres",
};
const evidence = {
  ...target,
  anonKey: "local-anon",
  serviceKey: "local-service",
  status: {
    API_URL: target.apiUrl,
    DB_URL: target.dbUrl,
    ANON_KEY: "local-anon",
    SERVICE_ROLE_KEY: "local-service",
  },
  containers: [
    {
      name: "supabase_db_bf-first-seller",
      project: "bf-first-seller",
      workdir: APP_DIR,
      ports: [55322],
      ips: ["172.18.0.2"],
    },
    {
      name: "supabase_kong_bf-first-seller",
      project: "bf-first-seller",
      workdir: APP_DIR,
      ports: [55321],
      ips: ["172.18.0.3"],
    },
  ],
  database: {
    name: "postgres",
    serverAddress: "172.18.0.2",
    nonTestUsers: 0,
    nonTestListings: 0,
  },
};
test("fixtures accept only the dedicated local stack with corroborating Docker, key and database evidence", () => {
  assert.doesNotThrow(() => assertLocalTarget(target));
  assert.doesNotThrow(() => assertIsolatedEvidence(evidence));
});
test("fixtures reject production project, remote hosts, URL aliases and alternate ports before any connection", () => {
  for (const change of [
    { projectId: "rrymtjzsekmjplyuoqef" },
    { apiUrl: "https://rrymtjzsekmjplyuoqef.supabase.co" },
    { apiUrl: "http://localhost:55321" },
    { apiUrl: "http://127.0.0.1:54321" },
    { apiUrl: "http://127.0.0.1:55321/?project=rrymtjzsekmjplyuoqef" },
    {
      dbUrl:
        "postgresql://postgres:test@db.rrymtjzsekmjplyuoqef.supabase.co:5432/postgres",
    },
    { dbUrl: "postgresql://postgres:test@127.0.0.1:55322/production" },
  ])
    assert.throws(
      () => assertLocalTarget({ ...target, ...change }),
      /Isolation/,
    );
});
test("an isolation flag cannot replace actual container, key and empty/test-only database evidence", () => {
  for (const change of [
    { status: { ...evidence.status, ANON_KEY: "different" } },
    { containers: [] },
    {
      containers: [
        { ...evidence.containers[0], project: "another-project" },
        evidence.containers[1],
      ],
    },
    { database: { ...evidence.database, serverAddress: "198.51.100.1" } },
    { database: { ...evidence.database, nonTestUsers: 1 } },
    { database: { ...evidence.database, nonTestListings: 1 } },
  ])
    assert.throws(
      () => assertIsolatedEvidence({ ...evidence, ...change }),
      /Isolation/,
    );
});
test("fixture loader refuses caller-created environment objects before any mutation", async () => {
  const {
    actor,
    configureTestPolicies,
    sellerApplication,
    draftListing,
    approvedSeller,
  } = await import("../scripts/first-seller/fixtures.mjs");
  let touched = false;
  const fake = {
    client: () => {
      touched = true;
      throw Error("unsafe");
    },
    connect: () => {
      touched = true;
      throw Error("unsafe");
    },
  };
  await assert.rejects(actor(fake), /Isolation/);
  await assert.rejects(configureTestPolicies(fake), /Isolation/);
  await assert.rejects(sellerApplication(fake), /Isolation/);
  await assert.rejects(draftListing(fake), /Isolation/);
  await assert.rejects(approvedSeller(fake, fake), /Isolation/);
  assert.equal(touched, false);
});
