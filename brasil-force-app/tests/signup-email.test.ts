import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const html = readFileSync(fileURLToPath(new URL("../email/confirm-signup.html", import.meta.url)), "utf8");

test("signup email carries the Supabase-managed verification link", () => {
  assert.match(html, /href="{{ \.ConfirmationURL }}"/);
  assert.equal((html.match(/{{ \.ConfirmationURL }}/g) || []).length, 1);
  assert.match(html, /CONFIRMAR MEU E-MAIL/);
});

test("signup response provides safe onboarding instructions and brand contact", () => {
  assert.match(html, /contato@brasilforce\.com\.br/);
  assert.match(html, /https:\/\/brasilforce\.com\.br\/entrar/);
  assert.match(html, /Como vender/);
  assert.match(html, /não compartilhe sua senha/i);
  assert.match(html, /independente/);
  assert.doesNotMatch(html, /password:|service_role|smtp_password/i);
});
