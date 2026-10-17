import { before, test } from "node:test";
import assert from "node:assert/strict";
import {
  testEnvironment,
  actor,
  configureTestPolicies,
  sellerApplication,
  approvedSeller,
  draftListing,
  checked,
} from "../../scripts/first-seller/fixtures.mjs";
let env, admin, moderator;
const reason = "TESTE — decisão somente na homologação isolada.";
const review = (client, id, revision, decision) =>
  client.rpc("bf_review_seller", {
    p_id: id,
    p_revision: revision,
    p_decision: decision,
    p_reason: reason,
  });
const verify = (id, revision) =>
  admin.client.rpc("bf_verify_seller", {
    p_id: id,
    p_revision: revision,
    p_policy_version: "TEST-ONLY-v1",
    p_checks: ["identity", "commercial", "policy"],
    p_reference: "TEST-ONLY-REFERENCE",
  });
before(async () => {
  env = await testEnvironment();
  await configureTestPolicies(env);
  admin = await actor(env, "admin", true);
  moderator = await actor(env, "moderator", true);
});
test("real Auth rejects AAL1, forged JWT, unconfirmed email and revoked privileged session", async () => {
  const buyer = await actor(env);
  const app = await sellerApplication(buyer);
  const aal1 = env.client();
  checked(
    await aal1.auth.signInWithPassword({
      email: admin.email,
      password: admin.password,
    }),
    "AAL1 sign in",
  );
  assert.equal(
    (await review(aal1, app.id, 0, "in_review")).error?.code,
    "42501",
  );
  assert.equal(
    (await review(buyer.client, app.id, 0, "approved")).error?.code,
    "42501",
  );
  const session = checked(
    await admin.client.auth.getSession(),
    "read test session",
  ).session;
  const pieces = session.access_token.split(".");
  const claims = JSON.parse(Buffer.from(pieces[1], "base64url"));
  claims.role = "service_role";
  pieces[1] = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const forged = await fetch(env.apiUrl + "/rest/v1/bf_accounts", {
    headers: {
      apikey: env.anonKey,
      Authorization: "Bearer " + pieces.join("."),
    },
  });
  assert.equal(forged.status, 401);
  const unconfirmedEmail = `unconfirmed-${crypto.randomUUID()}@bf-e2e.invalid`;
  const unconfirmed = env.client();
  checked(
    await unconfirmed.auth.signUp({
      email: unconfirmedEmail,
      password: "Test-only-unconfirmed-Password123!",
    }),
    "unconfirmed sign up",
  );
  assert.equal(
    (
      await unconfirmed.auth.signInWithPassword({
        email: unconfirmedEmail,
        password: "Test-only-unconfirmed-Password123!",
      })
    ).error?.code,
    "email_not_confirmed",
  );
  const disposable = await actor(env, "admin", true);
  const old = checked(
    await disposable.client.auth.getSession(),
    "get revocable session",
  ).session.access_token;
  checked(
    await disposable.client.auth.signOut({ scope: "global" }),
    "revoke test session",
  );
  const revoked = await fetch(env.apiUrl + "/rest/v1/rpc/bf_review_seller", {
    method: "POST",
    headers: {
      apikey: env.anonKey,
      Authorization: "Bearer " + old,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_id: app.id,
      p_revision: 0,
      p_decision: "in_review",
      p_reason: reason,
    }),
  });
  assert.ok([401, 403].includes(revoked.status));
});
test("policy, evidence, version, role and privacy gates hold against the real Data API", async () => {
  const buyer = await actor(env);
  const other = await actor(env);
  const app = await sellerApplication(buyer);
  checked(await review(admin.client, app.id, 0, "in_review"), "start review");
  assert.equal(
    (await review(admin.client, app.id, 1, "approved")).error?.code,
    "22023",
  );
  assert.equal(
    (await review(moderator.client, app.id, 1, "approved")).error?.code,
    "42501",
  );
  checked(await verify(app.id, 1), "record isolated evidence");
  const db = await env.connect();
  try {
    await db.query(
      "update public.bf_seller_verifications set expires_at=now()-interval '1 second' where application_id=$1",
      [app.id],
    );
  } finally {
    await db.end();
  }
  assert.equal(
    (await review(admin.client, app.id, 1, "approved")).error?.code,
    "22023",
  );
  checked(await verify(app.id, 1), "fresh evidence");
  assert.equal(
    (await review(admin.client, app.id, 0, "approved")).error?.code,
    "40001",
  );
  checked(
    await review(admin.client, app.id, 1, "approved"),
    "approve eligible seller",
  );
  assert.equal(
    checked(
      await buyer.client
        .from("bf_accounts")
        .select("role")
        .eq("id", buyer.id)
        .single(),
      "read own role",
    ).role,
    "seller",
  );
  assert.equal(
    checked(
      await other.client
        .from("bf_seller_review_events")
        .select("id")
        .eq("application_id", app.id),
      "history privacy",
    ).length,
    0,
  );
  assert.equal(
    checked(
      await buyer.client.from("bf_seller_verifications").select("id"),
      "evidence privacy",
    ).length,
    0,
  );
  assert.equal(
    (await review(admin.client, app.id, 2, "rejected")).error?.code,
    "22023",
  );
});
test("real Storage denies document upload and cross-owner access", async () => {
  const buyer = await actor(env);
  const other = await actor(env);
  const path = buyer.id + "/TEST-ONLY.pdf";
  const upload = await buyer.client.storage
    .from("bf-seller-documents")
    .upload(
      path,
      new Blob(["%PDF-1.7\nTEST — no personal document"], {
        type: "application/pdf",
      }),
    );
  assert.ok(upload.error);
  assert.equal(Number(upload.error.statusCode), 403);
  const db = await env.connect();
  try {
    await db.query(
      "insert into storage.objects(bucket_id,name) values('bf-seller-documents',$1)",
      [path],
    );
  } finally {
    await db.end();
  }
  const own = await buyer.client.storage
    .from("bf-seller-documents")
    .list(buyer.id);
  assert.equal(own.error, null);
  assert.equal(own.data.length, 1);
  const foreign = await other.client.storage
    .from("bf-seller-documents")
    .list(buyer.id);
  assert.equal(foreign.data?.length, 0);
  assert.ok(
    (
      await other.client.storage
        .from("bf-seller-documents")
        .createSignedUrl(path, 30)
    ).error,
  );
});
test("different sellers cannot read or edit private drafts or internal notes", async () => {
  const a = await approvedSeller(env, admin),
    b = await approvedSeller(env, admin);
  const id = await draftListing(a);
  assert.equal(
    checked(
      await b.client.from("bf_listings").select("id").eq("id", id),
      "draft privacy",
    ).length,
    0,
  );
  assert.equal(
    (
      await b.client.rpc("bf_transition_listing", {
        p_id: id,
        p_revision: 1,
        p_action: "submit",
      })
    ).error?.code,
    "42501",
  );
  assert.equal(
    checked(
      await env.client().from("bf_public_listings").select("id").eq("id", id),
      "anonymous draft privacy",
    ).length,
    0,
  );
  assert.equal(
    checked(
      await a.client.from("bf_listing_review_notes").select("id"),
      "internal notes privacy",
    ).length,
    0,
  );
});
test("company policy requires the configured fiscal check and approval grants store capability", async () => {
  const company = await actor(env);
  checked(
    await company.client
      .from("bf_seller_applications")
      .insert({
        user_id: company.id,
        display_name: "TESTE — empresa não comercial",
        person_type: "company",
        policy_version: "2026-10-15",
      }),
    "company application",
  );
  const app = checked(
    await company.client.from("bf_seller_applications").select("id").single(),
    "company application read",
  );
  checked(await review(admin.client, app.id, 0, "in_review"), "company review");
  const parameters = {
    p_id: app.id,
    p_revision: 1,
    p_policy_version: "TEST-ONLY-v1",
    p_checks: ["identity", "commercial", "policy"],
    p_reference: "TEST-ONLY-COMPANY",
  };
  assert.equal(
    (await admin.client.rpc("bf_verify_seller", parameters)).error?.code,
    "22023",
  );
  checked(
    await admin.client.rpc("bf_verify_seller", {
      ...parameters,
      p_checks: ["identity", "fiscal", "commercial", "policy"],
    }),
    "company evidence",
  );
  checked(
    await review(admin.client, app.id, 1, "approved"),
    "company approval",
  );
  assert.equal(
    checked(
      await company.client.from("bf_accounts").select("role").single(),
      "company role",
    ).role,
    "store",
  );
});
test("real moderation corrections, restricted classifications, removal and private notes preserve history", async () => {
  const seller = await approvedSeller(env, admin);
  const id = await draftListing(seller);
  const transition = async (revision) =>
    checked(
      await seller.client.rpc("bf_transition_listing", {
        p_id: id,
        p_revision: revision,
        p_action: "submit",
      }),
      "submit test listing",
    );
  const decision = async (
    revision,
    status,
    classification = "additional_review",
  ) =>
    checked(
      await moderator.client.rpc("bf_review_listing", {
        p_id: id,
        p_revision: revision,
        p_decision: status,
        p_classification: classification,
        p_reason: reason,
        p_internal_note: "TEST-ONLY INTERNAL NOTE",
      }),
      "moderate isolated listing",
    );
  await transition(1);
  await decision(2, "in_review");
  await decision(3, "changes_requested");
  assert.equal(
    checked(
      await seller.client
        .from("bf_listing_review_events")
        .select("id")
        .eq("listing_id", id),
      "seller feedback",
    ).length,
    2,
  );
  assert.equal(
    checked(
      await seller.client.from("bf_listing_review_notes").select("id"),
      "private notes",
    ).length,
    0,
  );
  checked(
    await seller.client.rpc("bf_save_listing", {
      p_id: id,
      p_revision: 4,
      p_data: (await import("../../scripts/first-seller/fixtures.mjs")).draft,
    }),
    "correct test listing",
  );
  await transition(5);
  await decision(6, "in_review");
  await decision(7, "approved", "free");
  assert.equal(
    checked(
      await env.client().from("bf_public_listings").select("id").eq("id", id),
      "public fixture",
    ).length,
    1,
  );
  await decision(8, "removed", "prohibited");
  assert.equal(
    checked(
      await env.client().from("bf_public_listings").select("id").eq("id", id),
      "removed fixture",
    ).length,
    0,
  );
  assert.equal(
    checked(
      await seller.client
        .from("bf_listings")
        .select("status")
        .eq("id", id)
        .single(),
      "removed status",
    ).status,
    "removed",
  );
  for (const classification of ["controlled", "prohibited"]) {
    const restricted = await draftListing(seller);
    const db = await env.connect();
    try {
      await db.query(
        "update bf_listings set status='in_review',classification=$2 where id=$1",
        [restricted, classification],
      );
    } finally {
      await db.end();
    }
    assert.equal(
      (
        await moderator.client.rpc("bf_review_listing", {
          p_id: restricted,
          p_revision: 1,
          p_decision: "approved",
          p_classification: "free",
          p_reason: reason,
          p_internal_note: "",
        })
      ).error?.code,
      "22023",
    );
  }
});
test("a correctly signed expired local access token is rejected by the real API", async () => {
  const { createHmac } = await import("node:crypto");
  const { cli } = await import("../../scripts/first-seller/isolation.mjs");
  const localStatus = JSON.parse(cli(["status", "--output", "json"]));
  const user = await actor(env);
  const access = checked(await user.client.auth.getSession(), "local access")
    .session.access_token;
  const claims = JSON.parse(Buffer.from(access.split(".")[1], "base64url"));
  const sign = (expiration) => {
    const data =
      Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
        "base64url",
      ) +
      "." +
      Buffer.from(
        JSON.stringify({
          ...claims,
          iat: Math.floor(Date.now() / 1000) - 120,
          exp: expiration,
        }),
      ).toString("base64url");
    return (
      data +
      "." +
      createHmac("sha256", localStatus.JWT_SECRET)
        .update(data)
        .digest("base64url")
    );
  };
  const call = (token) =>
    fetch(env.apiUrl + "/rest/v1/bf_accounts?select=id", {
      headers: { apikey: env.anonKey, Authorization: "Bearer " + token },
    });
  assert.equal(
    (await call(sign(Math.floor(Date.now() / 1000) + 60))).status,
    200,
  );
  const expired = await call(sign(Math.floor(Date.now() / 1000) - 60));
  assert.equal(expired.status, 401);
  assert.match(JSON.stringify(await expired.json()), /expired|expiration/i);
});

