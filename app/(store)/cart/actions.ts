"use server";

import { getPublishedProductsByIds } from "@/lib/products/queries";
import type { LiveProduct } from "@/lib/local-store";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Current price/stock for products saved in a shopper's cart or favourites. Public data only. */
export async function getLiveProducts(ids: unknown): Promise<LiveProduct[]> {
  if (!Array.isArray(ids)) return [];
  const clean = [...new Set(ids.filter((id): id is string => typeof id === "string" && UUID.test(id)))]
    .slice(0, 100)
    .sort();
  const products = await getPublishedProductsByIds(clean);
  return products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: Number(p.price),
    compareAtPrice: p.compare_at_price === null ? null : Number(p.compare_at_price),
    stock: p.stock,
    image: p.images[0] ?? null,
    sizes: p.sizes,
    colors: p.colors,
  }));
}
