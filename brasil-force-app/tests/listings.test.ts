import test from "node:test";
import assert from "node:assert/strict";
import {
  priceSchema,
  listingSchema,
  listingIdentity,
} from "../src/lib/listings";
test("BRL values retain exact cents and reject ambiguous formats", () => {
  assert.equal(priceSchema.parse("149,90"), 14990);
  assert.equal(priceSchema.parse("0.01"), 1);
  assert.equal(priceSchema.parse("12,3"), 1230);
  for (const v of [
    "1.000,00",
    "1e3",
    "0",
    "-1",
    "1.999",
    "1000000,01",
    "Infinity",
  ])
    assert.equal(priceSchema.safeParse(v).success, false, v);
});
test("listing input requires physical packaging, bounded integers and supported condition", () => {
  const fields = {
    title: "Mochila de trilha",
    description: "Mochila nova para caminhadas.",
    category_slug: "equipamentos-de-campo",
    condition: "new",
    price_cents: "100,00",
    stock: "1",
    brand: "",
    model: "",
    weight_grams: "1000",
    length_cm: "25,50",
    width_cm: "20",
    height_cm: "10",
    dispatch_business_days: "3",
  };
  assert.equal(listingSchema.parse(fields).length_cm, 25.5);
  for (const change of [
    { stock: "1.5" },
    { weight_grams: "" },
    { height_cm: "0" },
    { width_cm: "1001" },
    { dispatch_business_days: "31" },
    { category_slug: "servicos" },
    { condition: "unknown" },
  ])
    assert.equal(
      listingSchema.safeParse({ ...fields, ...change }).success,
      false,
    );
  assert.equal(
    listingIdentity.safeParse({ p_id: "x", p_revision: "0" }).success,
    false,
  );
});
