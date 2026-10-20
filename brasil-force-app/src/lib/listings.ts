import { z } from "zod";

// No floating-point multiplication and no ambiguous thousands separator.
export const priceSchema = z
  .string()
  .trim()
  .regex(/^\d{1,7}([,.]\d{1,2})?$/)
  .transform((value) => {
    const [whole, fraction = ""] = value.replace(",", ".").split(".");
    return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  })
  .pipe(z.number().int().min(1).max(100000000));
const dimension = z
  .string()
  .trim()
  .regex(/^\d{1,4}([,.]\d{1,2})?$/)
  .transform((v) => Number(v.replace(",", ".")))
  .pipe(z.number().positive().max(1000));
const integer = (max: number, min = 0) =>
  z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(min).max(max));
export const listingSchema = z.object({
  title: z.string().trim().min(5).max(160),
  description: z.string().trim().min(20).max(10000),
  category_slug: z
    .string()
    .min(1)
    .max(80)
    .refine((v) => v !== "servicos"),
  condition: z.enum(["new", "like_new", "used"]),
  price_cents: priceSchema,
  stock: integer(2147483647),
  brand: z.string().trim().max(100),
  model: z.string().trim().max(100),
  weight_grams: integer(1000000, 1),
  length_cm: dimension,
  width_cm: dimension,
  height_cm: dimension,
  dispatch_business_days: integer(30),
});
export const listingIdentity = z.object({
  p_id: z.uuid(),
  p_revision: integer(2147483646),
});
export const listingStatus: Record<string, string> = {
  draft: "Rascunho",
  pending: "Aguardando análise",
  in_review: "Em análise",
  changes_requested: "Correção solicitada",
  approved: "Aprovado",
  rejected: "Rejeitado",
  paused: "Pausado",
  sold: "Vendido",
  removed: "Removido",
};
export type Listing = z.infer<typeof listingSchema> & {
  id: string;
  revision: number;
  status: string;
};
export const editableStatuses = [
  "draft",
  "changes_requested",
  "paused",
  "approved",
];
