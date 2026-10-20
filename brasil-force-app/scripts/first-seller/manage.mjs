import { spawn, execFileSync } from "node:child_process";
import { setTimeout as pause } from "node:timers/promises";
import { pathToFileURL } from "node:url";
import { resolve, join } from "node:path";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import {
  APP_DIR,
  PROJECT,
  assertLocalConfig,
  cliEnvironment,
  proveIsolation,
} from "./isolation.mjs";
const cliPath = resolve(APP_DIR, "node_modules/.bin/supabase");
const excluded =
  "studio,realtime,imgproxy,postgres-meta,edge-runtime,logflare,vector,supavisor";
function redact(text) {
  return text
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[REDACTED]")
    .replace(/sb_(?:secret|publishable)_[A-Za-z0-9_-]+/g, "[REDACTED]")
    .replace(/(postgres(?:ql)?:\/\/)[^@\s]+@/g, "$1[REDACTED]@")
    .split("\n")
    .filter(
      (l) => !/(?:secret|password|service.role|anon.key|signing.key)/i.test(l),
    )
    .join("\n");
}
function runCli(args) {
  let output = "";
  const child = spawn(cliPath, args, {
    cwd: APP_DIR,
    env: cliEnvironment(),
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (d) => (output += d));
  child.stderr.on("data", (d) => (output += d));
  const result = new Promise((res, rej) => {
    child.on("error", rej);
    child.on("exit", (code) =>
      code === 0
        ? res()
        : rej(
            Error(
              `Local stack command failed (${code}).\n${redact(output).slice(-5000)}`,
            ),
          ),
    );
  });
  return { child, result };
}
function inspect(name) {
  try {
    return JSON.parse(
      execFileSync("docker", ["container", "inspect", name], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }),
    )[0];
  } catch {
    return null;
  }
}
function owned(c) {
  return (
    c?.Config.Labels?.["com.supabase.cli.project"] === PROJECT &&
    c.Config.Labels?.["com.supabase.cli.workdir"] === APP_DIR
  );
}
function projectContainers() {
  const ids = execFileSync(
    "docker",
    ["ps", "-aq", "--filter", `label=com.supabase.cli.project=${PROJECT}`],
    { encoding: "utf8" },
  )
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const containers = ids.map(inspect);
  if (containers.some((c) => !owned(c)))
    throw Error("Isolation: foreign project resources.");
  return containers;
}

// BusyBox wget in the official slim images ignores proxy exclusions in this cloud.
// Keep the real health probe; bypass the HTTP proxy ONLY for its exact in-container loopback URL.
function repairLoopbackHealth(c) {
  if (c.State?.Health?.Status === "healthy") return;
  if (!owned(c))
    throw Error("Isolation: refusing to modify a foreign container.");
  if (!c.Config.Env.some((e) => /^https?_proxy=/i.test(e))) return;
  const command = c.Config.Healthcheck?.Test;
  if (
    command?.[0] !== "CMD-SHELL" ||
    !/^wget -q --spider http:\/\/127\.0\.0\.1:(9999\/health|5000\/status)$/.test(
      command[1],
    )
  )
    return;
  const name = c.Name.slice(1);
  const original = execFileSync(
    "docker",
    ["exec", "--user", "0", name, "sh", "-c", "command -v wget"],
    { encoding: "utf8" },
  ).trim();
  if (!["/usr/bin/wget", "/bin/wget"].includes(original))
    throw Error("Unexpected test-container wget path.");
  const script = `#!/bin/sh\nif [ "$*" = "${command[1].slice(5)}" ]; then\n unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY ALL_PROXY all_proxy\nfi\nexec ${original} "$@"\n`;
  const temp = mkdtempSync(join(tmpdir(), "bf-health-"));
  try {
    const bin = join(temp, "usr/local/bin");
    mkdirSync(bin, { recursive: true });
    writeFileSync(join(bin, "wget"), script, { mode: 0o755 });
    execFileSync("docker", ["cp", temp + "/.", name + ":/"], {
      stdio: ["ignore", "pipe", "pipe"],
    });
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}
export async function startLocal({
  onOwned = () => {},
  onProven = () => {},
} = {}) {
  assertLocalConfig();
  projectContainers();
  const existing = inspect(`supabase_db_${PROJECT}`);
  if (existing) {
    if (!owned(existing)) throw Error("Isolation: foreign stack.");
    await proveIsolation();
    onOwned();
    onProven();
    console.log("PASS existing isolated local stack.");
    return;
  }
  console.log(
    "Starting dedicated local Supabase; images retain registry digest verification.",
  );
  onOwned();
  const { child, result } = runCli(["start", "--exclude", excluded]);
  let done = false;
  const repaired = new Set();
  result
    .finally(() => {
      done = true;
    })
    .catch(() => {});
  try {
    while (!done) {
      for (const name of [
        `supabase_auth_${PROJECT}`,
        `supabase_storage_${PROJECT}`,
      ]) {
        if (repaired.has(name)) continue;
        const c = inspect(name);
        if (c?.State?.Running) {
          repairLoopbackHealth(c);
          repaired.add(name);
        }
      }
      await pause(250);
    }
    await result;
    await proveIsolation();
    onProven();
    console.log(
      "PASS isolated PostgreSQL/Auth/Storage/API readiness and fixture guard.",
    );
  } catch (error) {
    if (!done) {
      child.kill("SIGTERM");
      const force = setTimeout(() => child.kill("SIGKILL"), 5000);
      try {
        await result;
      } catch {
      } finally {
        clearTimeout(force);
      }
    }
    await stopLocal().catch(() => {
      console.error(
        "Failed to stop owned startup resources; database backups were not discarded.",
      );
    });
    throw error;
  }
}
export async function stopLocal({ discard = false } = {}) {
  assertLocalConfig();
  if (!projectContainers().length) return;
  if (discard) await proveIsolation();
  await runCli(discard ? ["stop", "--no-backup"] : ["stop"]).result;
  console.log(
    discard
      ? "Stopped and discarded only the proven first-seller test stack."
      : "Stopped the owned test stack; preserved its database backup.",
  );
}
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    if (process.argv[2] === "start") await startLocal();
    else if (process.argv[2] === "stop") await stopLocal({ discard: true });
    else if (process.argv[2] === "cleanup") await stopLocal();
    else throw Error("Use start, stop or cleanup.");
  } catch (e) {
    console.error(redact(e.message));
    process.exitCode = 1;
  }
}
