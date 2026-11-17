// Client-side cart, kept in localStorage so it survives reloads and stays in
// sync across tabs. Orders are placed over WhatsApp, so there is no server cart.

import { createLocalStore, type LiveProduct } from "@/lib/local-store";

export type CartLine = {
  /** productId + size + colour, so the same piece in two sizes is two lines. */
  key: string;
  productId: string;
  slug: string;
  name: string;
  /** Storage path of the cover photo. */
  image: string | null;
  price: number;
  size: string | null;
  color: string | null;
  qty: number;
  stock: number;
  /** Set when the product was unpublished or deleted since it was added. */
  unavailable?: boolean;
};

export type CartProductInput = Omit<CartLine, "key" | "qty" | "unavailable">;

function isLine(v: unknown): v is CartLine {
  if (!v || typeof v !== "object") return false;
  const l = v as Record<string, unknown>;
  return (
    typeof l.key === "string" &&
    typeof l.productId === "string" &&
    typeof l.slug === "string" &&
    typeof l.name === "string" &&
    typeof l.price === "number" &&
    typeof l.qty === "number" &&
    typeof l.stock === "number"
  );
}

const store = createLocalStore<CartLine>("gh-cart-v1", isLine);

export function lineKey(productId: string, size: string | null, color: string | null) {
  return `${productId}|${size ?? ""}|${color ?? ""}`;
}

/** Adds `qty` of a product, capped at stock. Returns the line's new quantity. */
export function addToCart(product: CartProductInput, qty = 1): number {
  const key = lineKey(product.productId, product.size, product.color);
  const list = store.get();
  const existing = list.find((l) => l.key === key);
  const max = Math.max(product.stock, 0);
  if (existing) {
    const nextQty = Math.min(existing.qty + qty, max);
    store.set(list.map((l) => (l.key === key ? { ...l, ...product, qty: nextQty, unavailable: false } : l)));
    return nextQty;
  }
  const nextQty = Math.min(qty, max);
  if (nextQty <= 0) return 0;
  store.set([...list, { ...product, key, qty: nextQty }]);
  return nextQty;
}

export function setQuantity(key: string, qty: number) {
  store.set(
    store.get().map((l) =>
      l.key === key ? { ...l, qty: Math.max(1, Math.min(qty, Math.max(l.stock, 1))) } : l,
    ),
  );
}

export function removeLine(key: string) {
  store.set(store.get().filter((l) => l.key !== key));
}

export function clearCart() {
  store.set([]);
}

/** Refreshes price/name/stock from the server and flags removed products. */
export function syncCart(products: LiveProduct[]) {
  const byId = new Map(products.map((p) => [p.id, p]));
  store.set(
    store.get().map((l) => {
      const p = byId.get(l.productId);
      if (!p) return { ...l, unavailable: true };
      return {
        ...l,
        slug: p.slug,
        name: p.name,
        price: p.price,
        stock: p.stock,
        image: p.image ?? l.image,
        qty: p.stock > 0 ? Math.min(l.qty, p.stock) : l.qty,
        unavailable: false,
      };
    }),
  );
}

/** True when the line can be ordered right now. */
export function isOrderable(l: CartLine) {
  return !l.unavailable && l.stock > 0;
}

export const useCart = store.useItems;

export function useCartCount(): number {
  return useCart().reduce((n, l) => n + (isOrderable(l) ? l.qty : 0), 0);
}
