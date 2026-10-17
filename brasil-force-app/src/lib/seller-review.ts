import { z } from "zod";
export const sellerStatus: Record<string, string> = {
  pending: "Aguardando análise",
  in_review: "Em análise",
  changes_requested: "Correções solicitadas",
  approved: "Aprovado",
  rejected: "Solicitação rejeitada",
};
export const reviewSchema = z.object({
  p_id: z.uuid(),
  p_revision: z.coerce.number().int().nonnegative(),
  p_decision: z.enum(["in_review", "changes_requested", "rejected"]),
  p_reason: z.string().trim().min(10).max(1500),
});
export const resubmitSchema = z.object({
  p_id: z.uuid(),
  p_revision: z.coerce.number().int().nonnegative(),
  p_name: z.string().trim().min(2).max(100),
  p_person_type: z.enum(["individual", "company"]),
});
