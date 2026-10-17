import test from "node:test";
import assert from "node:assert/strict";
import { withLocalStack } from "../scripts/first-seller/lifecycle.mjs";
test("partial startup stops owned resources while preserving unproven data", async () => {
  const stops: unknown[] = [];
  let ran = false;
  await assert.rejects(
    withLocalStack(
      async () => {
        ran = true;
      },
      {
        start: async ({ onOwned } = {}) => {
          onOwned?.();
          throw Error("health probe failed");
        },
        stop: async (options) => {
          stops.push(options);
        },
      },
    ),
    /health probe/,
  );
  assert.equal(ran, false);
  assert.deepEqual(stops, [{ discard: false }]);
});
test("foreign or unproven preexisting resources are not acquired or stopped", async () => {
  let stopped = false;
  await assert.rejects(
    withLocalStack(async () => {}, {
      start: async () => {
        throw Error("Isolation");
      },
      stop: async () => {
        stopped = true;
      },
    }),
    /Isolation/,
  );
  assert.equal(stopped, false);
});
test("proven stack is disposed after acceptance failures and successful runs", async () => {
  for (const fail of [false, true]) {
    const stops: unknown[] = [];
    const result = withLocalStack(
      async () => {
        if (fail) throw Error("acceptance");
        return "passed";
      },
      {
        start: async ({ onOwned, onProven } = {}) => {
          onOwned?.();
          onProven?.();
        },
        stop: async (options) => {
          stops.push(options);
        },
      },
    );
    if (fail) await assert.rejects(result, /acceptance/);
    else assert.equal(await result, "passed");
    assert.deepEqual(stops, [{ discard: true }]);
  }
});
