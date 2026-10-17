import { z } from "zod";

const configuration = z
  .object({
    environment: z.enum(["sandbox", "production"]),
    token: z
      .string()
      .trim()
      .min(1)
      .refine((v) => !/[\r\n]/.test(v)),
    contact: z.email(),
    serviceIds: z.array(z.string().regex(/^\d+$/)).min(1),
    productionEnabled: z.boolean().default(false),
  })
  .refine((v) => v.environment !== "production" || v.productionEnabled);
const postalCode = z
  .string()
  .regex(/^\d{5}-?\d{3}$/)
  .transform((v) => v.replace("-", ""));
const positive = z.number().finite().positive();
const item = z.object({
  id: z.string().min(1).max(100),
  sellerId: z.string().min(1),
  width: positive,
  height: positive,
  length: positive,
  weight: positive,
  unitValueCents: z.number().int().positive().max(100_000_000),
  quantity: z.number().int().positive().max(999),
});
const request = z
  .object({
    sellerId: z.string().min(1),
    originPostalCode: postalCode,
    destinationPostalCode: postalCode,
    items: z.array(item).min(1).max(100),
  })
  .refine(
    (v) => v.items.every((i) => i.sellerId === v.sellerId),
    "Itens de vendedores diferentes exigem cotações separadas.",
  );
const money = z
  .union([
    z.string().regex(/^\d+(\.\d{1,2})?$/),
    z.number().finite().nonnegative(),
  ])
  .transform((v) => Math.round(Number(v) * 100))
  .pipe(z.number().int().nonnegative().max(100_000_000));
const rate = z.object({
  id: z
    .union([z.number().int().positive(), z.string().regex(/^\d+$/)])
    .transform(String),
  name: z.string().min(1),
  company: z.object({ name: z.string().min(1) }),
  custom_price: money,
  custom_delivery_time: z.number().int().nonnegative(),
});
export type ShipmentInput = z.input<typeof request>;
export type ShippingQuote = {
  provider: "melhor-envio";
  environment: "sandbox" | "production";
  sellerId: string;
  options: {
    serviceId: string;
    service: string;
    carrier: string;
    priceCents: number;
    transitBusinessDays: number;
  }[];
};
export interface ShippingProvider {
  quote(input: ShipmentInput): Promise<ShippingQuote>;
}

/** Internal adapter. Call only with server-resolved catalog data and the seller's authorized credentials. */
export function createShippingProvider(
  config: unknown,
  fetcher: typeof fetch = fetch,
): ShippingProvider {
  const parsed = configuration.safeParse(config);
  if (!parsed.success)
    throw new Error("Configuração de frete ausente ou inválida.");
  const settings = parsed.data;
  const origin =
    settings.environment === "sandbox"
      ? "https://sandbox.melhorenvio.com.br"
      : "https://melhorenvio.com.br";
  return {
    async quote(input) {
      const shipment = request.parse(input);
      try {
        const response = await fetcher(
          `${origin}/api/v2/me/shipment/calculate`,
          {
            method: "POST",
            redirect: "error",
            cache: "no-store",
            signal: AbortSignal.timeout(10_000),
            headers: {
              Authorization: `Bearer ${settings.token}`,
              Accept: "application/json",
              "Content-Type": "application/json",
              "User-Agent": `Brasil Force (${settings.contact})`,
            },
            body: JSON.stringify({
              from: { postal_code: shipment.originPostalCode },
              to: { postal_code: shipment.destinationPostalCode },
              products: shipment.items.map((i) => ({
                id: i.id,
                width: i.width,
                height: i.height,
                length: i.length,
                weight: i.weight,
                insurance_value: i.unitValueCents / 100,
                quantity: i.quantity,
              })),
              services: settings.serviceIds.join(","),
              options: { receipt: false, own_hand: false },
            }),
          },
        );
        if (!response.ok) throw new Error("upstream");
        const data: unknown = await response.json();
        if (!Array.isArray(data)) throw new Error("invalid response");
        const options: ShippingQuote["options"] = [];
        const seen = new Set<string>();
        for (const value of data) {
          if (value && typeof value === "object" && value.error) continue;
          const valid = rate.safeParse(value);
          if (
            !valid.success ||
            !settings.serviceIds.includes(valid.data.id) ||
            seen.has(valid.data.id)
          )
            continue;
          const r = valid.data;
          seen.add(r.id);
          options.push({
            serviceId: r.id,
            service: r.name,
            carrier: r.company.name,
            priceCents: r.custom_price,
            transitBusinessDays: r.custom_delivery_time,
          });
        }
        return {
          provider: "melhor-envio",
          environment: settings.environment,
          sellerId: shipment.sellerId,
          options: options.sort((a, b) => a.priceCents - b.priceCents),
        };
      } catch {
        // Never leak provider response bodies, credentials or customer data.
        throw new Error("Não foi possível consultar o frete. Tente novamente.");
      }
    },
  };
}
