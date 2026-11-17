// Client-side cart, kept in localStorage so it survives reloads and stays in
// sync across tabs. Orders are placed over WhatsApp, so there is no server cart.

import { useSyncExternalStore } from "react";

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

/** Live product data used to refresh lines (see app/(store)/cart/actions.ts). */
export type LiveCartProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  stock: number;
  image: string | null;
};

const STORAGE_KEY = "gh-cart-v1";
const EMPTY: CartLine[] = [];

let lines: CartLine[] | null = null;
const listeners = new Set<() => void>();

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

function read(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isLine) : [];
  } catch {
    return [];
  }
}

function current(): CartLine[] {
  if (lines === null) lines = read();
  return lines;
}

function commit(next: CartLine[]) {
  lines = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode / storage full: the cart still works for this page view.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      lines = read();
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function lineKey(productId: string, size: string | null, color: string | null) {
  return `${productId}|${size ?? ""}|${color ?? ""}`;
}

/** Adds `qty` of a product, capped at stock. Returns the line's new quantity. */
export function addToCart(product: CartProductInput, qty = 1): number {
  const key = lineKey(product.productId, product.size, product.color);
  const list = current();
  const existing = list.find((l) => l.key === key);
  const max = Math.max(product.stock, 0);
  if (existing) {
    const nextQty = Math.min(existing.qty + qty, max);
    commit(list.map((l) => (l.key === key ? { ...l, ...product, qty: nextQty, unavailable: false } : l)));
    return nextQty;
  }
  const nextQty = Math.min(qty, max);
  if (nextQty <= 0) return 0;
  commit([...list, { ...product, key, qty: nextQty }]);
  return nextQty;
}

export function setQuantity(key: string, qty: number) {
  commit(
    current().map((l) =>
      l.key === key ? { ...l, qty: Math.max(1, Math.min(qty, Math.max(l.stock, 1))) } : l,
    ),
  );
}

export function removeLine(key: string) {
  commit(current().filter((l) => l.key !== key));
}

export function clearCart() {
  commit([]);
}

/** Refreshes price/name/stock from the server and flags removed products. */
export function syncCart(products: LiveCartProduct[]) {
  const byId = new Map(products.map((p) => [p.id, p]));
  commit(
    current().map((l) => {
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

export function useCart(): CartLine[] {
  return useSyncExternalStore(subscribe, current, () => EMPTY);
}

export function useCartCount(): number {
  const list = useCart();
  return list.reduce((n, l) => n + (isOrderable(l) ? l.qty : 0), 0);
}
