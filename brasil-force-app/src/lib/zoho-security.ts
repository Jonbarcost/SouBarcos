import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
export type Env = Record<string, string | undefined>;
export function validSecret(value: string | undefined): boolean {
  // Enforce a canonical 256-bit key. Shape checks cannot prove random generation.
  return (
    !!value &&
    /^[0-9a-f]{64}$/i.test(value) &&
    new Set(value.toLowerCase()).size >= 12 &&
    !/(.{1,16})\1{3}/.test(value)
  );
}
export function configStatus(env: Env) {
  const required = [
    "ZOHO_CLIENT_ID",
    "ZOHO_CLIENT_SECRET",
    "ZOHO_OAUTH_STATE_SECRET",
    "ZOHO_TOKEN_ENCRYPTION_KEY",
    "ZOHO_REGION",
    "ZOHO_REDIRECT_URI",
    "ZOHO_MAILBOX_ADDRESS",
  ];
  const missing = required.filter((k) => !env[k]);
  const stateSecretValid =
    validSecret(env.ZOHO_OAUTH_STATE_SECRET) &&
    env.ZOHO_OAUTH_STATE_SECRET !== env.ZOHO_CLIENT_SECRET;
  const encryptionKeyValid =
    validSecret(env.ZOHO_TOKEN_ENCRYPTION_KEY) &&
    env.ZOHO_TOKEN_ENCRYPTION_KEY !== env.ZOHO_OAUTH_STATE_SECRET &&
    env.ZOHO_TOKEN_ENCRYPTION_KEY !== env.ZOHO_CLIENT_SECRET;
  let redirectValid = false;
  try {
    const u = new URL(env.ZOHO_REDIRECT_URI!);
    redirectValid =
      u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      !u.search &&
      !u.hash &&
      u.pathname === "/api/integrations/zoho/callback" &&
      (u.hostname === "brasilforce.com.br" ||
        u.hostname.endsWith(".vercel.app"));
  } catch {}
  const regionValid = !!regions[env.ZOHO_REGION ?? ""];
  const mailboxValid =
    env.ZOHO_MAILBOX_ADDRESS === "contato@brasilforce.com.br";
  const reviewed = env.ZOHO_CREDENTIALS_REVIEWED === "true";
  return {
    missing,
    stateSecretValid,
    encryptionKeyValid,
    redirectValid,
    regionValid,
    mailboxValid,
    reviewed,
    configured:
      !missing.length &&
      stateSecretValid &&
      encryptionKeyValid &&
      redirectValid &&
      regionValid &&
      mailboxValid &&
      reviewed,
  };
}
export const regions: Record<string, { accounts: string; mail: string }> = {
  us: { accounts: "https://accounts.zoho.com", mail: "https://mail.zoho.com" },
  eu: { accounts: "https://accounts.zoho.eu", mail: "https://mail.zoho.eu" },
  in: { accounts: "https://accounts.zoho.in", mail: "https://mail.zoho.in" },
  au: {
    accounts: "https://accounts.zoho.com.au",
    mail: "https://mail.zoho.com.au",
  },
};
export function checkedConfig(env: Env) {
  if (!configStatus(env).configured)
    throw new Error(
      "Integração Zoho bloqueada: configuração de segurança pendente.",
    );
  return {
    clientId: env.ZOHO_CLIENT_ID!,
    clientSecret: env.ZOHO_CLIENT_SECRET!,
    stateKey: env.ZOHO_OAUTH_STATE_SECRET!,
    encryptionKey: env.ZOHO_TOKEN_ENCRYPTION_KEY!,
    redirectUri: env.ZOHO_REDIRECT_URI!,
    mailbox: env.ZOHO_MAILBOX_ADDRESS!,
    region: env.ZOHO_REGION!,
    ...regions[env.ZOHO_REGION!],
  };
}
export function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
export function makeSignedState(
  uid: string,
  key: string,
  binding: string,
  now = Date.now(),
) {
  if (!validSecret(key)) throw new Error("Invalid state key");
  const payload = Buffer.from(
    JSON.stringify({
      uid,
      at: Math.floor(now / 1000),
      nonce: randomBytes(32).toString("hex"),
      binding: hash(binding),
    }),
  ).toString("base64url");
  return (
    payload +
    "." +
    createHmac("sha256", Buffer.from(key, "hex"))
      .update(payload)
      .digest("base64url")
  );
}
export function verifySignedState(
  state: string,
  uid: string,
  key: string,
  binding: string,
  now = Date.now(),
): boolean {
  if (!validSecret(key) || state.length > 1500 || !binding) return false;
  const parts = state.split(".");
  if (parts.length !== 2) return false;
  const expected = createHmac("sha256", Buffer.from(key, "hex"))
    .update(parts[0])
    .digest();
  const actual = Buffer.from(parts[1], "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    return false;
  try {
    const p = JSON.parse(Buffer.from(parts[0], "base64url").toString());
    const t = Math.floor(now / 1000);
    return (
      p.uid === uid &&
      p.binding === hash(binding) &&
      Number.isInteger(p.at) &&
      p.at <= t &&
      p.at > t - 600 &&
      /^[a-f0-9]{64}$/.test(p.nonce)
    );
  } catch {
    return false;
  }
}
export function seal(value: unknown, key: string, aad: string) {
  if (!validSecret(key)) throw new Error("Invalid encryption key");
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", Buffer.from(key, "hex"), iv);
  c.setAAD(Buffer.from(aad));
  const encrypted = Buffer.concat([
    c.update(JSON.stringify(value), "utf8"),
    c.final(),
  ]);
  return [
    "v1",
    iv.toString("base64url"),
    c.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}
export function unseal(value: string, key: string, aad: string): unknown {
  if (!validSecret(key) || value.length > 20000)
    throw new Error("Invalid encrypted record");
  const [version, iv, tag, body, ...rest] = value.split(".");
  if (version !== "v1" || rest.length || !body)
    throw new Error("Invalid encrypted record");
  const d = createDecipheriv(
    "aes-256-gcm",
    Buffer.from(key, "hex"),
    Buffer.from(iv, "base64url"),
  );
  d.setAAD(Buffer.from(aad));
  d.setAuthTag(Buffer.from(tag, "base64url"));
  return JSON.parse(
    Buffer.concat([
      d.update(Buffer.from(body, "base64url")),
      d.final(),
    ]).toString("utf8"),
  );
}
