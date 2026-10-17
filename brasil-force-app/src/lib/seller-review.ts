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
  p_decision: z.enum([
    "in_review",
    "changes_requested",
    "rejected",
    "approved",
  ]),
  p_reason: z.string().trim().min(10).max(1500),
});
export const verificationSchema = z.object({
  p_id: z.uuid(),
  p_revision: z.coerce.number().int().nonnegative(),
  p_policy_version: z.string().min(3).max(80),
  p_checks: z
    .array(
      z.enum([
        "identity",
        "fiscal",
        "commercial",
        "policy",
        "activity_credentials",
      ]),
    )
    .min(3)
    .max(8),
  p_reference: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]{7,99}$/),
});
export const resubmitSchema = z.object({
  p_id: z.uuid(),
  p_revision: z.coerce.number().int().nonnegative(),
  p_name: z.string().trim().min(2).max(100),
  p_person_type: z.enum(["individual", "company"]),
});
