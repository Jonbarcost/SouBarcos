import { serverClient } from "@/lib/supabase/server";
import { authConfigured } from "@/lib/config";
import { handleAssistant } from "@/lib/assistant-service";
import { gatewayRecommendation } from "@/lib/assistant-gateway";
export const runtime = "nodejs";
export async function POST(request: Request) {
  let db: Awaited<ReturnType<typeof serverClient>> | undefined;
  return handleAssistant(request, {
    enabled: process.env.BF_AI_ENABLED === "true" && authConfigured(),
    authenticate: async () => {
      db = await serverClient();
      const {
        data: { user },
        error,
      } = await db.auth.getUser();
      if (error || !user?.email_confirmed_at) return false;
      const { data: account, error: accountError } = await db
        .from("bf_accounts")
        .select("status")
        .eq("id", user.id)
        .maybeSingle();
      if (accountError) throw Error();
      return account?.status === "active";
    },
    consumeQuota: async () => {
      const { data, error } = await db!.rpc("bf_ai_consume_quota");
      if (error) throw Error();
      return data === true;
    },
    search: async (term) => {
      const { data, error } = await db!
        .from("bf_public_listings")
        .select("id,title,price_cents,category_slug,stock")
        .gt("stock", 0)
        .ilike("title", "%" + term + "%")
        .order("id")
        .limit(8);
      if (error) throw Error();
      return data ?? [];
    },
    recommend:
      (process.env.VERCEL_OIDC_TOKEN || process.env.AI_GATEWAY_API_KEY) &&
      process.env.BF_AI_MODEL
        ? (question, products) =>
            gatewayRecommendation(question, products, {
              BF_AI_MODEL: process.env.BF_AI_MODEL,
              VERCEL_OIDC_TOKEN: process.env.VERCEL_OIDC_TOKEN,
              AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
            })
        : undefined,
    metric: (event) => console.info(JSON.stringify(event)),
  });
}
