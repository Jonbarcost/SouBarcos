"use server";
import { after } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import type { Result } from "@/components/action-form";
import { captchaMissing, captchaToken, verifyCaptcha } from "@/lib/captcha";
import { contactTopics, contactEmails, type ContactTopic } from "@/lib/email-templates";
import { mailConfigured, sendAll } from "@/lib/mailer";
import { emailSchema } from "@/lib/validation";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  topic: z.enum(Object.keys(contactTopics) as [ContactTopic, ...ContactTopic[]]),
  message: z.string().trim().min(10).max(2000),
});

export async function sendContact(_: Result, form: FormData): Promise<Result> {
  // Honeypot: real visitors never see or fill this field.
  if (String(form.get("website") ?? "").length > 0)
    return { ok: true, message: "Mensagem enviada. Responderemos pelo seu e-mail." };
  const parsed = contactSchema.safeParse({
    name: form.get("name"),
    email: form.get("email"),
    topic: form.get("topic"),
    message: form.get("message"),
  });
  if (!parsed.success)
    return { message: "Confira nome, e-mail, assunto e uma mensagem com pelo menos 10 caracteres." };
  const token = captchaToken(form);
  if (token === undefined) return captchaMissing;
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!(await verifyCaptcha(token, ip))) return captchaMissing;
  if (!mailConfigured())
    return {
      message: "O formulário está temporariamente indisponível. Escreva para contato@brasilforce.com.br.",
    };
  const mails = contactEmails(parsed.data);
  after(() => sendAll(mails));
  return {
    ok: true,
    message: "Mensagem enviada! Você receberá uma confirmação por e-mail e responderemos em breve.",
  };
}
