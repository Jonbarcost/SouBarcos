import { before, test } from "node:test";
import assert from "node:assert/strict";
import { setTimeout as pause } from "node:timers/promises";
import {
  testEnvironment,
  actor,
  configureTestPolicies,
  sellerApplication,
  approvedSeller,
  draftListing,
  draft,
  checked,
} from "../../scripts/first-seller/fixtures.mjs";
let env, admin;
const reason = "TESTE — concorrência em PostgreSQL isolado.";
before(async () => {
  env = await testEnvironment();
  await configureTestPolicies(env);
  admin = await actor(env, "admin", true);
});
async function eligible() {
  const user = await actor(env);
  const app = await sellerApplication(user);
  checked(
    await admin.client.rpc("bf_review_seller", {
      p_id: app.id,
      p_revision: 0,
      p_decision: "in_review",
      p_reason: reason,
    }),
    "start review",
  );
  checked(
    await admin.client.rpc("bf_verify_seller", {
      p_id: app.id,
      p_revision: 1,
      p_policy_version: "TEST-ONLY-v1",
      p_checks: ["identity", "commercial", "policy"],
      p_reference: "TEST-ONLY-CONCURRENCY",
    }),
    "record evidence",
  );
  return { user, app };
}
async function waitForLocks(db, functionName, count = 2) {
  for (let i = 0; i < 100; i++) {
    await db.query("select pg_stat_clear_snapshot()");
    const r = await db.query(
      "select count(distinct pid)::integer n from pg_stat_activity where datname=current_database() and wait_event_type='Lock' and query ilike $1",
      ["%" + functionName + "%"],
    );
    if (r.rows[0].n >= count) return;
    await pause(50);
  }
  throw Error(
    "Did not observe the expected independent PostgreSQL lock waiters.",
  );
}
async function raceUnderLock(table, id, functionName, operations) {
  const lock = await env.connect();
  try {
    await lock.query("begin");
    await lock.query(`select id from public.${table} where id=$1 for update`, [
      id,
    ]);
    const results = Promise.all(operations.map((fn) => fn()));
    await waitForLocks(lock, functionName);
    await lock.query("commit");
    return await results;
  } finally {
    await lock.query("rollback").catch(() => {});
    await lock.end();
  }
}
test("two real Data API approval transactions serialize on different PostgreSQL backends", async () => {
  const { user, app } = await eligible();
  const call = () =>
    admin.client.rpc("bf_review_seller", {
      p_id: app.id,
      p_revision: 1,
      p_decision: "approved",
      p_reason: reason,
    });
  const results = await raceUnderLock(
    "bf_seller_applications",
    app.id,
    "bf_review_seller",
    [call, call],
  );
  assert.equal(results.filter((r) => !r.error).length, 1);
  assert.deepEqual(
    results.filter((r) => r.error).map((r) => r.error.code),
    ["40001"],
  );
  const db = await env.connect();
  try {
    assert.equal(
      (
        await db.query(
          "select count(*)::integer n from bf_seller_review_events where application_id=$1 and to_status='approved'",
          [app.id],
        )
      ).rows[0].n,
      1,
    );
    assert.equal(
      (await db.query("select role from bf_accounts where id=$1", [user.id]))
        .rows[0].role,
      "seller",
    );
  } finally {
    await db.end();
  }
});
test("failed audit insert rolls back seller role, state, revision and generic audit", async () => {
  const { user, app } = await eligible();
  const db = await env.connect();
  try {
    await db.query(
      `create schema if not exists bf_test_control;create or replace function bf_test_control.fail_approval() returns trigger language plpgsql as $$begin if new.application_id='${app.id}'::uuid and new.to_status='approved' then raise exception 'TEST audit failure' using errcode='23514';end if;return new;end$$;create trigger test_fail_approval before insert on public.bf_seller_review_events for each row execute function bf_test_control.fail_approval();`,
    );
    const before = (
      await db.query(
        "select count(*)::integer n from bf_audit_events where entity_id in ($1,$2)",
        [app.id, user.id],
      )
    ).rows[0].n;
    const result = await admin.client.rpc("bf_review_seller", {
      p_id: app.id,
      p_revision: 1,
      p_decision: "approved",
      p_reason: reason,
    });
    assert.equal(result.error?.code, "23514");
    assert.deepEqual(
      (
        await db.query(
          "select status,revision from bf_seller_applications where id=$1",
          [app.id],
        )
      ).rows[0],
      { status: "in_review", revision: 1 },
    );
    assert.equal(
      (await db.query("select role from bf_accounts where id=$1", [user.id]))
        .rows[0].role,
      "buyer",
    );
    assert.equal(
      (
        await db.query(
          "select count(*)::integer n from bf_audit_events where entity_id in ($1,$2)",
          [app.id, user.id],
        )
      ).rows[0].n,
      before,
    );
  } finally {
    await db.query(
      "drop trigger if exists test_fail_approval on public.bf_seller_review_events;drop function if exists bf_test_control.fail_approval()",
    );
    await db.end();
  }
});
test("concurrent updates to the same draft preserve one revision and one winning payload", async () => {
  const seller = await approvedSeller(env, admin);
  const id = await draftListing(seller);
  const save = () =>
    seller.client.rpc("bf_save_listing", {
      p_id: id,
      p_revision: 1,
      p_data: { ...draft, stock: 5 },
    });
  const results = await raceUnderLock("bf_listings", id, "bf_save_listing", [
    save,
    save,
  ]);
  assert.equal(results.filter((r) => !r.error).length, 1);
  assert.equal(results.find((r) => r.error)?.error.code, "40001");
});
test("two moderation decisions serialize; seller suspension blocks approval after waiting", async () => {
  const seller = await approvedSeller(env, admin);
  const id = await draftListing(seller);
  checked(
    await seller.client.rpc("bf_transition_listing", {
      p_id: id,
      p_revision: 1,
      p_action: "submit",
    }),
    "submit",
  );
  const review = () =>
    admin.client.rpc("bf_review_listing", {
      p_id: id,
      p_revision: 2,
      p_decision: "in_review",
      p_classification: "additional_review",
      p_reason: reason,
      p_internal_note: "TEST-ONLY INTERNAL",
    });
  const results = await raceUnderLock("bf_listings", id, "bf_review_listing", [
    review,
    review,
  ]);
  assert.equal(results.filter((r) => !r.error).length, 1);
  assert.equal(results.find((r) => r.error)?.error.code, "40001");
  const lock = await env.connect();
  try {
    await lock.query("begin");
    await lock.query("update bf_accounts set status='suspended' where id=$1", [
      seller.id,
    ]);
    const pending = admin.client
      .rpc("bf_review_listing", {
        p_id: id,
        p_revision: 3,
        p_decision: "approved",
        p_classification: "free",
        p_reason: reason,
        p_internal_note: "",
      })
      .then((r) => r);
    await waitForLocks(lock, "bf_review_listing", 1);
    await lock.query("commit");
    assert.equal((await pending).error?.code, "42501");
    assert.equal(
      (await lock.query("select status from bf_listings where id=$1", [id]))
        .rows[0].status,
      "in_review",
    );
  } finally {
    await lock.query("rollback").catch(() => {});
    await lock.end();
  }
});
test("terminated PostgreSQL transaction rolls back unpublished state", async () => {
  const { app } = await eligible();
  const writer = await env.connect(),
    observer = await env.connect();
  try {
    const pid = (await writer.query("select pg_backend_pid() pid")).rows[0].pid;
    writer.on("error", () => {});
    await writer.query("begin");
    await writer.query(
      "update bf_seller_applications set status='rejected' where id=$1",
      [app.id],
    );
    assert.equal(
      (
        await observer.query(
          "select status from bf_seller_applications where id=$1",
          [app.id],
        )
      ).rows[0].status,
      "in_review",
    );
    await observer.query("select pg_terminate_backend($1)", [pid]);
    assert.equal(
      (
        await observer.query(
          "select status from bf_seller_applications where id=$1",
          [app.id],
        )
      ).rows[0].status,
      "in_review",
    );
  } finally {
    await writer.end().catch(() => {});
    await observer.end();
  }
});
test("eight simultaneous real quota calls admit exactly five requests", async () => {
  const buyer = await actor(env);
  const results = await Promise.all(
    Array.from({ length: 8 }, () => buyer.client.rpc("bf_ai_consume_quota")),
  );
  assert.ok(results.every((r) => !r.error));
  assert.equal(results.filter((r) => r.data === true).length, 5);
});
