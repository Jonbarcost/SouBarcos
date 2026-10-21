import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import {
  validSecret,
  configStatus,
  makeSignedState,
  verifySignedState,
  seal,
  unseal,
} from "../src/lib/zoho-security";
import { provider } from "../src/lib/zoho-provider";
const key = randomBytes(32).toString("hex");
const encryption = randomBytes(32).toString("hex");
const env = {
  ZOHO_CLIENT_ID: "test-client",
  ZOHO_CLIENT_SECRET: "test-client-secret",
  ZOHO_OAUTH_STATE_SECRET: key,
  ZOHO_TOKEN_ENCRYPTION_KEY: encryption,
  ZOHO_REGION: "us",
  ZOHO_REDIRECT_URI:
    "https://brasilforce.com.br/api/integrations/zoho/callback",
  ZOHO_MAILBOX_ADDRESS: "contato@brasilforce.com.br",
  ZOHO_CREDENTIALS_REVIEWED: "true",
};
test("security configuration fails closed for weak, missing, reused and provider keys", () => {
  for (const value of [
    "",
    "a".repeat(64),
    "sk_live_" + key,
    "zoho" + key,
    "password".repeat(8),
  ])
    assert.equal(validSecret(value), false);
  assert.equal(configStatus(env).configured, true);
  for (const overrides of [
    { ZOHO_OAUTH_STATE_SECRET: "" },
    { ZOHO_TOKEN_ENCRYPTION_KEY: key },
    { ZOHO_REGION: "attacker" },
    {
      ZOHO_REDIRECT_URI: "https://evil.example/api/integrations/zoho/callback",
    },
    { ZOHO_CREDENTIALS_REVIEWED: "false" },
    { ZOHO_MAILBOX_ADDRESS: "other@example.org" },
  ])
    assert.equal(configStatus({ ...env, ...overrides }).configured, false);
});
test("state binds owner and browser, rejects tampering, future time and expiry", () => {
  const now = Date.now();
  const state = makeSignedState("owner", key, "cookie", now);
  assert.equal(verifySignedState(state, "owner", key, "cookie", now), true);
  for (const [uid, binding, time] of [
    ["other", "cookie", now],
    ["owner", "other", now],
    ["owner", "cookie", now + 600000],
    ["owner", "cookie", now - 1000],
  ] as const)
    assert.equal(verifySignedState(state, uid, key, binding, time), false);
  assert.equal(
    verifySignedState(state + "x", "owner", key, "cookie", now),
    false,
  );
});
test("AES-GCM separates environments and detects tampering and wrong keys", () => {
  const plaintext = { refresh_token: "not-a-real-token" };
  const a = seal(plaintext, encryption, "env:a"),
    b = seal(plaintext, encryption, "env:a");
  assert.notEqual(a, b);
  assert.ok(!a.includes("not-a-real-token"));
  assert.deepEqual(unseal(a, encryption, "env:a"), plaintext);
  assert.throws(() => unseal(a, encryption, "env:b"));
  assert.throws(() => unseal(a, key, "env:a"));
  assert.throws(() => unseal(a.slice(0, -5) + "AAAAA", encryption, "env:a"));
});
test("provider credentials only go to fixed endpoints in headers/body; no redirects or automatic sending", async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetcher: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init: init! });
    return Response.json({
      access_token: "a",
      refresh_token: "r",
      expires_in: 3600,
    });
  };
  const api = provider(env, fetcher);
  await api.exchange("private-code");
  assert.equal(calls[0].url, "https://accounts.zoho.com/oauth/v2/token");
  assert.equal(calls[0].init.redirect, "error");
  assert.ok(String(calls[0].init.body).includes("private-code"));
  await assert.rejects(
    api.send("123", "a", "recipient@example.org", "Hi", "Hello"),
    /desativado/,
  );
  assert.equal(calls.length, 1);
  await assert.rejects(api.content("123", "../../evil", "123", "a"));
  assert.equal(calls.length, 1);
});
test("provider verifies confirmed corporate sender and returns only expected mail data", async () => {
  const api = provider(env, async () =>
    Response.json({
      status: { code: 200 },
      data: [
        {
          accountId: "123",
          emailAddress: [{ mailId: "other@example.org", isConfirmed: true }],
        },
      ],
    }),
  );
  await assert.rejects(api.account("a"), /não corresponde/);
  const fail = provider(env, async () =>
    Response.json({ error: "secret upstream details" }),
  );
  await assert.rejects(
    fail.refresh("r"),
    (e) => e instanceof Error && !e.message.includes("secret"),
  );
});

test("sending enabled still uses fixed corporate sender, plaintext and one validated recipient", async () => {
  let calls = 0;
  const api = provider(
    { ...env, ZOHO_MAIL_SEND_ENABLED: "true" },
    async (url, init) => {
      calls++;
      assert.equal(
        String(url),
        "https://mail.zoho.com/api/accounts/123/messages",
      );
      const b = JSON.parse(String(init?.body));
      assert.equal(b.fromAddress, "contato@brasilforce.com.br");
      assert.equal(b.mailFormat, "plaintext");
      assert.equal(b.toAddress, "supplier@example.org");
      assert.equal(b.ccAddress, undefined);
      return Response.json({
        status: { code: 200 },
        data: { messageId: "12345" },
      });
    },
  );
  await assert.rejects(
    api.send(
      "123",
      "access",
      "supplier@example.org,other@example.org",
      "Hi",
      "Body",
    ),
  );
  assert.equal(calls, 0);
  assert.equal(
    await api.send("123", "access", "supplier@example.org", "Hi", "Body"),
    "12345",
  );
  assert.equal(calls, 1);
});
