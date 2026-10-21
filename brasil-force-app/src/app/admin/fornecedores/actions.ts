"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { zohoAdmin, connectedMailbox } from "@/lib/zoho-server";
const field = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const url = z
  .url()
  .max(1000)
  .refine((s) => {
    const u = new URL(s);
    return u.protocol === "https:" && !u.username && !u.password;
  });
const supplier = z.object({
  company_name: z.string().min(2).max(180),
  category: z.string().min(2).max(100),
  contact_email: z.email().max(254).or(z.literal("")),
  website: url.or(z.literal("")),
  source_url: url.or(z.literal("")),
});
async function execute(work: () => Promise<void>) {
  let outcome = "saved";
  try {
    await work();
  } catch {
    outcome = "failed";
  }
  revalidatePath("/admin/fornecedores");
  redirect("/admin/fornecedores?operation=" + outcome);
}
export async function createSupplier(f: FormData) {
  const { db } = await zohoAdmin();
  await execute(async () => {
    const s = supplier.parse(
      Object.fromEntries(
        [
          "company_name",
          "category",
          "contact_email",
          "website",
          "source_url",
        ].map((k) => [k, field(f, k)]),
      ),
    );
    const { error } = await db.rpc("bf_supplier_create", {
      p_name: s.company_name,
      p_category: s.category,
      p_email: s.contact_email || null,
      p_website: s.website || null,
      p_source: s.source_url || null,
    });
    if (error) throw new Error();
  });
}
export async function updateSupplier(f: FormData) {
  const { db } = await zohoAdmin();
  await execute(async () => {
    const { error } = await db.rpc("bf_supplier_change", {
      p_id: z.uuid().parse(field(f, "id")),
      p_revision: z.coerce
        .number()
        .int()
        .nonnegative()
        .parse(field(f, "revision")),
      p_action: z
        .enum([
          "identified",
          "contact_pending",
          "contacted",
          "interested",
          "declined",
          "cancelled",
          "opted_out",
          "consent_recorded",
          "activated",
          "note_added",
          "contact_logged",
        ])
        .parse(field(f, "action")),
      p_details: z.string().max(2000).parse(field(f, "details")),
    });
    if (error) throw new Error();
  });
}
export async function createDraft(f: FormData) {
  const { db } = await zohoAdmin();
  await execute(async () => {
    const { error } = await db.rpc("bf_supplier_draft", {
      p_supplier: z.uuid().parse(field(f, "id")),
      p_subject: z
        .string()
        .min(1)
        .max(200)
        .refine((s) => !/[\r\n]/.test(s))
        .parse(field(f, "subject")),
      p_body: z.string().min(1).max(10000).parse(field(f, "body")),
    });
    if (error) throw new Error();
  });
}
export async function reviewMail(f: FormData) {
  const { db } = await zohoAdmin();
  await execute(async () => {
    const { error } = await db.rpc("bf_supplier_mail_action", {
      p_id: z.uuid().parse(field(f, "id")),
      p_action: z.enum(["approve", "cancel"]).parse(field(f, "action")),
    });
    if (error) throw new Error();
  });
}
export async function sendMail(f: FormData) {
  const { db } = await zohoAdmin();
  await execute(async () => {
    if (
      process.env.ZOHO_MAIL_SEND_ENABLED !== "true" ||
      field(f, "confirm") !== "send"
    )
      throw new Error();
    const id = z.uuid().parse(field(f, "id"));
    const m = await connectedMailbox(db);
    const tokens = await m.api.refresh(m.tokens.refresh_token);
    const { data, error } = await db.rpc("bf_supplier_mail_action", {
      p_id: id,
      p_action: "claim",
    });
    if (error || !data?.[0]) throw new Error();
    const draft = data[0];
    let providerId: string | null = null;
    try {
      providerId = await m.api.send(
        m.account,
        tokens.access_token,
        draft.recipient,
        draft.subject,
        draft.body,
      );
    } catch {
      /* Unknown outcome must never be automatically retried. */
    }
    const finished = await db.rpc("bf_supplier_mail_finish", {
      p_id: id,
      p_message: providerId,
    });
    if (finished.error || !providerId) throw new Error();
  });
}
export async function disconnectZoho() {
  const { db } = await zohoAdmin();
  await execute(async () => {
    const m = await connectedMailbox(db);
    await m.api.revoke(m.tokens.refresh_token);
    const { error } = await db.rpc("bf_zoho_disconnect");
    if (error) throw new Error();
  });
}
