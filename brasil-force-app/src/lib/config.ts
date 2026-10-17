export function authConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
export function siteUrl() {
  const value = process.env.SITE_URL;
  if (!value) throw new Error("SITE_URL não configurada");
  const url = new URL(value);
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:")
    throw new Error("SITE_URL deve usar HTTPS");
  return url.origin;
}

export function registrationEnabled() {
  return authConfigured() && process.env.AUTH_REGISTRATION_ENABLED === "true";
}
