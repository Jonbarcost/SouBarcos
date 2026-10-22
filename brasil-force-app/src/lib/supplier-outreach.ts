/**
 * Brasil Force supplier outreach rules. No automatic enrollment, sending or billing.
 * The 30-day promotional term begins only on a supplier-confirmed activation date.
 */
export const TRIAL_DAYS = 30;
export type SupplierStage = "identified" | "contact_pending" | "contacted" | "interested" | "consented" | "catalog_active" | "declined" | "cancelled" | "expired";
export type SupplierOutreachRecord = {
  id: string;
  legalName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  category: string;
  sourceUrl?: string;
  stage: SupplierStage;
  consentAt?: string;
  activationAt?: string;
  cancellationAt?: string;
  lastContactAt?: string;
  optOut: boolean;
  notes?: string;
};
export function trialEndsAt(activationAt: string): string {
  const start = new Date(activationAt);
  if (Number.isNaN(start.getTime())) throw new Error("Invalid activation date");
  start.setUTCDate(start.getUTCDate() + TRIAL_DAYS);
  return start.toISOString();
}
export function canContactSupplier(record: SupplierOutreachRecord): boolean {
  return !record.optOut && record.stage !== "declined" && record.stage !== "cancelled";
}
export function mayPublishSupplier(record: SupplierOutreachRecord, now = new Date()): boolean {
  if (record.optOut || record.cancellationAt || !record.consentAt || !record.activationAt) return false;
  if (record.stage !== "catalog_active") return false;
  const activation = new Date(record.activationAt);
  const consent = new Date(record.consentAt);
  if (Number.isNaN(activation.getTime()) || Number.isNaN(consent.getTime())) return false;
  return activation <= now && consent <= activation && new Date(trialEndsAt(record.activationAt)) > now;
}
