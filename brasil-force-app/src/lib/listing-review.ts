import { z } from "zod";
export const listingReviewSchema = z.object({
  p_id: z.uuid(),
  p_revision: z.coerce.number().int().nonnegative(),
  p_decision: z.enum([
    "in_review",
    "changes_requested",
    "rejected",
    "approved",
    "removed",
  ]),
  p_classification: z.enum([
    "free",
    "additional_review",
    "controlled",
    "prohibited",
  ]),
  p_reason: z.string().trim().min(10).max(1500),
  p_internal_note: z.string().trim().max(1500),
});
export const classificationLabels: Record<string, string> = {
  free: "Produto comum permitido",
  additional_review: "Revisão adicional",
  controlled: "Controlado — fora deste fluxo",
  prohibited: "Proibido",
};
