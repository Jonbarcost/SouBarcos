/** Keep loopback development Auth separate from production CSP destinations. */
export function supabaseConnectSources(
  value: string | undefined,
  mode: string | undefined,
) {
  const cloud = "https://*.supabase.co wss://*.supabase.co";
  if (mode !== "development" || !value) return cloud;
  try {
    const url = new URL(value);
    if (
      !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) ||
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/"
    )
      return cloud;
    return `${cloud} ${url.origin} ${url.protocol === "https:" ? "wss:" : "ws:"}//${url.host}`;
  } catch {
    return cloud;
  }
}
