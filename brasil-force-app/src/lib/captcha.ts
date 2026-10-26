/**
 * Cloudflare Turnstile ("não sou um robô").
 *
 * Auth forms hand the token to Supabase Auth, which verifies it with the
 * secret configured in the Supabase dashboard (Authentication > Bot and Abuse
 * Protection). Forms that do not go through Supabase (contact) verify it here
 * with TURNSTILE_SECRET_KEY. A token is single-use: never verify it twice.
 */
export const CAPTCHA_FIELD = "captcha_token";
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function captchaSiteKey() {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "";
}

export function captchaEnabled() {
  return captchaSiteKey().length > 0;
}

/** Token from a submitted form, or null when captcha is off. Undefined means missing. */
export function captchaToken(form: FormData): string | null | undefined {
  if (!captchaEnabled()) return null;
  const value = form.get(CAPTCHA_FIELD);
  return typeof value === "string" && value.length > 0 && value.length <= 2048
    ? value
    : undefined;
}

export const captchaMissing = {
  message: "Confirme que você não é um robô e tente novamente.",
};

export async function verifyCaptcha(
  token: string | null | undefined,
  remoteIp?: string | null,
  fetcher: typeof fetch = fetch,
): Promise<boolean> {
  if (token === null) return true;
  if (!token) return false;
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);
  try {
    const response = await fetcher(VERIFY_URL, {
      method: "POST",
      body,
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return false;
    const result = (await response.json()) as { success?: unknown };
    return result.success === true;
  } catch {
    return false;
  }
}
