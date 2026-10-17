import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { database, ids } from "./helpers/database";
let c: Awaited<ReturnType<typeof database>>;
const listing = "20000000-0000-4000-8000-000000000021";
const data = {
  title: "Mochila local de teste",
  description: "Descrição suficientemente detalhada do equipamento.",
  category_slug: "campo",
  condition: "new",
  price_cents: 25000,
  stock: 2,
  weight_grams: 500,
  length_cm: 30,
  width_cm: 20,
  height_cm: 10,
  dispatch_business_days: 3,
};
before(async () => {
  c = await database();
  await c.db.exec("reset role");
  await c.db.query("update public.bf_accounts set role='seller' where id=$1", [
    ids.seller,
  ]);
  await c.db.query(
    "insert into public.bf_seller_applications(user_id,display_name,person_type,status,policy_version) values($1,'Teste','individual','approved','2026-10-15')",
    [ids.seller],
  );
  await c.as(ids.seller);
  await c.db.query("select public.bf_save_listing($1,0,$2)", [
    listing,
    JSON.stringify(data),
  ]);
  await c.db.query("select public.bf_transition_listing($1,1,'submit')", [
    listing,
  ]);
});
after(async () => c?.db.close());
const review = (
  decision: string,
  revision: number,
  classification = "additional_review",
) =>
  c.db.query("select public.bf_review_listing($1,$2,$3,$4,$5,$6)", [
    listing,
    revision,
    decision,
    classification,
    "Retorno claro para o vendedor.",
    "Nota confidencial da equipe.",
  ]);
