// A tiny list store persisted to localStorage, synced across tabs.
// Used by the cart and favourites (both live only in the shopper's browser).

import { useSyncExternalStore } from "react";

export function createLocalStore<T>(storageKey: string, isItem: (v: unknown) => v is T) {
  const EMPTY: T[] = [];
  let items: T[] | null = null;
  const listeners = new Set<() => void>();

  function read(): T[] {
    try {
      const raw = window.localStorage.getItem(storageKey);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter(isItem) : [];
    } catch {
      return [];
    }
  }

  function get(): T[] {
    if (items === null) items = read();
    return items;
  }

  function set(next: T[]) {
    items = next;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Private mode / storage full: still works for this page view.
    }
    listeners.forEach((l) => l());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey) {
        items = read();
        listener();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  function useItems(): T[] {
    return useSyncExternalStore(subscribe, get, () => EMPTY);
  }

  return { get, set, useItems };
}

/** Live catalog data used to refresh saved items (see app/(store)/cart/actions.ts). */
export type LiveProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  image: string | null;
  sizes: string[];
  colors: string[];
};
