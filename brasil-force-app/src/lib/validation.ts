import { z } from "zod";
export const institutions = [
  "Exército Brasileiro",
  "Marinha do Brasil",
  "Força Aérea Brasileira",
  "Polícia Militar",
  "Polícia Civil",
  "Polícia Federal",
  "Polícia Rodoviária Federal",
  "Corpo de Bombeiros Militar",
  "Guarda Municipal",
  "Veterano ou reserva",
  "Colecionador",
  "Entusiasta ou civil",
  "Outras instituições",
] as const;
export const emailSchema = z.string().trim().email().max(254);
export const passwordSchema = z
  .string()
  .min(12, "Use pelo menos 12 caracteres.")
  .max(128);
export const profileSchema = z.object({
  display_name: z.string().trim().min(2).max(80),
  institution: z.union([z.enum(institutions), z.literal("")]),
});
export function safeNext(value: string | null) {
  return value && /^\/(?![\/\\])/.test(value) && !/[\\\r\n]/.test(value)
    ? value
    : "/conta";
}
export function canManage(
  role: string,
  aal: string | undefined,
  active: boolean,
) {
  return (
    active &&
    aal === "aal2" &&
    ["moderator", "admin", "superadmin"].includes(role)
  );
}
