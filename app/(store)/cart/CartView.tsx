"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore } from "react";
import {
  isOrderable,
  removeLine,
  setQuantity,
  syncCart,
  useCart,
  type CartLine,
} from "@/lib/cart/store";
import { saveFavourite } from "@/lib/favourites/store";
import { formatPrice, productImageUrl } from "@/lib/products/shared";
import { openWhatsAppOrder } from "@/lib/whatsapp";
import { AlertIcon, BagIcon, ChatIcon, HeartIcon, TrashIcon } from "../_components/icons";
import QuantityStepper from "../_components/QuantityStepper";
import { getLiveProducts } from "./actions";

const LOW_STOCK = 3;

const noopSubscribe = () => () => {};
/** False during SSR/hydration, true once running in the browser. */
function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export default function CartView() {
  const lines = useCart();
  const hydrated = useHydrated();
  useRefreshFromServer(lines);

  const orderable = lines.filter(isOrderable);
  const itemCount = orderable.reduce((n, l) => n + l.qty, 0);
  const subtotal = orderable.reduce((sum, l) => sum + l.price * l.qty, 0);

  function handleOrder() {
    openWhatsAppOrder(
      orderable.map((l) => ({
        name: l.name,
        slug: l.slug,
        size: l.size,
        color: l.color,
        qty: l.qty,
        price: l.price,
      })),
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pt-8 sm:px-8 sm:pt-12">
      <div className="flex items-end justify-between gap-4">
        <h1 className="font-serif text-3xl text-ink sm:text-4xl">My Cart</h1>
        <Link href="/shop" className="text-sm text-ink underline-offset-4 hover:underline sm:text-base">
          Continue Shopping
        </Link>
      </div>

      {!hydrated ? (
        <CartSkeleton />
      ) : lines.length === 0 ? (
        <EmptyCart />
      ) : (
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_360px]">
          <ul className="flex flex-col gap-4" aria-label="Items in your cart">
            {lines.map((l) => (
              <li key={l.key}>
                <CartItem line={l} />
              </li>
            ))}
          </ul>

          <aside
            aria-labelledby="summary-heading"
            className="rounded-xl border border-line bg-white lg:sticky lg:top-28"
          >
            <div className="p-6">
              <h2 id="summary-heading" className="text-lg text-ink">
                Order Summary
              </h2>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">
                    Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
                  </dt>
                  <dd className="tabular-nums text-ink">{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Delivery</dt>
                  <dd className="text-right text-whatsapp">Confirmed on WhatsApp</dd>
                </div>
              </dl>
            </div>

            <div className="flex items-baseline justify-between gap-4 border-y border-line px-6 py-5">
              <span className="text-lg text-ink">Total</span>
              <span className="text-2xl font-medium tabular-nums text-ink">{formatPrice(subtotal)}</span>
            </div>

            <div className="flex flex-col gap-3 p-6">
              <button
                type="button"
                onClick={handleOrder}
                disabled={orderable.length === 0}
                className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-ink px-6 py-3.5 text-[15px] text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChatIcon />
                Order on WhatsApp
              </button>
              <Link
                href="/shop"
                className="flex w-full items-center justify-center rounded-lg border border-line px-6 py-3.5 text-[15px] text-ink transition-colors hover:border-ink"
              >
                Continue Shopping
              </Link>
              <p className="mt-1 text-center text-xs leading-relaxed text-muted">
                WhatsApp opens with your order written out. Just press send and we&apos;ll
                confirm availability, delivery and payment with you there.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function CartItem({ line }: { line: CartLine }) {
  const options = [line.size, line.color].filter(Boolean).join(", ");
  const soldOut = !line.unavailable && line.stock <= 0;
  const muted = line.unavailable || soldOut;

  return (
    <article className="flex gap-4 rounded-xl border border-line bg-white p-4 sm:gap-6 sm:p-5">
      <Link
        href={`/products/${line.slug}`}
        className={`relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-lg bg-blush sm:w-28 ${muted ? "opacity-50" : ""}`}
        tabIndex={-1}
        aria-hidden
      >
        {line.image ? (
          <Image src={productImageUrl(line.image)} alt="" fill sizes="112px" className="object-cover" />
        ) : null}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[15px] leading-snug text-ink sm:text-base">
              <Link href={`/products/${line.slug}`} className="underline-offset-4 hover:underline">
                {line.name}
              </Link>
            </h3>
            {options ? <p className="mt-0.5 text-sm text-muted">{options}</p> : null}
          </div>
          <div className="-mr-1 -mt-1 flex shrink-0 items-center">
            <button
              type="button"
              onClick={() => saveForLater(line)}
              aria-label={`Save ${line.name} for later`}
              className="flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm text-muted transition-colors hover:bg-blush/60 hover:text-ink"
            >
              <HeartIcon size={17} />
              <span className="hidden sm:inline">Save</span>
            </button>
            <button
              type="button"
              onClick={() => removeLine(line.key)}
              aria-label={`Remove ${line.name} from cart`}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-blush/60 hover:text-ink"
            >
              <TrashIcon size={17} />
            </button>
          </div>
        </div>

        {line.unavailable ? (
          <Notice>This piece is no longer available. Remove it to continue.</Notice>
        ) : soldOut ? (
          <Notice>Sold out. It won&apos;t be included in your order.</Notice>
        ) : line.stock <= LOW_STOCK ? (
          <Notice>Only {line.stock} left in stock</Notice>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
          <p className="tabular-nums">
            <span className={`text-lg ${muted ? "text-muted line-through" : "text-ink"}`}>
              {formatPrice(line.price * line.qty)}
            </span>
            {line.qty > 1 ? (
              <span className="ml-1.5 text-xs text-muted">{formatPrice(line.price)} each</span>
            ) : null}
          </p>
          {muted ? null : (
            <QuantityStepper
              label={`Quantity of ${line.name}`}
              value={line.qty}
              max={line.stock}
              onChange={(n) => setQuantity(line.key, n)}
            />
          )}
        </div>
      </div>
    </article>
  );
}

/** Moves a cart line to favourites. */
function saveForLater(line: CartLine) {
  saveFavourite({
    productId: line.productId,
    slug: line.slug,
    name: line.name,
    image: line.image,
    price: line.price,
    compareAtPrice: null,
    stock: line.stock,
    // Refreshed from the catalog when the favourites page opens.
    sizes: line.size ? [line.size] : [],
    colors: line.color ? [line.color] : [],
  });
  removeLine(line.key);
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 flex items-center gap-2 rounded-md bg-blush/60 px-3 py-2 text-xs text-accent">
      <AlertIcon size={14} className="shrink-0" />
      {children}
    </p>
  );
}

function EmptyCart() {
  return (
    <div className="mt-6 flex flex-col items-center rounded-xl border border-line px-6 py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blush text-ink">
        <BagIcon size={24} />
      </span>
      <p className="mt-5 font-serif text-2xl text-ink">Your cart is empty</p>
      <p className="mt-2 max-w-sm text-muted">Find something you love and it will wait for you here.</p>
      <Link
        href="/shop"
        className="mt-8 rounded-lg bg-ink px-8 py-3.5 text-sm uppercase tracking-wider text-white transition-colors hover:bg-black"
      >
        Shop the collection
      </Link>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your cart" className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="flex gap-4 rounded-xl border border-line p-5">
            <div className="aspect-[3/4] w-28 animate-pulse rounded-lg bg-blush" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-1/2 animate-pulse bg-line" />
              <div className="h-3 w-1/4 animate-pulse bg-line" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-xl bg-blush/50" />
    </div>
  );
}

/** Once per visit, refresh saved prices/stock against the live catalog. */
function useRefreshFromServer(lines: CartLine[]) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current || lines.length === 0) return;
    done.current = true;
    getLiveProducts(lines.map((l) => l.productId))
      .then(syncCart)
      .catch(() => {
        // Offline or Supabase hiccup: keep showing saved data.
      });
  }, [lines]);
}
