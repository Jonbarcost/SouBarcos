import { test, expect } from "@playwright/test";
import { randomUUID, randomBytes } from "node:crypto";
import { setTimeout as pause } from "node:timers/promises";
import {
  testEnvironment,
  actor,
  configureTestPolicies,
  checked,
  draft,
} from "../../scripts/first-seller/fixtures.mjs";
import { totp } from "../../scripts/first-seller/crypto.mjs";
const reason = "TESTE — conferência exclusiva no ambiente isolado.";
async function signIn(page, user) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail", { exact: true }).fill(user.email);
  await page.locator("input[name=password]").fill(user.password);
  await page
    .getByRole("button", { name: "Entrar na minha conta", exact: true })
    .click();
  await expect(page).toHaveURL(/\/conta(?:\/seguranca)?$/);
}
async function logout(page) {
  await page.goto("/conta");
  await page
    .getByRole("button", { name: "Sair da conta", exact: true })
    .click();
  await expect(page).toHaveURL(/\/entrar/);
}
async function mfa(page, user) {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/conta\/seguranca/);
  await page
    .getByRole("button", {
      name: "Configurar ou confirmar segundo fator",
      exact: true,
    })
    .click();
  await expect(page.getByLabel("Código de seis dígitos")).toBeVisible();
  if (Math.floor(Date.now() / 30000) === user.lastCounter)
    await pause(30050 - (Date.now() % 30000));
  await page.getByLabel("Código de seis dígitos").fill(totp(user.secret));
  await page
    .getByRole("button", { name: "Confirmar código", exact: true })
    .click();
  await expect(
    page.getByText("Segundo fator confirmado nesta sessão.", { exact: true }),
  ).toBeVisible();
  user.lastCounter = Math.floor(Date.now() / 30000);
}
async function confirmationLink(env, email) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const response = await fetch(env.mailUrl + "/api/v1/messages");
    if (!response.ok) throw Error("Local mailbox unavailable");
    const list = await response.json();
    const message = list.messages?.find((m) =>
      m.To?.some((to) => to.Address === email),
    );
    if (message) {
      const full = await (
        await fetch(env.mailUrl + "/api/v1/message/" + message.ID)
      ).json();
      const links = [...(full.HTML ?? "").matchAll(/href="([^"]+)"/g)].map(
        (m) => m[1].replaceAll("&amp;", "&"),
      );
      const link = links.find((h) => {
        try {
          const u = new URL(h);
          return u.origin === env.apiUrl && u.pathname === "/auth/v1/verify";
        } catch {
          return false;
        }
      });
      if (!link) throw Error("No trusted local confirmation link");
      return link;
    }
    await pause(100);
  }
  throw Error("Confirmation mail not delivered to the local mailbox");
}
function decisionForm(section, page) {
  return section
    .locator("form")
    .filter({
      has: page.getByRole("button", { name: "Registrar decisão", exact: true }),
    });
}
async function decide(form, page, decision, classification) {
  await form.locator("[name=p_decision]").selectOption(decision);
  if (classification)
    await form.locator("[name=p_classification]").selectOption(classification);
  await form.locator("[name=p_reason]").fill(reason);
  const note = form.locator("[name=p_internal_note]");
  if (await note.count()) await note.fill("TEST-ONLY INTERNAL NOTE");
  await form.locator("input[name=confirm]").check();
  await form
    .getByRole("button", { name: "Registrar decisão", exact: true })
    .click();
}

