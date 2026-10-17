import { pathToFileURL } from "node:url";

export function checkEnvironment(env, deployed = false) {
  const errors = [];
  const pending = [];
  const flags = [
    "AUTH_REGISTRATION_ENABLED",
    "AUTH_GOOGLE_ENABLED",
    "AUTH_APPLE_ENABLED",
    "SHIPPING_ENABLED",
    "SHIPPING_PRODUCTION_ENABLED",
  ];
  for (const name of flags)
    if (env[name] && !["true", "false"].includes(env[name]))
      errors.push(`${name}: use true ou false.`);
  const origin = (name, required) => {
    if (!env[name]) {
      if (required) errors.push(`${name}: ausente.`);
      return;
    }
    try {
      const url = new URL(env[name]);
      const local = ["localhost", "127.0.0.1"].includes(url.hostname);
      if (
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        url.pathname !== "/" ||
        (url.protocol !== "https:" &&
          !(local && !deployed && url.protocol === "http:"))
      )
        throw Error();
    } catch {
      errors.push(
        `${name}: informe uma origem HTTPS válida, sem caminho ou credenciais (HTTP local permitido em desenvolvimento).`,
      );
    }
  };
  origin("SITE_URL", true);
  origin("NEXT_PUBLIC_SUPABASE_URL", deployed);
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!!key !== !!env.NEXT_PUBLIC_SUPABASE_URL)
    errors.push(
      "Supabase: URL e chave publicável devem ser configuradas juntas.",
    );
  if (deployed && !key)
    errors.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: ausente.");
  if (key) {
    if (key.startsWith("sb_secret_"))
      errors.push("Chave privilegiada proibida no frontend.");
    else if (!key.startsWith("sb_publishable_")) {
      try {
        const payload = JSON.parse(
          Buffer.from(key.split(".")[1], "base64url").toString(),
        );
        if (payload.role !== "anon") throw Error();
      } catch {
        errors.push("Chave publicável inválida ou privilegiada.");
      }
    }
  }
  for (const name of Object.keys(env))
    if (
      name.startsWith("NEXT_PUBLIC_") &&
      /SECRET|SERVICE_ROLE|PASSWORD|PRIVATE|TOKEN/.test(name) &&
      env[name]
    )
      errors.push(`${name}: possível segredo exposto no frontend.`);
  if (env.AUTH_REGISTRATION_ENABLED === "true" && !key)
    errors.push("Cadastro habilitado sem Supabase configurado.");
  if (env.SHIPPING_ENABLED === "true") {
    for (const name of [
      "MELHOR_ENVIO_TOKEN",
      "SHIPPING_TECHNICAL_EMAIL",
      "MELHOR_ENVIO_SERVICE_IDS",
    ])
      if (!env[name]?.trim())
        errors.push(`${name}: obrigatório para frete habilitado.`);
    if (!["sandbox", "production"].includes(env.MELHOR_ENVIO_ENVIRONMENT))
      errors.push("MELHOR_ENVIO_ENVIRONMENT: use sandbox ou production.");
    if (
      env.MELHOR_ENVIO_ENVIRONMENT === "production" &&
      env.SHIPPING_PRODUCTION_ENABLED !== "true"
    )
      errors.push("Frete de produção exige habilitação explícita.");
  } else pending.push("Cotação de frete desativada.");
  if (env.AUTH_REGISTRATION_ENABLED !== "true")
    pending.push("Cadastro público desativado.");
  pending.push(
    "Validar fora deste script: SMTP, callbacks, MFA, vendedor real, gateway, domínio e restauração de backup.",
  );
  return { errors, pending };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const file = process.argv.find((a) => a.startsWith("--file="))?.slice(7);
  if (file) process.loadEnvFile(file);
  const result = checkEnvironment(
    process.env,
    process.argv.includes("--deployment"),
  );
  for (const message of result.errors) console.error(`ERRO: ${message}`);
  for (const message of result.pending) console.log(`PENDENTE: ${message}`);
  console.log(
    result.errors.length
      ? "Configuração precisa de correção."
      : "Validação estática concluída; não comprova prontidão comercial.",
  );
  if (result.errors.length) process.exitCode = 1;
}
