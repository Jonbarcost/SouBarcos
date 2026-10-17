import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { database, ids, session } from "./helpers/database";
let context: Awaited<ReturnType<typeof database>>;
before(async () => {
  context = await database();
});
after(async () => context?.db.close());
const quota = async () =>
  (
    await context.db.query<{ allowed: boolean }>(
      "select public.bf_ai_consume_quota() allowed",
    )
  ).rows[0].allowed;
test("SQL quota permits five requests then blocks, and cannot be reset by the user", async () => {
  await context.as(ids.buyer);
  assert.deepEqual(await Promise.all(Array.from({ length: 8 }, quota)), [
    true,
    true,
    true,
    true,
    true,
    false,
    false,
    false,
  ]);
  await assert.rejects(
    context.db.exec("delete from public.bf_ai_usage_limits"),
    /permission denied/,
  );
});
test("quota identity isolation and daily cap are enforced", async () => {
  await context.as(ids.seller);
  assert.equal(await quota(), true);
  await context.db.exec("reset role");
  await context.db.query(
    "update public.bf_ai_usage_limits set requests=60 where actor_id=$1 and window_kind='day'",
    [ids.seller],
  );
  await context.as(ids.seller);
  assert.equal(await quota(), false);
});
test("quota rejects anonymous, unconfirmed, revoked and suspended users", async () => {
  await context.as(null);
  await assert.rejects(quota(), /permission denied/);
  await context.db.exec("reset role");
  await context.db.query(
    "update auth.users set email_confirmed_at=null where id=$1",
    [ids.admin],
  );
  await context.as(ids.admin, "aal2");
  assert.equal(await quota(), false);
  await context.db.exec("reset role");
  await context.db.query("delete from auth.sessions where id=$1", [
    session(ids.moderator),
  ]);
  await context.as(ids.moderator, "aal2");
  assert.equal(await quota(), false);
  await context.db.exec("reset role");
  await context.db.query(
    "update public.bf_accounts set status='suspended' where id=$1",
    [ids.seller],
  );
  await context.as(ids.seller);
  assert.equal(await quota(), false);
});
