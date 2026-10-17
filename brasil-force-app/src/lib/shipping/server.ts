import "server-only";
import { createShippingProvider } from "./melhor-envio";

/** Initial operator-account adapter. Do not reuse a central token as seller OAuth authorization. */
export function getShippingProvider() {
  if (process.env.SHIPPING_ENABLED !== "true")
    throw new Error("Frete ainda não habilitado.");
  return createShippingProvider({
    environment: process.env.MELHOR_ENVIO_ENVIRONMENT,
    token: process.env.MELHOR_ENVIO_TOKEN,
    contact: process.env.SHIPPING_TECHNICAL_EMAIL,
    serviceIds: (process.env.MELHOR_ENVIO_SERVICE_IDS ?? "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean),
    productionEnabled: process.env.SHIPPING_PRODUCTION_ENABLED === "true",
  });
}
