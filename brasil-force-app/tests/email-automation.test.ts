import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";
import { sendMail } from "../src/lib/mailer";
import {
  contactEmails,
  esc,
  sellerApplicationEmails,
  welcomeEmail,
} from "../src/lib/email-templates";
import { captchaToken, verifyCaptcha } from "../src/lib/captcha";
import { checkEnvironment } from "../scripts/environment-check.mjs";

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
const attack = `<script>alert(1)</script>"'&`;

test("templates escape user-provided values", () => {
  assert.equal(esc(attack), "&lt;script&gt;alert(1)&lt;/script&gt;&quot;&#39;&amp;");
  const [team] = contactEmails({ name: attack, email: "a@example.com", topic: "duvida", message: attack });
  assert.doesNotMatch(team.html, /<script>/);
  const [seller, alert] = sellerApplicationEmails("s@example.com", attack, "company");
  assert.doesNotMatch(seller.html + alert.html, /<script>/);
  assert.doesNotMatch(welcomeEmail("w@example.com", attack, "buyer").html, /<script>/);
});

test("contact goes to the team with reply-to, and the auto-reply never echoes visitor text", () => {
  const [team, reply] = contactEmails({
    name: "Spam Sender",
    email: "visitor@example.com",
    topic: "parceria",
    message: "Visit http://spam.example now",
  });
  assert.equal(team.to, "contato@brasilforce.com.br");
  assert.equal(team.replyTo, "visitor@example.com");
  assert.match(team.html, /spam\.example/);
  assert.equal(reply.to, "visitor@example.com");
  assert.doesNotMatch(reply.html + reply.text, /spam\.example|Spam Sender/);
  assert.match(reply.html, /Parceria ou fornecimento/);
});

test("seller application notifies the seller and the team inbox", () => {
  const [seller, team] = sellerApplicationEmails("seller@example.com", "Loja Tática", "company");
  assert.equal(seller.to, "seller@example.com");
  assert.match(seller.html, /brasilforce\.com\.br\/vender/);
  assert.match(seller.html, /Não envie documentos por e-mail/);
  assert.equal(team.to, "contato@brasilforce.com.br");
  assert.match(team.html, /Pessoa jurídica/);
  assert.match(team.html, /seller@example\.com/);
});

test("welcome e-mail differs for buyers and sellers", () => {
  const seller = welcomeEmail("x@example.com", "Ana Souza", "seller");
  const buyer = welcomeEmail("x@example.com", "Ana Souza", "buyer");
  assert.match(seller.html, /\/vender/);
  assert.match(seller.subject, /vender/i);
  assert.doesNotMatch(buyer.html, /SOLICITAR HABILITAÇÃO/);
  assert.match(buyer.html, /Ana/);
  assert.ok(buyer.text.includes("BRASIL FORCE") && !buyer.text.includes("<"));
});

test("mailer sends through the transport and keeps headers single-line", async () => {
  const transport = nodemailer.createTransport({ jsonTransport: true });
  let captured: { subject?: string; from?: unknown } = {};
  const spy = { sendMail: async (m: object) => ((captured = JSON.parse((await transport.sendMail(m)).message)), {}) };
  const result = await sendMail(
    { to: "a@example.com", subject: "Olá\r\nBcc: victim@example.com", html: "<p>x</p>", text: "x" },
    spy as unknown as nodemailer.Transporter,
  );
  assert.equal(result.sent, true);
  assert.equal(captured.subject, "Olá Bcc: victim@example.com");
  assert.match(JSON.stringify(captured.from), /contato@brasilforce\.com\.br/);
});

test("mailer is a safe no-op without SMTP configuration", async () => {
  const saved = { ...process.env };
  delete process.env.SMTP_HOST;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASSWORD;
  try {
    const result = await sendMail({ to: "a@example.com", subject: "s", html: "h", text: "t" });
    assert.deepEqual(result, { sent: false, reason: "smtp-not-configured" });
  } finally {
    Object.assign(process.env, saved);
  }
});

test("captcha: off without site key, required and verified with it", async () => {
  const saved = { ...process.env };
  try {
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    const form = new FormData();
    assert.equal(captchaToken(form), null);
    assert.equal(await verifyCaptcha(null), true);

    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "site";
    assert.equal(captchaToken(form), undefined);
    form.set("captcha_token", "tok");
    assert.equal(captchaToken(form), "tok");

    delete process.env.TURNSTILE_SECRET_KEY;
    assert.equal(await verifyCaptcha("tok"), false, "no secret must fail closed");
    process.env.TURNSTILE_SECRET_KEY = "secret";
    let sent = "";
    const ok = (async (_url: string, init: { body: URLSearchParams }) => {
      sent = init.body.toString();
      return new Response(JSON.stringify({ success: true }));
    }) as unknown as typeof fetch;
    assert.equal(await verifyCaptcha("tok", "1.2.3.4", ok), true);
    assert.match(sent, /response=tok/);
    assert.match(sent, /remoteip=1\.2\.3\.4/);
    const no = (async () => new Response(JSON.stringify({ success: false }))) as unknown as typeof fetch;
    assert.equal(await verifyCaptcha("tok", null, no), false);
    const down = (async () => {
      throw new Error("network");
    }) as unknown as typeof fetch;
    assert.equal(await verifyCaptcha("tok", null, down), false);
    assert.equal(await verifyCaptcha(undefined), false);
  } finally {
    for (const key of ["NEXT_PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"]) delete process.env[key];
    Object.assign(process.env, saved);
  }
});

test("auth forms pass the captcha token to Supabase and sign-up carries the intent", () => {
  const actions = read("../src/app/auth/actions.ts");
  assert.equal((actions.match(/captchaToken\(form\)/g) || []).length, 3);
  assert.match(actions, /signInWithPassword\([\s\S]*captchaToken/);
  assert.match(actions, /signUp\([\s\S]*captchaToken/);
  assert.match(actions, /resetPasswordForEmail\([\s\S]*captchaToken/);
  assert.match(actions, /data: \{ display_name: name\.data, intent \}/);
  const proxy = read("../src/proxy.ts");
  assert.match(proxy, /frame-src https:\/\/challenges\.cloudflare\.com/);
});

test("Supabase auth templates keep one action link and no secrets", () => {
  for (const file of ["confirm-signup", "reset-password", "change-email"]) {
    const html = read(`../email/${file}.html`);
    assert.equal((html.match(/{{ \.ConfirmationURL }}/g) || []).length, 1, file);
    assert.match(html, /contato@brasilforce\.com\.br/);
    assert.doesNotMatch(html, /password:|service_role|smtp_password|<script/i);
  }
});

test("environment check catches partial SMTP and half-configured captcha", () => {
  const base = {
    SITE_URL: "https://example.com",
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  };
  assert.equal(checkEnvironment(base, true).errors.length, 0);
  assert.ok(checkEnvironment({ ...base, SMTP_HOST: "smtp.zoho.com" }, true).errors.length);
  assert.ok(checkEnvironment({ ...base, NEXT_PUBLIC_TURNSTILE_SITE_KEY: "site" }, true).errors.length);
  assert.ok(checkEnvironment({ ...base, SMTP_PORT: "25" }, true).errors.length);
  const full = {
    ...base,
    SMTP_HOST: "smtp.zoho.com",
    SMTP_USER: "contato@brasilforce.com.br",
    SMTP_PASSWORD: "x",
    SMTP_PORT: "465",
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: "site",
    TURNSTILE_SECRET_KEY: "secret",
  };
  assert.equal(checkEnvironment(full, true).errors.length, 0);
});
