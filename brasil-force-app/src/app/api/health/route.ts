import { authConfigured } from "@/lib/config";
export async function GET() {
  return Response.json(
    {
      application: "brasil-force",
      phase: "foundation",
      authenticationConfigured: authConfigured(),
      commerceEnabled: false,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
