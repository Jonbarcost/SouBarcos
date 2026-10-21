import test from "node:test";
import assert from "node:assert/strict";
import { assistantInput, safeSearchTerm, assistantContext, assistantRules } from "../src/lib/assistant";

test("extract a meaningful term from a complete Brazilian Portuguese question", () => {
  assert.equal(safeSearchTerm("Preciso de uma mochila para camping de três dias"), "mochila");
  assert.equal(safeSearchTerm("Quero comprar lanterna"), "lanterna");
  assert.equal(safeSearchTerm(""), "");
  assert.equal(safeSearchTerm("%%%_\\\\"), "");
  assert.equal(safeSearchTerm("bota"), "bota");
});
test("reject oversized messages and bound valid prompts", () => {
  assert.equal(assistantInput.safeParse({ question: "oi" }).success, true);
  assert.equal(assistantInput.safeParse({ question: "x".repeat(501) }).success, false);
  assert.equal(assistantInput.safeParse({ question: "Preciso de uma mochila" }).success, true);
});
test("AI context includes only approved and provided listing fields", () => {
  assert.deepEqual(assistantContext([{
    id: "sample-id", title: "Mochila", price_cents: 1000,
    category_slug: "campo", stock: 1, secret: "not allowed",
  } as never]), [{ id: "sample-id", title: "Mochila", price_cents: 1000, category_slug: "campo", stock: 1 }]);
});

test("assistant guides platform questions without military treatment or invented facts", () => {
  assert.match(assistantRules, /Não use tratamento militar/);
  assert.match(assistantRules, /Não invente preços/);
  assert.match(assistantRules, /formato JSON solicitado/);
  assert.match(assistantRules, /Catálogo vazio não impede/);
});
