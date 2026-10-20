import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import {
  safeNext,
  canManage,
  profileSchema,
  passwordSchema,
} from "../src/lib/validation";
const db = new PGlite();
const alice = "00000000-0000-0000-0000-000000000001",
  bob = "00000000-0000-0000-0000-000000000002",
  staff = "00000000-0000-0000-0000-000000000003";
const sessions: Record<string, string> = {
  [alice]: "10000000-0000-0000-0000-000000000001",
  [bob]: "10000000-0000-0000-0000-000000000002",
  [staff]: "10000000-0000-0000-0000-000000000003",
};
async function asUser(id: string | null, aal = "aal1") {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claims',$1,false)", [
    JSON.stringify(id ? { sub: id, session_id: sessions[id], aal } : {}),
  ]);
  await db.exec(id ? "set role authenticated" : "set role anon");
}
async function rows(sql: string) {
  return (await db.query<Record<string, unknown>>(sql)).rows;
}
before(async () => {
  await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
 create table auth.users(id uuid primary key, email_confirmed_at timestamptz default now(), raw_user_meta_data jsonb default '{}');
 create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id));
 create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
 create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
 grant usage on schema auth to anon,authenticated;
 grant execute on function auth.jwt(),auth.uid() to anon,authenticated;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
 alter table storage.objects enable row level security;
 grant usage on schema storage to anon,authenticated;grant select,insert,update,delete on storage.objects to anon,authenticated;
 create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;`);
  for (const file of readdirSync("supabase/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    await db.exec(readFileSync("supabase/migrations/" + file, "utf8"));
  }
  for (const id of [alice, bob, staff]) {
    await db.exec("reset role");
    await db.query(
      "insert into auth.users(id,raw_user_meta_data) values($1,$2)",
      [
        id,
        JSON.stringify({ display_name: "Pessoa de teste", role: "superadmin" }),
      ],
    );
    await db.query("insert into auth.sessions(id,user_id) values($1,$2)", [
      sessions[id],
      id,
    ]);
    await asUser(id);
    assert.equal((await rows("select * from public.bf_accounts")).length, 0);
    await db.exec("select public.bf_join('Pessoa de teste','2026-10-15')");
  }
  await db.exec("reset role");
  await db.exec(`update public.bf_accounts set role='seller' where id='${bob}';update public.bf_accounts set role='admin' where id='${staff}';
 insert into public.bf_listings(seller_id,category_slug,title,description,condition,price_cents,status,classification) values
 ('${bob}','campo','Mochila pendente','Descrição suficientemente longa para teste.','new',10000,'pending','free'),
 ('${bob}','campo','Mochila aprovada','Descrição suficientemente longa para teste.','new',10000,'approved','free');
 insert into storage.objects(bucket_id,name) values ('bf-seller-documents','${alice}/document.pdf'),('bf-seller-documents','${bob}/document.pdf');`);
});
after(async () => {
  await db.close();
});
test("registration cannot set privileged role through user metadata", async () => {
  await asUser(alice);
  assert.equal(
    (await rows("select role from public.bf_accounts"))[0]["role"],
    "buyer",
  );
});
test("anonymous users see only approved free listings and no profiles", async () => {
  await asUser(null);
  assert.equal((await rows("select * from public.bf_listings")).length, 0);
  // Publication also requires seller approval, stock and packaging.
  await db.exec("reset role");
  await db.exec(`insert into public.bf_seller_applications(user_id,display_name,person_type,status,policy_version) values('${bob}','Vendedor teste','individual','approved','2026-10-15');
    update public.bf_listings set stock=1,weight_grams=500,length_cm=30,width_cm=20,height_cm=10 where seller_id='${bob}';`);
  await asUser(null);
  assert.equal((await rows("select * from public.bf_listings")).length, 1);
  await assert.rejects(
    rows("select * from public.bf_profiles"),
    /permission denied/,
  );
  await db.exec("reset role");
  await db.exec(`delete from public.bf_seller_applications where user_id='${bob}'`);
});
test("buyer cannot read another profile or change role", async () => {
  await asUser(alice);
  assert.equal((await rows("select * from public.bf_profiles")).length, 1);
  await assert.rejects(
    db.exec("update public.bf_accounts set role='superadmin'"),
    /permission denied/,
  );
});
test("owner can change display name but not ownership or timestamps", async () => {
  await asUser(alice);
  await db.exec("update public.bf_profiles set display_name='Nome atualizado'");
  assert.equal(
    (await rows("select display_name from public.bf_profiles"))[0][
      "display_name"
    ],
    "Nome atualizado",
  );
  await assert.rejects(
    db.exec(`update public.bf_profiles set id='${bob}'`),
    /permission denied/,
  );
  await assert.rejects(
    db.exec("update public.bf_profiles set updated_at='2000-01-01'"),
    /permission denied/,
  );
});
test("seller requests cannot be self-approved or forged for another user", async () => {
  await asUser(alice);
  await assert.rejects(
    db.exec(
      `insert into public.bf_seller_applications(user_id,display_name,person_type,status,policy_version) values('${alice}','Loja teste','individual','approved','2026-10-15')`,
    ),
    /row-level security/,
  );
  await assert.rejects(
    db.exec(
      `insert into public.bf_seller_applications(user_id,display_name,person_type,status,policy_version) values('${bob}','Loja teste','individual','pending','2026-10-15')`,
    ),
    /row-level security/,
  );
  await db.exec(
    `insert into public.bf_seller_applications(user_id,display_name,person_type,status,policy_version) values('${alice}','Loja teste','individual','pending','2026-10-15')`,
  );
  await assert.rejects(
    db.exec("update public.bf_seller_applications set status='approved'"),
    /permission denied/,
  );
});
test("admin requires MFA in database, not just UI", async () => {
  await asUser(staff);
  assert.equal(
    (await rows("select * from public.bf_seller_applications")).length,
    0,
  );
  assert.equal((await rows("select * from public.bf_audit_events")).length, 0);
  await asUser(staff, "aal2");
  assert.equal(
    (await rows("select * from public.bf_seller_applications")).length,
    1,
  );
  assert.ok((await rows("select * from public.bf_audit_events")).length > 0);
});
test("documents are private and uploads blocked until scanning is implemented", async () => {
  await asUser(alice);
  const docs = await rows("select * from storage.objects");
  assert.equal(docs.length, 1);
  assert.equal(docs[0]["name"], alice + "/document.pdf");
  await assert.rejects(
    db.exec(
      `insert into storage.objects(bucket_id,name) values('bf-seller-documents','${alice}/unsafe.pdf')`,
    ),
    /row-level security/,
  );
  await asUser(null);
  assert.equal((await rows("select * from storage.objects")).length, 0);
});
test("controlled items cannot be approved even through privileged database writes", async () => {
  await db.exec("reset role");
  await assert.rejects(
    db.exec(
      `insert into public.bf_listings(seller_id,category_slug,title,description,condition,price_cents,status,classification) values('${bob}','campo','Item controlado','Descrição suficientemente longa para teste.','new',10000,'approved','controlled')`,
    ),
    /only_free_approved/,
  );
});
test("relevant edit withdraws approved listing and requires new moderation", async () => {
  await db.exec("reset role");
  await db.exec(
    "update public.bf_listings set title='Mochila editada' where status='approved'",
  );
  await asUser(null);
  assert.equal((await rows("select * from public.bf_listings")).length, 0);
});
test("suspended seller publications are not public", async () => {
  await db.exec("reset role");
  await db.exec(
    `update public.bf_listings set status='approved';update public.bf_accounts set status='suspended' where id='${bob}'`,
  );
  await asUser(null);
  assert.equal((await rows("select * from public.bf_listings")).length, 0);
});
test("revoked sessions immediately lose private data access", async () => {
  await db.exec("reset role");
  await db.exec(`delete from auth.sessions where user_id='${alice}'`);
  await asUser(alice);
  assert.equal((await rows("select * from public.bf_profiles")).length, 0);
  assert.equal((await rows("select * from public.bf_accounts")).length, 0);
});
test("all application tables enable RLS and there are no public definer functions", async () => {
  await db.exec("reset role");
  const insecure = await rows(
    "select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity",
  );
  assert.equal(insecure.length, 0);
  assert.equal(
    (
      await rows(
        "select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and prosecdef",
      )
    ).length,
    0,
  );
});
test("authorization helper denies inactive accounts and AAL1", () => {
  assert.equal(canManage("admin", "aal1", true), false);
  assert.equal(canManage("buyer", "aal2", true), false);
  assert.equal(canManage("admin", "aal2", false), false);
  assert.equal(canManage("admin", "aal2", true), true);
});
test("redirect rejects external and protocol-relative destinations", () => {
  for (const target of [
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/\n/evil.test",
  ])
    assert.equal(safeNext(target), "/conta");
  assert.equal(safeNext("/redefinir-senha"), "/redefinir-senha");
});
test("input validation enforces password and institution limits", () => {
  assert.equal(passwordSchema.safeParse("short").success, false);
  assert.equal(
    profileSchema.safeParse({
      display_name: "Nome",
      institution: "Comando secreto",
    }).success,
    false,
  );
});

test("anonymous callers cannot enroll in Brasil Force", async () => {
  await asUser(null);
  await assert.rejects(
    db.exec("select public.bf_join('Membro anônimo','2026-10-15')"),
    /permission denied/,
  );
});
test("repeat enrollment cannot reactivate suspended accounts or change their role", async () => {
  await asUser(bob);
  await db.exec("select public.bf_join('Novo nome','2026-10-15')");
  await db.exec("reset role");
  const result = await db.query<{ role: string; status: string }>(
    "select role,status from public.bf_accounts where id=$1",
    [bob],
  );
  assert.equal(result.rows[0].role, "seller");
  assert.equal(result.rows[0].status, "suspended");
});
test("revoked session cannot join again", async () => {
  await asUser(alice);
  await assert.rejects(
    db.exec("select public.bf_join('Nome válido','2026-10-15')"),
    /Verified active session required/,
  );
});
test("unconfirmed email cannot create membership", async () => {
  await db.exec("reset role");
  await db.query("update auth.users set email_confirmed_at=null where id=$1", [
    staff,
  ]);
  await asUser(staff);
  await assert.rejects(
    db.exec("select public.bf_join('Nome válido','2026-10-15')"),
    /Verified active session required/,
  );
  await db.exec("reset role");
  await db.query("update auth.users set email_confirmed_at=now() where id=$1", [
    staff,
  ]);
});

async function reviewApplication(
  decision: string,
  version = 0,
  reason = "Análise inicial da solicitação.",
) {
  const application = (
    await rows("select id from public.bf_seller_applications")
  )[0];
  return db.query("select public.bf_review_seller($1,$2,$3,$4)", [
    application.id,
    decision,
    reason,
    version,
  ]);
}
test("review RPC requires real staff MFA and rejects self-service approval", async () => {
  await db.exec("reset role");
  await db.query("insert into auth.sessions(id,user_id) values($1,$2)", [
    sessions[alice],
    alice,
  ]);
  await asUser(alice);
  await assert.rejects(reviewApplication("in_review"), /Staff MFA required/);
  await asUser(staff);
  await assert.rejects(
    db.exec(
      "select public.bf_review_seller(gen_random_uuid(),'in_review','Motivo suficientemente longo',0)",
    ),
    /Staff MFA required/,
  );
  await asUser(staff, "aal2");
  await assert.rejects(reviewApplication("approved"), /Invalid transition/);
});
test("review stores reason, actor and version atomically, stale decisions fail", async () => {
  await asUser(staff, "aal2");
  await reviewApplication("in_review");
  const events = await rows("select * from public.bf_seller_review_events");
  assert.equal(events.length, 1);
  assert.equal(events[0].actor_id, staff);
  assert.equal(events[0].to_status, "in_review");
  await assert.rejects(reviewApplication("rejected", 0), /Revision conflict/);
  assert.equal(
    (await rows("select * from public.bf_seller_review_events")).length,
    1,
  );
  await assert.rejects(
    reviewApplication("changes_requested", 1, " "),
    /Invalid reason/,
  );
  await reviewApplication(
    "changes_requested",
    1,
    "Corrija o nome comercial informado.",
  );
});
test("owner sees feedback and resubmits without granting seller permissions", async () => {
  await asUser(alice);
  const application = (
    await rows("select id from public.bf_seller_applications")
  )[0];
  assert.equal(
    (await rows("select * from public.bf_seller_review_events")).length,
    2,
  );
  await db.query("select public.bf_resubmit_seller($1,$2,$3,$4)", [
    application.id,
    "Loja corrigida",
    "company",
    2,
  ]);
  assert.equal(
    (await rows("select status from public.bf_seller_applications"))[0].status,
    "pending",
  );
  assert.equal(
    (await rows("select role from public.bf_accounts"))[0].role,
    "buyer",
  );
  await assert.rejects(
    db.query("select public.bf_resubmit_seller($1,$2,$3,$4)", [
      application.id,
      "Novo nome",
      "company",
      3,
    ]),
    /Corrections not requested/,
  );
  await assert.rejects(
    db.exec("delete from public.bf_seller_review_events"),
    /permission denied/,
  );
});
test("review history is private and foreign resubmission is rejected", async () => {
  await db.exec("reset role");
  const id = (await rows("select id from public.bf_seller_applications"))[0].id;
  await db.exec(
    `update public.bf_accounts set status='active' where id='${bob}'`,
  );
  await asUser(bob);
  assert.equal(
    (await rows("select * from public.bf_seller_review_events")).length,
    0,
  );
  await assert.rejects(
    db.query("select public.bf_resubmit_seller($1,$2,$3,$4)", [
      id,
      "Loja indevida",
      "individual",
      3,
    ]),
    /Application not available/,
  );
  await asUser(null);
  await assert.rejects(
    rows("select * from public.bf_seller_review_events"),
    /permission denied/,
  );
  await assert.rejects(
    db.query("select public.bf_review_seller($1,$2,$3,$4)", [
      id,
      "rejected",
      "Motivo suficientemente longo",
      3,
    ]),
    /permission denied/,
  );
});
test("rejection has a reason and cannot be overwritten by a subsequent decision", async () => {
  await asUser(staff, "aal2");
  await reviewApplication(
    "rejected",
    3,
    "Solicitação incompatível com as regras publicadas.",
  );
  await assert.rejects(reviewApplication("in_review", 4), /Invalid transition/);
});

test('listing drafts require an approved seller, not merely login or seller role', async () => {
 await asUser(alice);
 await assert.rejects(db.query("select public.bf_save_listing($1,0,$2::jsonb)",['20000000-0000-0000-0000-000000000001',JSON.stringify(draftData)]),/Approved seller required/);
 await asUser(bob);
 await assert.rejects(db.query("select public.bf_save_listing($1,0,$2::jsonb)",['20000000-0000-0000-0000-000000000001',JSON.stringify(draftData)]),/Approved seller required/);
 await db.exec('reset role');
 await db.exec(`insert into public.bf_seller_applications(user_id,display_name,person_type,status,policy_version) values('${bob}','Vendedor local','individual','approved','2026-10-15')`);
});
const draftId='20000000-0000-0000-0000-000000000001';
const draftData={title:'Mochila de teste local',description:'Descrição detalhada de um produto apenas para teste local.',category_slug:'campo',condition:'new',price_cents:25000,stock:2,brand:'Marca',model:'Modelo',weight_grams:500,length_cm:30,width_cm:20,height_cm:10,dispatch_business_days:3};
test('draft saves trusted owner and classification and rejects stale repeated saves',async()=>{
 await asUser(bob);
 await db.query('select public.bf_save_listing($1,0,$2::jsonb)',[draftId,JSON.stringify(draftData)]);
 const r=(await db.query<Record<string,unknown>>('select seller_id,status,classification,revision from public.bf_listings where id=$1',[draftId])).rows[0];
 assert.equal(r.seller_id,bob);assert.equal(r.status,'draft');assert.equal(r.classification,'additional_review');assert.equal(r.revision,1);
 await assert.rejects(db.query('select public.bf_save_listing($1,0,$2::jsonb)',[draftId,JSON.stringify(draftData)]),/Revision conflict/);
 await assert.rejects(db.query('select public.bf_save_listing($1,1,$2::jsonb)',[draftId,JSON.stringify({...draftData,status:'approved'})]),/Invalid listing fields/);
 await asUser(null);
 assert.equal((await db.query('select id from public.bf_listings where id=$1',[draftId])).rows.length,0);
});
test('submission queues for moderation and locks pending content edits',async()=>{
 await asUser(bob);
 await db.query('select public.bf_transition_listing($1,1,$2)',[draftId,'submit']);
 assert.equal((await db.query<Record<string,unknown>>('select status from public.bf_listings where id=$1',[draftId])).rows[0].status,'pending');
 await assert.rejects(db.query('select public.bf_save_listing($1,2,$2::jsonb)',[draftId,JSON.stringify(draftData)]),/Listing not editable/);
 await assert.rejects(db.query('select public.bf_transition_listing($1,2,$2)',[draftId,'approve']),/Invalid action/);
 await db.query('select public.bf_transition_listing($1,2,$2)',[draftId,'pause']);
});
test('editing approved content withdraws publication and resets classification',async()=>{
 await db.exec('reset role');await db.query("update public.bf_listings set status='approved',classification='free' where id=$1",[draftId]);
 await asUser(bob);await db.query('select public.bf_save_listing($1,3,$2::jsonb)',[draftId,JSON.stringify({...draftData,stock:5})]);
 const r=(await db.query<Record<string,unknown>>('select status,classification from public.bf_listings where id=$1',[draftId])).rows[0];
 assert.equal(r.status,'pending');assert.equal(r.classification,'additional_review');
 await asUser(null);assert.equal((await db.query('select id from public.bf_listings where id=$1',[draftId])).rows.length,0);
});
test('seller cannot edit foreign listing and suspended seller cannot save',async()=>{
 await db.exec('reset role');
 await db.exec(`update public.bf_accounts set role='seller' where id='${alice}'; update public.bf_seller_applications set status='approved' where user_id='${alice}'`);
 await asUser(alice);await assert.rejects(db.query('select public.bf_save_listing($1,4,$2::jsonb)',[draftId,JSON.stringify(draftData)]),/Listing not available/);
 await db.exec('reset role');await db.exec(`update public.bf_accounts set status='suspended' where id='${bob}'`);
 await asUser(bob);await assert.rejects(db.query('select public.bf_save_listing($1,4,$2::jsonb)',[draftId,JSON.stringify(draftData)]),/Approved seller required/);
});
