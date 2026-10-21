import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { database, ids, session } from "./helpers/database";
let ctx: Awaited<ReturnType<typeof database>>;
let supplier: string;
let draft: string;
before(async () => {
  ctx = await database();
});
after(async () => {
  await ctx.db.close();
});
test("supplier CRM denies buyers, moderators, AAL1 and stale sessions", async () => {
  for (const [user, aal] of [
    [ids.buyer, "aal2"],
    [ids.moderator, "aal2"],
    [ids.admin, "aal1"],
  ] as const) {
    await ctx.as(user, aal);
    await assert.rejects(
      ctx.db.query(
        "select public.bf_supplier_create('Empresa','Campo',null,null,null)",
      ),
      /Forbidden/,
    );
  }
  await ctx.as(ids.admin, "aal2");
  await ctx.db.exec("reset role");
  await ctx.db.query("delete from auth.sessions where id=$1", [
    session(ids.admin),
  ]);
  await ctx.as(ids.admin, "aal2");
  await assert.rejects(
    ctx.db.query("select public.bf_zoho_nonce($1,false)", ["a".repeat(64)]),
    /Forbidden/,
  );
  await ctx.db.exec("reset role");
  await ctx.db.query("insert into auth.sessions values($1,$2)", [
    session(ids.admin),
    ids.admin,
  ]);
});
test("OAuth nonce is durable, single-use and cannot be consumed by another admin", async () => {
  await ctx.as(ids.admin, "aal2");
  const hash = "b".repeat(64);
  await ctx.db.query("select public.bf_zoho_nonce($1,false)", [hash]);
  await ctx.db.exec("reset role");
  await ctx.db.query("update public.bf_accounts set role='admin' where id=$1", [
    ids.moderator,
  ]);
  await ctx.as(ids.moderator, "aal2");
  assert.equal(
    (
      await ctx.db.query<{ ok: boolean }>(
        "select public.bf_zoho_nonce($1,true) ok",
        [hash],
      )
    ).rows[0].ok,
    false,
  );
  await ctx.as(ids.admin, "aal2");
  assert.equal(
    (
      await ctx.db.query<{ ok: boolean }>(
        "select public.bf_zoho_nonce($1,true) ok",
        [hash],
      )
    ).rows[0].ok,
    true,
  );
  assert.equal(
    (
      await ctx.db.query<{ ok: boolean }>(
        "select public.bf_zoho_nonce($1,true) ok",
        [hash],
      )
    ).rows[0].ok,
    false,
  );
  await ctx.db.exec("reset role");
  await ctx.db.query(
    "update public.bf_accounts set role='moderator' where id=$1",
    [ids.moderator],
  );
});
test("supplier transitions preserve evidence, audit and optimistic concurrency", async () => {
  await ctx.as(ids.admin, "aal2");
  supplier = (
    await ctx.db.query<{ id: string }>(
      "select public.bf_supplier_create('Fornecedor de teste','Camping','supplier@example.org',null,'https://example.org') id",
    )
  ).rows[0].id;
  await assert.rejects(
    ctx.db.query(
      "update public.bf_supplier_prospects set opt_out=true where id=$1",
      [supplier],
    ),
    /permission denied/,
  );
  await assert.rejects(
    ctx.db.query("select public.bf_supplier_change($1,0,'activated','')", [
      supplier,
    ]),
    /Consent/,
  );
  await ctx.db.query(
    "select public.bf_supplier_change($1,0,'consent_recorded','Referência TEST-123: fotos e descrição autorizadas pelo fornecedor')",
    [supplier],
  );
  await assert.rejects(
    ctx.db.query("select public.bf_supplier_change($1,0,'activated','')", [
      supplier,
    ]),
    /Stale/,
  );
  await ctx.db.query("select public.bf_supplier_change($1,1,'activated','')", [
    supplier,
  ]);
  const result = await ctx.db.query<{ promotion_eligible: boolean }>(
    "select promotion_eligible from public.bf_supplier_eligibility where id=$1",
    [supplier],
  );
  assert.equal(result.rows[0].promotion_eligible, true);
  await ctx.db.exec("reset role");
  await ctx.db.query(
    "update public.bf_supplier_prospects set consent_at=now()-interval '32 days',activated_at=now()-interval '31 days' where id=$1",
    [supplier],
  );
  await ctx.as(ids.admin, "aal2");
  assert.equal(
    (
      await ctx.db.query<{ promotion_eligible: boolean }>(
        "select promotion_eligible from public.bf_supplier_eligibility where id=$1",
        [supplier],
      )
    ).rows[0].promotion_eligible,
    false,
  );
});
test("outbox requires explicit approval, locks content, claims once, records uncertain result", async () => {
  await ctx.as(ids.admin, "aal2");
  draft = (
    await ctx.db.query<{ id: string }>(
      "select public.bf_supplier_draft($1,'Convite de teste','Conteúdo de teste em banco descartável') id",
      [supplier],
    )
  ).rows[0].id;
  await assert.rejects(
    ctx.db.query("select public.bf_supplier_mail_action($1,'claim')", [draft]),
    /Invalid/,
  );
  await assert.rejects(
    ctx.db.query(
      "update public.bf_supplier_mail set body='modificado' where id=$1",
      [draft],
    ),
    /permission denied/,
  );
  await ctx.db.query("select public.bf_supplier_mail_action($1,'approve')", [
    draft,
  ]);
  await assert.rejects(
    ctx.db.query("select public.bf_supplier_mail_action($1,'claim')", [draft]),
    /disconnected/,
  );
  await ctx.db.query("select public.bf_zoho_save('v1.test','us','123')");
  await ctx.db.query("select public.bf_supplier_mail_action($1,'claim')", [
    draft,
  ]);
  await assert.rejects(
    ctx.db.query("select public.bf_supplier_mail_action($1,'claim')", [draft]),
    /Invalid/,
  );
  await ctx.db.query("select public.bf_supplier_mail_finish($1,null)", [draft]);
  assert.equal(
    (
      await ctx.db.query<{ status: string }>(
        "select status from public.bf_supplier_mail where id=$1",
        [draft],
      )
    ).rows[0].status,
    "uncertain",
  );
});
test("opt-out cancels pending messages and suppresses duplicate prospect addresses", async () => {
  await ctx.as(ids.admin, "aal2");
  const id = (
    await ctx.db.query<{ id: string }>(
      "select public.bf_supplier_draft($1,'Assunto','Mensagem') id",
      [supplier],
    )
  ).rows[0].id;
  await ctx.db.query(
    "select public.bf_supplier_change($1,2,'opted_out','Pedido do fornecedor')",
    [supplier],
  );
  await assert.rejects(
    ctx.db.query("select public.bf_supplier_mail_action($1,'approve')", [id]),
    /blocked/,
  );
  const duplicate = (
    await ctx.db.query<{ id: string }>(
      "select public.bf_supplier_create('Duplicado','Camping','SUPPLIER@example.org',null,null) id",
    )
  ).rows[0].id;
  await assert.rejects(
    ctx.db.query("select public.bf_supplier_draft($1,'Assunto','Mensagem')", [
      duplicate,
    ]),
    /suppressed/,
  );
  await ctx.as(ids.buyer);
  assert.equal(
    (await ctx.db.query("select * from public.bf_supplier_mail")).rows.length,
    0,
  );
  assert.equal(
    (await ctx.db.query("select * from public.bf_zoho_connection")).rows.length,
    0,
  );
});

