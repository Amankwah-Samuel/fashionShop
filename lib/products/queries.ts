import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/dal";
import type { Product } from "./shared";

/** Tag on every cached product read. Admin actions call updateTag(PRODUCTS_TAG). */
export const PRODUCTS_TAG = "products";

// ---------------------------------------------------------------------------
// Storefront reads (cached, published products only)
// ---------------------------------------------------------------------------

export async function getNewArrivals(limit = 8): Promise<Product[]> {
  "use cache";
  cacheTag(PRODUCTS_TAG);
  cacheLife("hours");

  const { data, error } = await supabaseAdmin()
    .from("products")
    .select("*")
    .eq("is_published", true)
    .eq("is_new_arrival", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Failed to load new arrivals: ${error.message}`);
  return data as Product[];
}

export async function getPublishedProducts(
  category?: string,
): Promise<Product[]> {
  "use cache";
  cacheTag(PRODUCTS_TAG);
  cacheLife("hours");

  let query = supabaseAdmin()
    .from("products")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load products: ${error.message}`);
  return data as Product[];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  "use cache";
  cacheTag(PRODUCTS_TAG);
  cacheLife("hours");

  const { data, error } = await supabaseAdmin()
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw new Error(`Failed to load product: ${error.message}`);
  return data as Product | null;
}

// ---------------------------------------------------------------------------
// Admin reads (uncached, includes drafts, requires admin session)
// ---------------------------------------------------------------------------

export async function adminListProducts(): Promise<Product[]> {
  await requireAdmin();
  const { data, error } = await supabaseAdmin()
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load products: ${error.message}`);
  return data as Product[];
}

export async function adminGetProduct(id: string): Promise<Product | null> {
  await requireAdmin();
  const { data, error } = await supabaseAdmin()
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    // 22P02 = invalid UUID syntax in the URL; treat it as not found.
    if (error.code === "22P02") return null;
    throw new Error(`Failed to load product: ${error.message}`);
  }
  return data as Product | null;
}