test("fixture actor bindings reject forged and cross-runtime administrators and ignore redirected public fields", async () => {
  let touched = false;
  const malicious = {
    client: {
      rpc() {
        touched = true;
        throw Error("unexpected external mutation");
      },
    },
  };
  const db = await env.connect();
  let beforeCount;
  try {
    beforeCount = (
      await db.query("select count(*)::int as count from auth.users")
    ).rows[0].count;
  } finally {
    await db.end();
  }
  await assert.rejects(approvedSeller(env, malicious), /Isolation/);
  const otherRuntime = await testEnvironment();
  await assert.rejects(approvedSeller(otherRuntime, admin), /Isolation/);
  const user = await actor(env);
  const originalId = user.id;
  user.client = malicious.client;
  user.id = crypto.randomUUID();
  const application = await sellerApplication(user);
  const observer = await env.connect();
  try {
    assert.equal(
      (
        await observer.query(
          "select user_id from bf_seller_applications where id=$1",
          [application.id],
        )
      ).rows[0].user_id,
      originalId,
    );
    assert.equal(
      (await observer.query("select count(*)::int as count from auth.users"))
        .rows[0].count,
      beforeCount + 1,
    );
  } finally {
    await observer.end();
  }
  assert.equal(touched, false);
});

test("disabled policy and self-approval remain blocked by real RPCs", async () => {
  const buyer = await actor(env);
  const app = await sellerApplication(buyer);
  checked(
    await review(admin.client, app.id, 0, "in_review"),
    "start disabled-policy review",
  );
  checked(await verify(app.id, 1), "record evidence before policy disable");
  const db = await env.connect();
  try {
    await db.query(
      "update bf_seller_verification_policies set enabled=false where person_type='individual'",
    );
    assert.equal(
      (await review(admin.client, app.id, 1, "approved")).error?.code,
      "22023",
    );
    assert.equal((await verify(app.id, 1)).error?.code, "22023");
  } finally {
    await db.query(
      "update bf_seller_verification_policies set enabled=true where person_type='individual'",
    );
    await db.end();
  }
  const own = await sellerApplication(admin);
  assert.equal(
    (await review(admin.client, own.id, 0, "approved")).error?.code,
    "42501",
  );
  const seller = await approvedSeller(env, admin);
  const listing = await draftListing(seller);
  checked(
    await seller.client.rpc("bf_transition_listing", {
      p_id: listing,
      p_revision: 1,
      p_action: "submit",
    }),
    "submit self moderation fixture",
  );
  const ownDb = await env.connect();
  try {
    await ownDb.query("update bf_accounts set role='moderator' where id=$1", [
      seller.id,
    ]);
  } finally {
    await ownDb.end();
  }
  const factor = checked(
    await seller.client.auth.mfa.enroll({ factorType: "totp" }),
    "enroll self moderation MFA",
  );
  const { totp } = await import("../../scripts/first-seller/crypto.mjs");
  checked(
    await seller.client.auth.mfa.challengeAndVerify({
      factorId: factor.id,
      code: totp(factor.totp.secret),
    }),
    "verify self moderation MFA",
  );
  assert.equal(
    (
      await seller.client.rpc("bf_review_listing", {
        p_id: listing,
        p_revision: 2,
        p_decision: "in_review",
        p_classification: "additional_review",
        p_reason: reason,
        p_internal_note: "",
      })
    ).error?.code,
    "42501",
  );
});
test("user metadata and direct account updates cannot elevate privileges", async () => {
  const buyer = await actor(env);
  checked(
    await buyer.client.auth.updateUser({
      data: { role: "admin", aal: "aal2" },
    }),
    "write untrusted user metadata",
  );
  checked(
    await buyer.client.auth.refreshSession(),
    "refresh untrusted metadata token",
  );
  assert.equal(
    (
      await buyer.client
        .from("bf_accounts")
        .update({ role: "admin" })
        .eq("id", buyer.id)
    ).error?.code,
    "42501",
  );
  assert.equal(
    checked(
      await buyer.client
        .from("bf_accounts")
        .select("role")
        .eq("id", buyer.id)
        .single(),
      "authoritative database role",
    ).role,
    "buyer",
  );
  const app = await sellerApplication(buyer);
  assert.equal(
    (await review(buyer.client, app.id, 0, "in_review")).error?.code,
    "42501",
  );
});
