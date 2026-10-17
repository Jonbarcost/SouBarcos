import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import pg from "pg";
export const APP_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../..",
);
export const PROJECT = "bf-first-seller";
export const API_URL = "http://127.0.0.1:55321";
export const SITE_URL = "http://127.0.0.1:3200";
const fail = () => {
  throw Error("Isolation proof failed; fixtures are forbidden.");
};
export function assertLocalTarget(target) {
  if (target.projectId !== PROJECT || target.apiUrl !== API_URL) fail();
  let db;
  try {
    db = new URL(target.dbUrl);
  } catch {
    fail();
  }
  if (
    db.protocol !== "postgresql:" ||
    db.hostname !== "127.0.0.1" ||
    db.port !== "55322" ||
    db.pathname !== "/postgres" ||
    db.username !== "postgres" ||
    db.search ||
    db.hash
  )
    fail();
  if (JSON.stringify(target).includes("rrymtjzsekmjplyuoqef")) fail();
}
export function assertIsolatedEvidence(e) {
  assertLocalTarget(e);
  if (
    e.status.API_URL !== e.apiUrl ||
    e.status.DB_URL !== e.dbUrl ||
    !e.anonKey ||
    !e.serviceKey ||
    e.status.ANON_KEY !== e.anonKey ||
    e.status.SERVICE_ROLE_KEY !== e.serviceKey
  )
    fail();
  const db = e.containers.find(
    (c) =>
      c.name === `supabase_db_${PROJECT}` &&
      c.project === PROJECT &&
      c.workdir === APP_DIR &&
      c.ports.includes(55322),
  );
  const api = e.containers.find(
    (c) =>
      c.name === `supabase_kong_${PROJECT}` &&
      c.project === PROJECT &&
      c.workdir === APP_DIR &&
      c.ports.includes(55321),
  );
  if (
    !db ||
    !api ||
    e.database.name !== "postgres" ||
    !db.ips.includes(e.database.serverAddress) ||
    Number(e.database.nonTestUsers) !== 0 ||
    Number(e.database.nonTestListings) !== 0
  )
    fail();
}
export function cliEnvironment() {
  return {
    ...process.env,
    SUPABASE_HOME: resolve(APP_DIR, "supabase/.temp/cli-home"),
    SUPABASE_INTERNAL_IMAGE_REGISTRY: "docker.io",
    SUPABASE_USE_SLIM_IMAGES: "true",
    SUPABASE_TELEMETRY_DISABLED: "1",
    SUPABASE_NO_UPDATE_NOTIFIER: "1",
  };
}
export function cli(args) {
  return execFileSync(resolve(APP_DIR, "node_modules/.bin/supabase"), args, {
    cwd: APP_DIR,
    env: cliEnvironment(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 16 * 1024 * 1024,
  });
}
export function assertLocalConfig() {
  const config = readFileSync(resolve(APP_DIR, "supabase/config.toml"), "utf8");
  if (
    !/^project_id\s*=\s*"bf-first-seller"$/m.test(config) ||
    !/^port\s*=\s*55321$/m.test(config) ||
    !/^port\s*=\s*55322$/m.test(config) ||
    config.includes("rrymtjzsekmjplyuoqef")
  )
    fail();
}
export async function proveIsolation() {
  assertLocalConfig();
  const status = JSON.parse(cli(["status", "--output", "json"]));
  const target = {
    projectId: PROJECT,
    apiUrl: status.API_URL,
    dbUrl: status.DB_URL,
  };
  assertLocalTarget(target);
  const inspected = JSON.parse(
    execFileSync(
      "docker",
      [
        "container",
        "inspect",
        `supabase_db_${PROJECT}`,
        `supabase_kong_${PROJECT}`,
      ],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    ),
  );
  const containers = inspected.map((c) => ({
    name: c.Name.replace(/^\//, ""),
    project: c.Config.Labels?.["com.supabase.cli.project"],
    workdir: c.Config.Labels?.["com.supabase.cli.workdir"],
    ports: Object.values(c.NetworkSettings.Ports ?? {}).flatMap((bindings) =>
      (bindings ?? []).map((b) => Number(b.HostPort)),
    ),
    ips: Object.values(c.NetworkSettings.Networks ?? {}).map(
      (n) => n.IPAddress,
    ),
  }));
  const db = new pg.Client({
    connectionString: target.dbUrl,
    connectionTimeoutMillis: 5000,
  });
  await db.connect();
  try {
    const result =
      await db.query(`select current_database() as name,host(inet_server_addr()) as "serverAddress",
   (select count(*) from auth.users where email is null or email !~ '^[a-z0-9-]+@bf-e2e[.]invalid$')::integer as "nonTestUsers",
   (select count(*) from public.bf_listings where title not like 'TESTE — %')::integer as "nonTestListings"`);
    const proof = {
      ...target,
      anonKey: status.ANON_KEY,
      serviceKey: status.SERVICE_ROLE_KEY,
      status,
      containers,
      database: result.rows[0],
    };
    assertIsolatedEvidence(proof);
    return {
      apiUrl: target.apiUrl,
      dbUrl: target.dbUrl,
      anonKey: status.ANON_KEY,
      serviceKey: status.SERVICE_ROLE_KEY,
      mailUrl: "http://127.0.0.1:55324",
      projectId: PROJECT,
    };
  } finally {
    await db.end();
  }
}
