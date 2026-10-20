import test from "node:test";
import assert from "node:assert/strict";
import { checkEnvironment } from "../scripts/environment-check.mjs";
const base = {
  SITE_URL: "https://example.com",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  AUTH_REGISTRATION_ENABLED: "false",
};
test("environment checks block privileged keys and invalid deployment origins", () => {
  assert.equal(checkEnvironment(base, true).errors.length, 0);
  for (const change of [
    { NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_private" },
    { SITE_URL: "http://example.com" },
    { SITE_URL: "https://user:pass@example.com" },
    { SITE_URL: "https://example.com/path" },
    { AUTH_REGISTRATION_ENABLED: "yes" },
    { NEXT_PUBLIC_PRIVATE_TOKEN: "private" },
  ])
    assert.ok(checkEnvironment({ ...base, ...change }, true).errors.length);
  const privileged = `x.${Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url")}.x`;
  assert.ok(
    checkEnvironment(
      { ...base, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: privileged },
      true,
    ).errors.length,
  );
});
test("shipping production cannot be accidentally enabled with incomplete configuration", () => {
  assert.ok(
    checkEnvironment({ ...base, SHIPPING_ENABLED: "true" }, true).errors.length,
  );
  assert.ok(
    checkEnvironment(
      {
        ...base,
        SHIPPING_ENABLED: "true",
        MELHOR_ENVIO_TOKEN: "private",
        SHIPPING_TECHNICAL_EMAIL: "ops@example.com",
        MELHOR_ENVIO_SERVICE_IDS: "1",
        MELHOR_ENVIO_ENVIRONMENT: "production",
      },
      true,
    ).errors.length,
  );
  assert.equal(
    checkEnvironment({ SITE_URL: "http://localhost:3000" }).errors.length,
    0,
  );
  assert.ok(
    checkEnvironment({ SITE_URL: "http://localhost:3000" }, true).errors.length,
  );
});
test("AI activation requires verified model configuration and a server-side credential binding", () => {
  assert.ok(checkEnvironment({ ...base, BF_AI_ENABLED: "yes" }).errors.length);
  assert.ok(checkEnvironment({ ...base, BF_AI_ENABLED: "true" }).errors.length);
  assert.ok(
    checkEnvironment({
      ...base,
      BF_AI_ENABLED: "true",
      BF_AI_MODEL: "vendor/model",
    }).errors.length,
  );
  assert.equal(
    checkEnvironment({
      ...base,
      BF_AI_ENABLED: "true",
      BF_AI_MODEL: "vendor/model",
      VERCEL_OIDC_TOKEN: "test-oidc",
    }).errors.length,
    0,
  );
  assert.equal(
    checkEnvironment({ ...base, BF_AI_ENABLED: "false" }).errors.length,
    0,
  );
});