test("database rejects null consent evidence and null revision; revoked users cannot see audit", async () => {
  await ctx.as(ids.admin, "aal2");
  const id = (
    await ctx.db.query<{ id: string }>(
      "select public.bf_supplier_create('Outra empresa','Camping',null,null,null) id",
    )
  ).rows[0].id;
  await assert.rejects(
    ctx.db.query(
      "select public.bf_supplier_change($1,null,'consent_recorded','Uma referência válida')",
      [id],
    ),
    /Stale/,
  );
  await assert.rejects(
    ctx.db.query(
      "select public.bf_supplier_change($1,0,'consent_recorded',null)",
      [id],
    ),
    /Evidence/,
  );
  await ctx.as(ids.moderator, "aal2");
  assert.equal(
    (await ctx.db.query("select * from public.bf_supplier_events")).rows.length,
    0,
  );
});
test("nonce expiry and read quotas are enforced by the database", async () => {
  await ctx.as(ids.admin, "aal2");
  const hash = "c".repeat(64);
  await ctx.db.query("select public.bf_zoho_nonce($1,false)", [hash]);
  await ctx.db.exec("reset role");
  await ctx.db.query(
    "update public.bf_zoho_states set expires_at=now()-interval '1 second' where state_hash=$1",
    [hash],
  );
  await ctx.as(ids.admin, "aal2");
  assert.equal(
    (
      await ctx.db.query<{ ok: boolean }>(
        "select public.bf_zoho_nonce($1,true) ok",
        [hash],
      )
    ).rows[0].ok,
    false,
  );
  for (let i = 0; i < 60; i++)
    assert.equal(
      (
        await ctx.db.query<{ ok: boolean }>(
          "select public.bf_zoho_read_quota() ok",
        )
      ).rows[0].ok,
      true,
    );
  assert.equal(
    (
      await ctx.db.query<{ ok: boolean }>(
        "select public.bf_zoho_read_quota() ok",
      )
    ).rows[0].ok,
    false,
  );
});
