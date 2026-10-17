import { spawn } from "node:child_process";
import assert from "node:assert/strict";
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "-p",
    "3100",
  ],
  {
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      NODE_USE_ENV_PROXY: "1",
      NO_PROXY: "127.0.0.1,localhost",
    },
  },
);
let output = "";
server.stdout.on("data", (d) => (output += d));
server.stderr.on("data", (d) => (output += d));
const base = "http://127.0.0.1:3100";
try {
  let ready = false;
  for (let i = 0; i < 10; i++) {
    try {
      const r = await fetch(base + "/api/health", {
        signal: AbortSignal.timeout(1500),
      });
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  assert.ok(ready, output);
  for (const route of [
    "/",
    "/catalogo",
    "/assistente",
    "/explorar",
    "/instituicoes",
    "/cadastro",
    "/entrar",
    "/vender",
    "/ajuda",
    "/regras",
    "/privacidade",
    "/termos",
  ]) {
    const r = await fetch(base + route, { signal: AbortSignal.timeout(15000) });
    assert.equal(r.status, 200, route);
    const html = await r.text();
    assert.ok(html.includes("BRASIL FORCE"), route);
    const csp = r.headers.get("content-security-policy");
    assert.ok(csp?.includes("frame-ancestors 'none'"));
    assert.ok(csp?.includes("'nonce-"));
    assert.ok(html.includes("nonce="));
    console.log("PASS", route);
  }
  for (const route of [
    "/conta",
    "/admin",
    "/conta/seguranca",
    "/painel-vendedor",
    "/painel-vendedor/anuncios/novo",
    "/painel-vendedor/anuncios/00000000-0000-4000-8000-000000000001",
  ]) {
    const r = await fetch(base + route, {
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
    });
    if (r.status === 307) {
      assert.ok(r.headers.get("location")?.includes("/entrar"));
    } else {
      // Next.js streaming boundaries emit a client meta redirect with HTTP 200.
      assert.equal(r.status, 200);
      const body = await r.text();
      assert.match(
        body,
        /<meta[^>]+http-equiv="refresh"[^>]+content="[^"]*\/entrar/,
      );
      assert.ok(!body.includes("Perfil pessoal"));
      assert.ok(!body.includes("Solicitações de vendedores"));
    }
    console.log("PASS protected", route);
  }
  const health = await (
    await fetch(base + "/api/health", { signal: AbortSignal.timeout(1500) })
  ).json();
  assert.equal(health.commerceEnabled, false);
  assert.equal(typeof health.authenticationConfigured, "boolean");
  const login = await (await fetch(base + "/cadastro")).text();
  assert.ok(login.includes('disabled=""'));
  assert.equal((await fetch(base + "/auth/oauth?provider=google")).status, 404);
  console.log("PASS configuration gates and OAuth disabled");
  const assistant = await fetch(base + "/api/assistente", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: "Mochila para camping" }),
  });
  assert.equal(assistant.status, 503, "AI must be disabled by default");
  console.log("PASS AI endpoint gated without preview activation");
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  server.kill("SIGTERM");
}
