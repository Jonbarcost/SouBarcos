import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { APP_DIR, proveIsolation } from "./isolation.mjs";
import { withLocalStack } from "./lifecycle.mjs";
const mode = process.argv[2];
function run(args) {
  return new Promise((res, rej) => {
    const child = spawn(process.execPath, args, {
      cwd: APP_DIR,
      env: process.env,
      stdio: "inherit",
    });
    child.on("error", rej);
    child.on("exit", (code) =>
      code === 0 ? res() : rej(Error(`Acceptance command failed (${code}).`)),
    );
  });
}
const generated = resolve(APP_DIR, "next-env.d.ts");
const previous = readFileSync(generated, "utf8");
try {
  if (!["all", "integration", "e2e"].includes(mode))
    throw Error("Use all, integration or e2e.");
  const acceptance = async () => {
    if (mode !== "all") await proveIsolation();
    if (mode !== "e2e")
      await run([
        "--test",
        "--test-concurrency=1",
        ...readdirSync(resolve(APP_DIR, "tests/first-seller"))
          .filter((f) => f.endsWith(".test.mjs"))
          .map((f) => "tests/first-seller/" + f),
      ]);
    if (mode !== "integration")
      await run(["node_modules/@playwright/test/cli.js", "test"]);
  };
  if (mode === "all") await withLocalStack(acceptance);
  else await acceptance();
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  const current = readFileSync(generated, "utf8");
  if (
    current !== previous &&
    current.replaceAll(".next/dev/types/", ".next/types/") === previous
  )
    writeFileSync(generated, previous);
}
