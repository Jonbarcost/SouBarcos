import test from "node:test";
import assert from "node:assert/strict";
import { createShippingProvider } from "../src/lib/shipping/melhor-envio";
const config = {
  environment: "sandbox",
  token: "test-only-token",
  contact: "dev@example.com",
  serviceIds: ["1", "2"],
  productionEnabled: false,
};
const input = {
  sellerId: "seller-a",
  originPostalCode: "20040-020",
  destinationPostalCode: "01001-000",
  items: [
    {
      id: "item-a",
      sellerId: "seller-a",
      width: 12,
      height: 8,
      length: 20,
      weight: 0.5,
      unitValueCents: 12345,
      quantity: 2,
    },
  ],
};
const rate = {
  id: 1,
  name: "PAC",
  company: { name: "Correios" },
  price: "99.00",
  custom_price: "23.47",
  delivery_time: 15,
  custom_delivery_time: 6,
};
const response =
  (data: unknown, status = 200) =>
  async () =>
    new Response(JSON.stringify(data), { status });

test("shipping rejects absent credentials, unapproved services and unintended production", () => {
  for (const patch of [
    { token: "" },
    { serviceIds: [] },
    { environment: "prod" },
    { environment: "production" },
    { contact: "invalid" },
  ]) {
    assert.throws(
      () => createShippingProvider({ ...config, ...patch }),
      /configuração/i,
    );
  }
});
test("shipping sends unit insurance value and uses customized cents and transit days", async () => {
  let body: any;
  let endpoint = "";
  let headers: Headers;
  const provider = createShippingProvider(config, async (url, init) => {
    endpoint = String(url);
    body = JSON.parse(String(init?.body));
    headers = new Headers(init?.headers);
    assert.equal(init?.redirect, "error");
    assert.equal(init?.cache, "no-store");
    return new Response(JSON.stringify([rate]));
  });
  const result = await provider.quote(input);
  assert.equal(
    endpoint,
    "https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate",
  );
  assert.equal(body.from.postal_code, "20040020");
  assert.equal(body.products[0].insurance_value, 123.45);
  assert.equal(body.products[0].quantity, 2);
  assert.equal(result.environment, "sandbox");
  assert.equal(result.options[0].priceCents, 2347);
  assert.equal(result.options[0].transitBusinessDays, 6);
  assert.ok(!JSON.stringify(result).includes(config.token));
});
test("shipping refuses invalid postal codes, dimensions and cross-seller items before network", async () => {
  const provider = createShippingProvider(config, async () => {
    assert.fail("must not call provider");
  });
  for (const invalid of [
    { ...input, destinationPostalCode: "abc" },
    { ...input, items: [] },
    { ...input, items: [{ ...input.items[0], weight: 0 }] },
    { ...input, items: [{ ...input.items[0], sellerId: "seller-b" }] },
  ])
    await assert.rejects(() => provider.quote(invalid));
});
test("shipping omits unavailable, malformed and unapproved services", async () => {
  const provider = createShippingProvider(
    config,
    response([
      { id: 2, error: "unavailable" },
      { ...rate, id: 99 },
      { ...rate, custom_price: "NaN" },
      { ...rate, custom_delivery_time: -1 },
      rate,
    ]),
  );
  assert.equal((await provider.quote(input)).options.length, 1);
  assert.deepEqual(
    (await createShippingProvider(config, response([])).quote(input)).options,
    [],
  );
});
test("shipping never falls back to non-custom price", async () => {
  const { custom_price, ...missingPrice } = rate;
  assert.deepEqual(
    (
      await createShippingProvider(config, response([missingPrice])).quote(
        input,
      )
    ).options,
    [],
  );
});
test("shipping hides upstream errors and refuses invalid response containers", async () => {
  for (const fetcher of [
    response({ secret: "private" }, 401),
    response({ bad: "response" }),
    async () => {
      throw new Error("private credentials");
    },
  ]) {
    await assert.rejects(
      () => createShippingProvider(config, fetcher).quote(input),
      (e: Error) =>
        e.message === "Não foi possível consultar o frete. Tente novamente.",
    );
  }
});
test("shipping production requires explicit enablement and uses production host", async () => {
  const provider = createShippingProvider(
    { ...config, environment: "production", productionEnabled: true },
    async (url) => {
      assert.equal(
        String(url),
        "https://melhorenvio.com.br/api/v2/me/shipment/calculate",
      );
      return new Response("[]");
    },
  );
  assert.equal((await provider.quote(input)).environment, "production");
});
