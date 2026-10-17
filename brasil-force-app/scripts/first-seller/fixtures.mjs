import { randomUUID, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import { proveIsolation } from "./isolation.mjs";
import { totp } from "./crypto.mjs";
const proven = new WeakSet();
const provenActors = new WeakMap();
function requireActor(user, env) {
  const binding = provenActors.get(user);
  if (!binding || (env && binding.env !== env))
    throw Error(
      "Isolation: fixture actor has not been proven for this runtime.",
    );
  return binding;
}
function requireProof(env) {
  if (!proven.has(env))
    throw Error("Isolation: fixture runtime has not been proven.");
}
export function checked(result, operation) {
  if (result.error)
    throw Error(
      `${operation} failed (${result.error.code ?? result.error.status ?? "unknown"})`,
    );
  return result.data;
}
export async function testEnvironment() {
  const runtime = await proveIsolation();
  const env = Object.freeze({
    ...runtime,
    client: (key = runtime.anonKey) =>
      createClient(runtime.apiUrl, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }),
    connect: async () => {
      const db = new pg.Client({ connectionString: runtime.dbUrl });
      await db.connect();
      return db;
    },
  });
  proven.add(env);
  return env;
}
export async function actor(env, role = "buyer", mfa = false) {
  requireProof(env);
  const email = `${randomUUID()}-${role}@bf-e2e.invalid`;
  const password = `Bf-Test-${randomBytes(18).toString("hex")}!`;
  const result = checked(
    await env
      .client(env.serviceKey)
      .auth.admin.createUser({ email, password, email_confirm: true }),
    "create isolated identity",
  );
  const client = env.client();
  checked(
    await client.auth.signInWithPassword({ email, password }),
    "sign in isolated identity",
  );
  checked(
    await client.rpc("bf_join", {
      display_name: `TESTE ${role}`,
      terms_version: "2026-10-15",
    }),
    "join isolated marketplace",
  );
  if (["admin", "moderator"].includes(role)) {
    const db = await env.connect();
    try {
      await db.query("update public.bf_accounts set role=$1 where id=$2", [
        role,
        result.user.id,
      ]);
    } finally {
      await db.end();
    }
  }
  const user = { id: result.user.id, email, password, client, role };
  if (mfa) {
    const factor = checked(
      await client.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "TESTE — NÃO COMERCIALIZÁVEL",
      }),
      "enroll real MFA",
    );
    user.secret = factor.totp.secret;
    user.factorId = factor.id;
    user.lastCounter = Math.floor(Date.now() / 30000);
    checked(
      await client.auth.mfa.challengeAndVerify({
        factorId: factor.id,
        code: totp(user.secret),
      }),
      "verify real MFA",
    );
  }
  provenActors.set(user, { id: user.id, client, env, role });
  return user;
}
export async function configureTestPolicies(env) {
  requireProof(env);
  const db = await env.connect();
  try {
    await db.query(`insert into public.bf_seller_verification_policies(person_type,version,required_checks,enabled) values
 ('individual','TEST-ONLY-v1',array['identity','commercial','policy'],true),
 ('company','TEST-ONLY-v1',array['identity','fiscal','commercial','policy'],true)
 on conflict(person_type) do update set version=excluded.version,required_checks=excluded.required_checks,enabled=true`);
  } finally {
    await db.end();
  }
}
export const draft = {
  title: "TESTE — Mochila outdoor 30 litros — NÃO COMERCIALIZÁVEL",
  description:
    "TESTE — NÃO COMERCIALIZÁVEL. Produto fictício exclusivamente da homologação local isolada.",
  category_slug: "campo",
  condition: "new",
  price_cents: 14990,
  stock: 3,
  brand: "TESTE",
  model: "TESTE",
  weight_grams: 500,
  length_cm: 30,
  width_cm: 20,
  height_cm: 10,
  dispatch_business_days: 2,
};
export async function sellerApplication(user) {
  const { id, client } = requireActor(user);
  checked(
    await client
      .from("bf_seller_applications")
      .insert({
        user_id: id,
        display_name: "TESTE — NÃO COMERCIALIZÁVEL",
        person_type: "individual",
        policy_version: "2026-10-15",
      }),
    "seller application",
  );
  const rows = checked(
    await client
      .from("bf_seller_applications")
      .select("id,revision")
      .eq("user_id", id)
      .single(),
    "read own application",
  );
  return rows;
}
export async function approvedSeller(env, admin) {
  requireProof(env);
  const binding = requireActor(admin, env);
  if (binding.role !== "admin")
    throw Error("Isolation: proven administrator required.");
  const seller = await actor(env);
  const app = await sellerApplication(seller);
  checked(
    await binding.client.rpc("bf_review_seller", {
      p_id: app.id,
      p_revision: 0,
      p_decision: "in_review",
      p_reason: "TESTE — conferência em ambiente isolado.",
    }),
    "start review",
  );
  checked(
    await binding.client.rpc("bf_verify_seller", {
      p_id: app.id,
      p_revision: 1,
      p_policy_version: "TEST-ONLY-v1",
      p_checks: ["identity", "commercial", "policy"],
      p_reference: "TEST-ONLY-EVIDENCE",
    }),
    "verify isolated evidence",
  );
  checked(
    await binding.client.rpc("bf_review_seller", {
      p_id: app.id,
      p_revision: 1,
      p_decision: "approved",
      p_reason: "TESTE — aprovação isolada não comercial.",
    }),
    "approve seller",
  );
  const approved = { ...seller, applicationId: app.id };
  provenActors.set(approved, requireActor(seller));
  return approved;
}
export async function draftListing(seller) {
  const { client } = requireActor(seller);
  const id = randomUUID();
  checked(
    await client.rpc("bf_save_listing", {
      p_id: id,
      p_revision: 0,
      p_data: draft,
    }),
    "save draft",
  );
  return id;
}
