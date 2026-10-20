import test from "node:test";
import assert from "node:assert/strict";
import { totp } from "../scripts/first-seller/crypto.mjs";
test("test authenticator follows the RFC 6238 SHA1 vector and rejects invalid secrets", () => {
  assert.equal(totp("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ", 59000), "287082");
  assert.throws(() => totp("!"), /Invalid/);
});