test("signup → confirmation → MFA approval → first draft → moderation → public isolated catalog", async ({
  page,
}, testInfo) => {
  const env = await testEnvironment();
  await configureTestPolicies(env);
  const admin = await actor(env, "admin", true);
  const moderator = await actor(env, "moderator", true);
  const buyer = {
    email: `journey-${randomUUID()}@bf-e2e.invalid`,
    password: `TEST-${randomBytes(18).toString("hex")}!`,
  };
  const display = `TESTE — vendedor ${randomUUID().slice(0, 8)}`;
  const title = `TESTE — Mochila outdoor 30 litros — ${testInfo.project.name} — NÃO COMERCIALIZÁVEL`;
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await test.step("create account, confirm local email and join marketplace", async () => {
    await page.goto("/cadastro");
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toHaveText("Pular para o conteúdo");
    await page.getByLabel("Nome de exibição", { exact: true }).fill(display);
    await page.getByLabel("E-mail", { exact: true }).fill(buyer.email);
    await page.locator("input[name=password]").fill(buyer.password);
    await page.locator("input[name=terms]").check();
    await page
      .getByRole("button", { name: "Criar minha conta", exact: true })
      .focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByText(/você receberá um e-mail de confirmação/),
    ).toBeVisible();
    await page.goto(await confirmationLink(env, buyer.email));
    await page.goto("/participar");
    await expect(
      page.getByRole("heading", {
        name: "Faça parte da Brasil Force",
        exact: true,
      }),
    ).toBeVisible();
    if (new URL(page.url()).pathname === "/participar") {
      await page.getByLabel("Nome de exibição", { exact: true }).fill(display);
      await page.locator("input[name=terms]").check();
      await page
        .getByRole("button", {
          name: "Criar meu perfil Brasil Force",
          exact: true,
        })
        .click();
    }
    await expect(
      page.getByRole("heading", { name: "Minha conta", exact: true }),
    ).toBeVisible();
  });
  const userList = checked(
    await env.client(env.serviceKey).auth.admin.listUsers(),
    "read isolated identities",
  );
  buyer.id = userList.users.find((u) => u.email === buyer.email)?.id;
  expect(buyer.id).toBeTruthy();
  buyer.client = env.client();
  checked(
    await buyer.client.auth.signInWithPassword({
      email: buyer.email,
      password: buyer.password,
    }),
    "login isolated candidate",
  );
  let app, id;
  await test.step("request seller enrollment through the UI", async () => {
    await page.goto("/vender");
    await page.getByLabel("Nome da loja ou vendedor").fill(display);
    await page.locator("input[name=rules]").check();
    await page
      .getByRole("button", { name: "Enviar solicitação", exact: true })
      .click();
    await expect(
      page.getByText("Aguardando análise", { exact: true }),
    ).toBeVisible();
    app = checked(
      await buyer.client
        .from("bf_seller_applications")
        .select("id,status,revision")
        .eq("user_id", buyer.id)
        .single(),
      "read submitted application",
    );
    expect(app.status).toBe("pending");
    await logout(page);
  });
  await test.step("administrator must complete real MFA before verification and approval", async () => {
    await signIn(page, admin);
    await mfa(page, admin);
    await page.goto("/admin?status=pending");
    let section = page
      .locator("section.panel")
      .filter({
        has: page.getByRole("heading", { name: display, exact: true }),
      });
    await decide(decisionForm(section, page), page, "in_review");
    await expect
      .poll(
        async () =>
          checked(
            await admin.client
              .from("bf_seller_applications")
              .select("status")
              .eq("id", app.id)
              .single(),
            "review status",
          ).status,
      )
      .toBe("in_review");
    await page.goto("/admin?status=in_review");
    section = page
      .locator("section.panel")
      .filter({
        has: page.getByRole("heading", { name: display, exact: true }),
      });
    await expect(section.locator("option[value=approved]")).toHaveAttribute(
      "disabled",
      "",
    );
    const form = section
      .locator("form")
      .filter({
        has: page.getByRole("button", {
          name: "Registrar verificação",
          exact: true,
        }),
      });
    for (const box of await form.locator("input[name=p_checks]").all())
      await box.check();
    await form.locator("[name=p_reference]").fill("TEST-ONLY-EVIDENCE");
    await form.locator("input[name=confirm]").check();
    await form
      .getByRole("button", { name: "Registrar verificação", exact: true })
      .click();
    await expect(section.locator("option[value=approved]")).not.toHaveAttribute(
      "disabled",
    );
    await decide(decisionForm(section, page), page, "approved");
    await expect
      .poll(
        async () =>
          checked(
            await buyer.client
              .from("bf_accounts")
              .select("role")
              .eq("id", buyer.id)
              .single(),
            "commercial role",
          ).role,
      )
      .toBe("seller");
    await logout(page);
  });
  await test.step("approved seller creates and submits a persistent physical-product draft", async () => {
    await signIn(page, buyer);
    await page.goto("/vender");
    await expect(
      page.locator("p").filter({ hasText: /^Situação:/ }),
    ).toHaveText(/Situação:\s*Aprovado/);
    await page
      .getByRole("link", {
        name: "Acessar painel e criar anúncio",
        exact: true,
      })
      .click();
    await page
      .getByRole("link", { name: "Criar primeiro anúncio", exact: true })
      .click();
    await page.getByLabel("Título", { exact: true }).fill(title);
    await page.getByLabel("Descrição", { exact: true }).fill(draft.description);
    await page.locator("select[name=category_slug]").selectOption("campo");
    await page.getByLabel("Preço (R$)", { exact: true }).fill("149,90");
    for (const [name, value] of Object.entries({
      stock: 3,
      weight_grams: 500,
      length_cm: 30,
      width_cm: 20,
      height_cm: 10,
      dispatch_business_days: 2,
    }))
      await page.locator(`[name=${name}]`).fill(String(value));
    await page
      .getByRole("button", { name: "Salvar anúncio", exact: true })
      .click();
    await expect(page).toHaveURL(
      /\/painel-vendedor\/anuncios\/[0-9a-f-]+\?saved=1/,
    );
    id = new URL(page.url()).pathname.split("/").at(-1);
    const saved = checked(
      await buyer.client
        .from("bf_listings")
        .select("status,price_cents,stock,classification")
        .eq("id", id)
        .single(),
      "persistent draft",
    );
    expect(saved).toEqual({
      status: "draft",
      price_cents: 14990,
      stock: 3,
      classification: "additional_review",
    });
    const submit = page
      .locator("form")
      .filter({
        has: page.getByRole("button", {
          name: "Enviar para análise",
          exact: true,
        }),
      });
    await submit.locator("input[name=confirm]").check();
    await submit
      .getByRole("button", { name: "Enviar para análise", exact: true })
      .click();
    await expect
      .poll(
        async () =>
          checked(
            await buyer.client
              .from("bf_listings")
              .select("status")
              .eq("id", id)
              .single(),
            "submitted draft",
          ).status,
      )
      .toBe("pending");
    await logout(page);
  });
  await test.step("moderator completes real MFA and approves an ordinary product", async () => {
    await signIn(page, moderator);
    await mfa(page, moderator);
    await page.goto("/admin/anuncios/" + id);
    await decide(
      page
        .locator("form")
        .filter({
          has: page.getByRole("button", {
            name: "Registrar decisão",
            exact: true,
          }),
        }),
      page,
      "in_review",
      "additional_review",
    );
    await expect
      .poll(
        async () =>
          checked(
            await buyer.client
              .from("bf_listings")
              .select("status")
              .eq("id", id)
              .single(),
            "moderation state",
          ).status,
      )
      .toBe("in_review");
    await page.reload();
    await decide(
      page
        .locator("form")
        .filter({
          has: page.getByRole("button", {
            name: "Registrar decisão",
            exact: true,
          }),
        }),
      page,
      "approved",
      "free",
    );
    await expect
      .poll(
        async () =>
          checked(
            await env
              .client()
              .from("bf_public_listings")
              .select("id")
              .eq("id", id),
            "published listing",
          ).length,
      )
      .toBe(1);
    await logout(page);
  });
  await test.step("anonymous public catalog shows only the approved isolated fixture", async () => {
    await page.goto("/catalogo");
    await page
      .getByRole("textbox", { name: "Buscar equipamentos" })
      .fill(title);
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    await page.getByRole("link", { name: title, exact: true }).click();
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Estoque informado: 3", { exact: true }),
    ).toBeVisible();
    expect(
      await page.locator("html").evaluate((e) => e.scrollWidth > innerWidth),
    ).toBe(false);
    await page.screenshot({
      path: testInfo.outputPath("public-test-product.png"),
      fullPage: true,
    });
    const history = checked(
      await admin.client
        .from("bf_listing_review_events")
        .select("to_status")
        .eq("listing_id", id)
        .order("revision"),
      "moderation audit",
    );
    expect(history.map((e) => e.to_status)).toEqual(["in_review", "approved"]);
    expect(errors).toEqual([]);
  });
});
