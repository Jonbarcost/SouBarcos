import test from "node:test";
import assert from "node:assert/strict";
import {
  handleAssistant,
  type AssistantDependencies,
} from "../src/lib/assistant-service";

const id = "20000000-0000-4000-8000-000000000001";
const product = {
  id,
  title: "Mochila real",
  price_cents: 25000,
  category_slug: "campo",
  stock: 2,
};
function fixture(overrides: Partial<AssistantDependencies> = {}) {
  const calls: string[] = [];
  const deps: AssistantDependencies = {
    enabled: true,
    authenticate: async () => {
      calls.push("auth");
      return true;
    },
    consumeQuota: async () => {
      calls.push("quota");
      return true;
    },
    search: async () => {
      calls.push("search");
      return [product];
    },
    recommend: async () => {
      calls.push("gateway");
      return { product_ids: [id], guidance: "compare" };
    },
    ...overrides,
  };
  return { deps, calls };
}
function request(
  body: unknown = { question: "Preciso de mochila" },
  headers: Record<string, string> = {},
) {
  return new Request("https://preview.example/api/assistente", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://preview.example",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}
test("assistant rejects cross-origin, invalid content type and actual oversized bodies before authentication", async () => {
  for (const req of [
    request({}, { origin: "https://evil.example" }),
    request({}, { "content-type": "text/plain" }),
    request({ question: "a".repeat(5000) }),
  ]) {
    const { deps, calls } = fixture();
    const r = await handleAssistant(req, deps);
    assert.ok([403, 413, 415].includes(r.status));
    assert.deepEqual(calls, []);
  }
});
test("assistant fails closed for disabled feature, unauthorized membership and quota RPC failure", async () => {
  for (const [overrides, status] of [
    [{ enabled: false }, 503],
    [{ authenticate: async () => false }, 401],
    [{ consumeQuota: async () => false }, 429],
    [
      {
        consumeQuota: async () => {
          throw Error("private database error");
        },
      },
      503,
    ],
  ] as const) {
    const { deps, calls } = fixture(overrides);
    const r = await handleAssistant(request(), deps);
    assert.equal(r.status, status);
    assert.ok(!calls.includes("gateway"));
    assert.ok(!(await r.text()).includes("private database"));
  }
});
test("assistant renders only verified catalog facts and subset selected by structured gateway output", async () => {
  const { deps } = fixture();
  const r = await handleAssistant(request(), deps);
  assert.equal(r.status, 200);
  const body = await r.json();
  assert.equal(body.mode, "ai");
  assert.match(body.answer, /Sim, senhor/);
  assert.deepEqual(body.products, [product]);
  assert.ok(!JSON.stringify(body).includes("undefined"));
  assert.equal(r.headers.get("cache-control"), "no-store");
});
test("assistant rejects invented IDs and free-form provider claims", async () => {
  for (const output of [
    {
      product_ids: ["20000000-0000-4000-8000-000000000099"],
      guidance: "compare",
    },
    { product_ids: [id], guidance: "Pagamento confirmado" },
    { product_ids: [id], guidance: "compare", answer: "Preço inventado" },
  ]) {
    const { deps } = fixture({ recommend: async () => output });
    const r = await handleAssistant(request(), deps);
    assert.equal(r.status, 503);
    assert.ok(!(await r.text()).includes("inventado"));
  }
});
test("empty catalog and missing gateway configuration use factual catalog fallback without paid calls", async () => {
  const empty = fixture({ search: async () => [] });
  const r = await handleAssistant(request(), empty.deps);
  assert.equal(r.status, 200);
  const emptyResult = await r.json();
  assert.deepEqual(emptyResult.products, []);
  assert.match(emptyResult.answer, /Às ordens/);
  assert.ok(!empty.calls.includes("gateway"));
  const absent = fixture({ recommend: undefined });
  const fallback = await handleAssistant(request(), absent.deps);
  const fallbackResult = await fallback.json();
  assert.equal(fallbackResult.mode, "catalog");
  assert.match(fallbackResult.answer, /Positivo, senhor/);
});
test("gateway errors are hidden and safe metrics contain no prompts or identities", async () => {
  let metric: unknown;
  const { deps } = fixture({
    recommend: async () => {
      throw Error("secret upstream token");
    },
    metric: (m) => {
      metric = m;
    },
  });
  const r = await handleAssistant(request(), deps);
  assert.equal(r.status, 503);
  assert.ok(!(await r.text()).includes("secret"));
  assert.ok(!JSON.stringify(metric).includes("mochila"));
  assert.equal((metric as { status: number }).status, 503);
});