test("listing review requires staff MFA, cannot self-approve and rejects stale versions", async () => {
  await c.as(ids.buyer);
  await assert.rejects(review("approved", 2, "free"), /Staff MFA required/);
  await c.as(ids.moderator);
  await assert.rejects(review("in_review", 2), /Staff MFA required/);
  await c.db.exec("reset role");
  await c.db.query("update public.bf_accounts set role='admin' where id=$1", [
    ids.seller,
  ]);
  await c.as(ids.seller, "aal2");
  await assert.rejects(review("approved", 2, "free"), /Listing not available/);
  await c.db.exec("reset role");
  await c.db.query("update public.bf_accounts set role='seller' where id=$1", [
    ids.seller,
  ]);
  await c.as(ids.moderator, "aal2");
  await assert.rejects(review("approved", 2, "free"), /Invalid transition/);
  await review("in_review", 2);
  await assert.rejects(review("rejected", 2), /Revision conflict/);
});
test("moderator requests changes; seller sees feedback but never internal notes", async () => {
  await c.as(ids.moderator, "aal2");
  await review("changes_requested", 3);
  await c.as(ids.seller);
  assert.equal(
    (await c.db.query("select reason from public.bf_listing_review_events"))
      .rows.length,
    2,
  );
  assert.equal(
    (await c.db.query("select * from public.bf_listing_review_notes")).rows
      .length,
    0,
  );
  await c.as(ids.buyer);
  assert.equal(
    (await c.db.query("select * from public.bf_listing_review_events")).rows
      .length,
    0,
  );
  await c.as(ids.seller);
  await c.db.query("select public.bf_save_listing($1,4,$2)", [
    listing,
    JSON.stringify(data),
  ]);
  await c.db.query("select public.bf_transition_listing($1,5,'submit')", [
    listing,
  ]);
  await c.as(ids.moderator, "aal2");
  await review("in_review", 6);
  await review("approved", 7, "free");
});
test("public catalog exposes approved stocked ordinary listings only; approval has audit", async () => {
  await c.as(null);
  assert.equal(
    (
      await c.db.query("select id from public.bf_listings where id=$1", [
        listing,
      ])
    ).rows.length,
    1,
  );
  await assert.rejects(review("approved", 8, "free"), /permission denied/);
  await c.as(ids.admin, "aal2");
  const event = (
    await c.db.query<{ actor_id: string; to_status: string }>(
      "select actor_id,to_status from public.bf_listing_review_events order by revision desc limit 1",
    )
  ).rows[0];
  assert.equal(event.actor_id, ids.moderator);
  assert.equal(event.to_status, "approved");
  assert.equal(
    (await c.db.query("select * from public.bf_listing_review_notes")).rows
      .length,
    4,
  );
  for (const sql of [
    "update public.bf_listings set stock=0 where id=$1",
    "update public.bf_accounts set status='suspended' where id=$1",
    "update public.bf_seller_applications set status='rejected' where user_id=$1",
  ]) {
    await c.db.exec("reset role");
    await c.db.query(sql, [sql.includes("bf_listings") ? listing : ids.seller]);
    await c.as(null);
    assert.equal(
      (
        await c.db.query("select id from public.bf_listings where id=$1", [
          listing,
        ])
      ).rows.length,
      0,
    );
    await c.db.exec("reset role");
    await c.db.query(
      "update public.bf_listings set stock=2,status='approved' where id=$1",
      [listing],
    );
    await c.db.query(
      "update public.bf_accounts set status='active' where id=$1",
      [ids.seller],
    );
    await c.db.query(
      "update public.bf_seller_applications set status='approved' where user_id=$1",
      [ids.seller],
    );
  }
});
test("controlled/prohibited classifications cannot be laundered into free approval", async () => {
  for (const classification of ["controlled", "prohibited"]) {
    await c.db.exec("reset role");
    await c.db.query(
      "update public.bf_listings set status='in_review',classification=$2 where id=$1",
      [listing, classification],
    );
    await c.as(ids.admin, "aal2");
    await assert.rejects(
      review("approved", 8, "free"),
      /Restricted classification/,
    );
  }
  await c.db.exec("reset role");
  await c.db.query(
    "update public.bf_listings set classification='additional_review' where id=$1",
    [listing],
  );
  await c.as(ids.admin, "aal2");
  await assert.rejects(
    review("approved", 8, "controlled"),
    /Only ordinary products/,
  );
});
test("approval checks active seller, stock, category and packaging; rejection is terminal", async () => {
  await c.db.exec("reset role");
  await c.db.query(
    "update public.bf_listings set weight_grams=null where id=$1",
    [listing],
  );
  await c.as(ids.admin, "aal2");
  await assert.rejects(review("approved", 8, "free"), /Incomplete listing/);
  await review("rejected", 8, "prohibited");
  await assert.rejects(review("in_review", 9), /Invalid transition/);
  await c.as(ids.seller);
  await assert.rejects(
    c.db.query("select public.bf_save_listing($1,9,$2)", [
      listing,
      JSON.stringify(data),
    ]),
    /Listing not editable/,
  );
});
test("seller corrections cannot erase a controlled or prohibited moderation classification", async () => {
  for (const classification of ["controlled", "prohibited"]) {
    await c.db.exec("reset role");
    await c.db.query(
      "update public.bf_listings set status='changes_requested',classification=$2 where id=$1",
      [listing, classification],
    );
    const revision = (
      await c.db.query<{ revision: number }>(
        "select revision from public.bf_listings where id=$1",
        [listing],
      )
    ).rows[0].revision;
    await c.as(ids.seller);
    await c.db.query("select public.bf_save_listing($1,$2,$3)", [
      listing,
      revision,
      JSON.stringify(data),
    ]);
    assert.equal(
      (
        await c.db.query<{ classification: string }>(
          "select classification from public.bf_listings where id=$1",
          [listing],
        )
      ).rows[0].classification,
      classification,
    );
  }
});
test("public listing projection hides withdrawn sellers even from the owner and staff", async () => {
  await c.db.exec("reset role");
  await c.db.query(
    "update public.bf_listings set status='approved',classification='free',weight_grams=500 where id=$1",
    [listing],
  );
  // A content reclassification may requeue; publish fixture separately as database owner.
  await c.db.query(
    "update public.bf_listings set status='approved' where id=$1",
    [listing],
  );
  await c.as(ids.seller);
  assert.equal(
    (
      await c.db.query("select id from public.bf_public_listings where id=$1", [
        listing,
      ])
    ).rows.length,
    1,
  );
  await c.db.exec("reset role");
  await c.db.query(
    "update public.bf_seller_applications set status='rejected' where user_id=$1",
    [ids.seller],
  );
  for (const actor of [ids.seller, ids.admin]) {
    await c.as(actor, "aal2");
    assert.equal(
      (
        await c.db.query(
          "select id from public.bf_public_listings where id=$1",
          [listing],
        )
      ).rows.length,
      0,
    );
  }
});
