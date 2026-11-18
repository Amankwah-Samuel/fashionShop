// Simple catalog search. The shop is small enough to filter in memory after
// the (cached) product read, so there's no search index to maintain.

import type { Product } from "./shared";

export const MAX_QUERY_LENGTH = 80;

/** Lowercase and strip accents so "Beige" matches "beige" and "Café" matches "cafe". */
function normalize(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Cleans a raw ?q= value; returns "" when there's nothing to search for. */
export function parseQuery(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.trim().replace(/\s+/g, " ").slice(0, MAX_QUERY_LENGTH);
}

/**
 * Every word must appear somewhere in the product's name, category, colours,
 * sizes or description. Names count most, so they're ranked first.
 */
export function searchProducts(products: Product[], query: string): Product[] {
  const words = normalize(query).split(" ").filter(Boolean);
  if (words.length === 0) return products;

  const scored: { product: Product; score: number }[] = [];
  for (const p of products) {
    const name = normalize(p.name);
    const rest = normalize(
      [p.category, ...p.colors, ...p.sizes, p.description].join(" "),
    );
    let score = 0;
    let all = true;
    for (const w of words) {
      // Allow simple plurals: "bags" finds "bag", "dress" finds "dresses".
      const stem = w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w;
      if (name.includes(w) || name.includes(stem)) score += 3;
      else if (rest.includes(w) || rest.includes(stem)) score += 1;
      else {
        all = false;
        break;
      }
    }
    if (all) scored.push({ product: p, score });
  }

  // Stable sort keeps the caller's order (e.g. newest) among equal scores.
  return scored.sort((a, b) => b.score - a.score).map((s) => s.product);
}
