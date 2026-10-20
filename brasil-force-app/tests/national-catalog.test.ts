import test from "node:test";
import assert from "node:assert/strict";
import { discoverySectors, brazilStates, verifiedInstitutions, sectorFromSlug } from "../src/lib/national-catalog";

test("the 12 discovery sectors preserve the six existing category identifiers", () => {
  const legacy = ["acessorios", "campo", "colecionismo", "outdoor", "servicos", "vestuario"];
  assert.equal(discoverySectors.length, 12);
  assert.equal(new Set(discoverySectors.map(s => s.slug)).size, 12);
  assert.deepEqual([...new Set(discoverySectors.map(s => s.legacyCategory))].sort(), legacy);
  assert.ok(discoverySectors.every(s => s.examples.length > 0));
  assert.equal(sectorFromSlug("pesca")?.legacyCategory, "outdoor");
  assert.equal(sectorFromSlug("inexistente"), undefined);
});

test("all 27 federation units are represented without inventing municipalities", () => {
  assert.equal(brazilStates.length, 27);
  assert.equal(new Set(brazilStates).size, 27);
  assert.ok(brazilStates.includes("RJ") && brazilStates.includes("DF"));
});

test("directory entries are sourced and convey no product or professional authorization", () => {
  assert.equal(new Set(verifiedInstitutions.map(i => i.slug)).size, verifiedInstitutions.length);
  assert.ok(verifiedInstitutions.every(i =>
    i.sourceUrl.startsWith("https://www.gov.br/") &&
    /^\d{4}-\d{2}-\d{2}$/.test(i.sourceVerifiedOn)
  ));
  assert.ok(verifiedInstitutions.every(i => !("authorizedProducts" in i)));
});
