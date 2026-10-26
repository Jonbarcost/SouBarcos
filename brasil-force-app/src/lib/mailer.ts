import nodemailer, { type Transporter } from "nodemailer";

/**
 * Transactional e-mail through the corporate mailbox (Zoho Mail SMTP by
 * default). Server-only. When SMTP is not configured every send is skipped
 * and reported, so product flows never fail because of e-mail.
 *
 * Auth e-mails (confirmation, recovery) are sent by Supabase Auth with its own
 * SMTP settings; this module covers the app's own messages.
 */
export type Mail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};
export type MailResult = { sent: boolean; reason?: string };

const DEFAULT_FROM = "Brasil Force <contato@brasilforce.com.br>";
const DEFAULT_TEAM = "contato@brasilforce.com.br";

export function mailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}

export function teamInbox() {
  return process.env.MAIL_TEAM_TO?.trim() || DEFAULT_TEAM;
}

let cached: Transporter | null = null;
function transport(): Transporter {
  if (cached) return cached;
  const port = Number(process.env.SMTP_PORT || 465);
  cached = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  return cached;
}

/** Header-safe single line: no CR/LF, bounded length. */
function oneLine(value: string, max = 200) {
  return value.replace(/[\r\n]+/g, " ").trim().slice(0, max);
}

export async function sendMail(mail: Mail, transporter?: Transporter): Promise<MailResult> {
  if (!transporter && !mailConfigured()) return { sent: false, reason: "smtp-not-configured" };
  try {
    await (transporter ?? transport()).sendMail({
      from: process.env.MAIL_FROM?.trim() || DEFAULT_FROM,
      to: oneLine(mail.to, 254),
      subject: oneLine(mail.subject),
      html: mail.html,
      text: mail.text,
      replyTo: mail.replyTo ? oneLine(mail.replyTo, 254) : undefined,
    });
    return { sent: true };
  } catch (error) {
    // Never log addresses or bodies; the error code is enough to diagnose SMTP.
    const code = (error as { code?: string }).code ?? "unknown";
    console.error("[mail] send failed:", code);
    return { sent: false, reason: code };
  }
}

/** Fire several messages without letting one failure block the others. */
export async function sendAll(mails: Mail[]) {
  return Promise.all(mails.map((mail) => sendMail(mail)));
}
