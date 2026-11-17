// Favourites ("saved for later"), kept in localStorage like the cart.
// One entry per product; size/colour are picked when it goes to the cart.

import { createLocalStore, type LiveProduct } from "@/lib/local-store";

export type SavedItem = {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  sizes: string[];
  colors: string[];
  /** Set when the product was unpublished or deleted since it was saved. */
  unavailable?: boolean;
};

function isSaved(v: unknown): v is SavedItem {
  if (!v || typeof v !== "object") return false;
  const s = v as Record<string, unknown>;
  return (
    typeof s.productId === "string" &&
    typeof s.slug === "string" &&
    typeof s.name === "string" &&
    typeof s.price === "number" &&
    typeof s.stock === "number" &&
    Array.isArray(s.sizes) &&
    Array.isArray(s.colors)
  );
}

const store = createLocalStore<SavedItem>("gh-favourites-v1", isSaved);

export function saveFavourite(item: SavedItem) {
  const rest = store.get().filter((s) => s.productId !== item.productId);
  store.set([{ ...item, unavailable: false }, ...rest]);
}

export function removeFavourite(productId: string) {
  store.set(store.get().filter((s) => s.productId !== productId));
}

/** Saves or un-saves; returns true if the item is now saved. */
export function toggleFavourite(item: SavedItem): boolean {
  if (store.get().some((s) => s.productId === item.productId)) {
    removeFavourite(item.productId);
    return false;
  }
  saveFavourite(item);
  return true;
}

export function syncFavourites(products: LiveProduct[]) {
  const byId = new Map(products.map((p) => [p.id, p]));
  store.set(
    store.get().map((s) => {
      const p = byId.get(s.productId);
      if (!p) return { ...s, unavailable: true };
      return {
        ...s,
        slug: p.slug,
        name: p.name,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        stock: p.stock,
        image: p.image ?? s.image,
        sizes: p.sizes,
        colors: p.colors,
        unavailable: false,
      };
    }),
  );
}

export const useFavourites = store.useItems;

export function useIsFavourite(productId: string): boolean {
  return useFavourites().some((s) => s.productId === productId);
}
