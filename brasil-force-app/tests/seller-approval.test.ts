import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { database, ids } from "./helpers/database";
let c: Awaited<ReturnType<typeof database>>;
let app: string;
before(async () => {
  c = await database();
  await c.as(ids.seller);
  await c.db.query(
    "insert into public.bf_seller_applications(user_id,display_name,person_type,policy_version) values($1,'Loja teste','company','2026-10-15')",
    [ids.seller],
  );
  app = (
    await c.db.query<{ id: string }>(
      "select id from public.bf_seller_applications",
    )
  ).rows[0].id;
});
after(async () => c?.db.close());
const review = (decision: string, revision: number) =>
  c.db.query("select public.bf_review_seller($1,$2,$3,$4)", [
    app,
    decision,
    "Conferência administrativa concluída.",
    revision,
  ]);
const verify = (
  revision = 1,
  checks = ["identity", "fiscal", "commercial", "policy"],
) =>
  c.db.query("select public.bf_verify_seller($1,$2,$3,$4,$5)", [
    app,
    revision,
    "test-policy-v1",
    checks,
    "KYC-TEST-12345",
  ]);
test("seller approval requires in-review state, admin MFA and configured verification", async () => {
  await c.as(ids.seller);
  await assert.rejects(review("approved", 0), /Staff MFA required/);
  await assert.rejects(verify(0), /Admin MFA required/);
  await c.as(ids.admin);
  await assert.rejects(review("approved", 0), /Staff MFA required/);
  await c.as(ids.admin, "aal2");
  await assert.rejects(review("approved", 0), /Invalid transition/);
  await review("in_review", 0);
  await assert.rejects(verify(), /Verification policy unavailable/);
  await assert.rejects(review("approved", 1), /Verification required/);
  await c.db.exec("reset role");
  await c.db.exec(
    "insert into public.bf_seller_verification_policies(person_type,version,required_checks,enabled) values('company','test-policy-v1',array['identity','fiscal','commercial','policy'],true)",
  );
  await c.as(ids.moderator, "aal2");
  await assert.rejects(verify(), /Admin MFA required/);
  await assert.rejects(review("approved", 1), /Admin MFA required/);
});
test("verification requires all configured checks, current revision and an opaque evidence reference", async () => {
  await c.as(ids.admin, "aal2");
  await assert.rejects(verify(0), /Revision conflict/);
  await assert.rejects(verify(1, ["identity"]), /Required checks missing/);
  await assert.rejects(
    c.db.query("select public.bf_verify_seller($1,1,$2,$3,$4)", [
      app,
      "test-policy-v1",
      ["identity", "fiscal", "commercial", "policy"],
      "https://public.example/document.pdf",
    ]),
    /Invalid evidence reference/,
  );
  await verify();
  await c.as(ids.seller);
  assert.equal(
    (await c.db.query("select * from public.bf_seller_verifications")).rows
      .length,
    0,
  );
  await assert.rejects(
    c.db.exec("insert into public.bf_seller_verifications default values"),
    /permission denied/,
  );
});
test("approval atomically enables the correct seller role and records actor, reason and revision", async () => {
  await c.as(ids.admin, "aal2");
  await review("approved", 1);
  const a = (
    await c.db.query<{ status: string; revision: number }>(
      "select status,revision from public.bf_seller_applications where id=$1",
      [app],
    )
  ).rows[0];
  assert.deepEqual(a, { status: "approved", revision: 2 });
  const role = (
    await c.db.query<{ role: string }>(
      "select role from public.bf_accounts where id=$1",
      [ids.seller],
    )
  ).rows[0].role;
  assert.equal(role, "store");
  const event = (
    await c.db.query<{ actor_id: string }>(
      "select actor_id from public.bf_seller_review_events where application_id=$1 and revision=2",
      [app],
    )
  ).rows[0];
  assert.equal(event.actor_id, ids.admin);
  await assert.rejects(review("rejected", 1), /Revision conflict/);
  await c.as(ids.seller);
  assert.equal(
    (
      await c.db.query<{ allowed: boolean }>(
        "select brasil_force_private.can_sell() allowed",
      )
    ).rows[0].allowed,
    true,
  );
  await c.db.query("select public.bf_save_listing($1,0,$2::jsonb)", [
    "20000000-0000-4000-8000-000000000011",
    JSON.stringify({
      title: "Mochila teste local",
      description: "Descrição de teste suficientemente detalhada.",
      category_slug: "campo",
      condition: "new",
      price_cents: 1000,
      stock: 1,
      weight_grams: 500,
      length_cm: 30,
      width_cm: 20,
      height_cm: 10,
      dispatch_business_days: 2,
    }),
  ]);
});
test("self-approval, expired evidence, changed policy and inactive accounts cannot enable selling", async () => {
  await c.db.exec("reset role");
  await c.db.query(
    "insert into public.bf_seller_applications(user_id,display_name,person_type,status,policy_version) values($1,'Admin teste','individual','in_review','2026-10-15')",
    [ids.admin],
  );
  const own = (
    await c.db.query<{ id: string }>(
      "select id from public.bf_seller_applications where user_id=$1",
      [ids.admin],
    )
  ).rows[0].id;
  await c.as(ids.admin, "aal2");
  await assert.rejects(
    c.db.query("select public.bf_review_seller($1,$2,$3,0)", [
      own,
      "approved",
      "Não pode autoaprovar.",
    ]),
    /Application not available/,
  );
  await assert.rejects(
    c.db.query("select public.bf_verify_seller($1,0,$2,$3,$4)", [
      own,
      "test-policy-v1",
      ["identity"],
      "KYC-TEST-12345",
    ]),
    /Application not available/,
  );
  // Expiration and policy changes invalidate attestation before a new decision.
  await c.db.exec("reset role");
  await c.db.query(
    "update public.bf_seller_applications set status='in_review',revision=1 where id=$1",
    [app],
  );
  await c.db.query("update public.bf_accounts set role='buyer' where id=$1", [
    ids.seller,
  ]);
  await c.db.exec(
    "update public.bf_seller_verifications set expires_at=now()-interval '1 second'",
  );
  await c.as(ids.admin, "aal2");
  await assert.rejects(review("approved", 1), /Verification required/);
  await c.db.exec("reset role");
  await c.db.exec(
    "update public.bf_seller_verifications set expires_at=now()+interval '1 day';update public.bf_seller_verification_policies set version='changed'",
  );
  await c.as(ids.admin, "aal2");
  await assert.rejects(review("approved", 1), /Verification required/);
  await c.db.exec("reset role");
  await c.db.exec(
    "update public.bf_seller_verification_policies set version='test-policy-v1'",
  );
  await c.db.query(
    "update public.bf_accounts set status='suspended' where id=$1",
    [ids.seller],
  );
  await c.as(ids.admin, "aal2");
  await assert.rejects(review("approved", 1), /Applicant not eligible/);
});
