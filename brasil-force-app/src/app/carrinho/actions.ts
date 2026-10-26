"use server";
import { z } from "zod";
import { authConfigured } from "@/lib/config";
import { serverClient } from "@/lib/supabase/server";
import { MAX_LINES, type ListingSnapshot } from "@/lib/cart";

const ids = z.array(z.uuid()).max(MAX_LINES);

/**
 * Current public data for the listings in a visitor's cart. Returns null when
 * the catalog cannot be checked, so the client keeps its snapshot instead of
 * wrongly emptying the cart.
 */
export async function refreshCart(input: string[]): Promise<ListingSnapshot[] | null> {
  const parsed = ids.safeParse(input);
  if (!parsed.success || !authConfigured()) return null;
  if (!parsed.data.length) return [];
  const db = await serverClient();
  const { data, error } = await db
    .from("bf_public_listings")
    .select("id,title,price_cents,stock")
    .in("id", parsed.data);
  if (error) return null;
  return (data ?? []) as ListingSnapshot[];
}
