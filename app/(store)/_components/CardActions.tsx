"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { addToCart } from "@/lib/cart/store";
import { openWhatsAppOrder } from "@/lib/whatsapp";
import type { BuyBoxProduct } from "./BuyBox";
import { BagIcon, ChatIcon, CheckIcon } from "./icons";

type Intent = "cart" | "whatsapp";

/**
 * Quick "Add to cart" / "Order on WhatsApp" under a product card.
 * Products with one size and colour act instantly; products with several sizes
 * show an inline size picker; several colours sends the shopper to the product page.
 */
export default function CardActions({ product }: { product: BuyBoxProduct }) {
  const soldOut = product.stock <= 0;
  const needsColor = product.colors.length > 1;
  const needsSize = product.sizes.length > 1;
  const [picking, setPicking] = useState<Intent | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 2000);
    return () => clearTimeout(t);
  }, [added]);

  function run(intent: Intent, size: string | null) {
    const color = product.colors[0] ?? null;
    setPicking(null);
    if (intent === "cart") {
      addToCart(
        {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          image: product.image,
          price: product.price,
          stock: product.stock,
          size,
          color,
        },
        1,
      );
      setAdded(true);
    } else {
      openWhatsAppOrder([{ name: product.name, slug: product.slug, size, color, qty: 1, price: product.price }]);
    }
  }

  function start(intent: Intent) {
    if (needsSize) setPicking((p) => (p === intent ? null : intent));
    else run(intent, product.sizes[0] ?? null);
  }

  if (soldOut) return null;

  if (needsColor) {
    return (
      <Link
        href={`/products/${product.slug}`}
        className="mt-3 flex w-full items-center justify-center rounded-lg border border-line px-3 py-2 text-xs uppercase tracking-wider text-ink transition-colors hover:border-ink"
      >
        Choose options
      </Link>
    );
  }

  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => start("cart")}
          aria-expanded={needsSize ? picking === "cart" : undefined}
          aria-label={`Add ${product.name} to cart`}
          className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs uppercase tracking-wider transition-colors ${
            added
              ? "border-ink bg-ink text-white"
              : picking === "cart"
                ? "border-ink text-ink"
                : "border-line text-ink hover:border-ink"
          }`}
        >
          {added ? <CheckIcon size={15} /> : <BagIcon size={15} />}
          <span className="truncate">{added ? "Added" : "Add to cart"}</span>
        </button>
        <button
          type="button"
          onClick={() => start("whatsapp")}
          aria-expanded={needsSize ? picking === "whatsapp" : undefined}
          aria-label={`Order ${product.name} on WhatsApp`}
          title="Order on WhatsApp"
          className={`flex h-[34px] w-10 shrink-0 items-center justify-center rounded-lg border text-whatsapp transition-colors ${
            picking === "whatsapp" ? "border-ink" : "border-line hover:border-ink"
          }`}
        >
          <ChatIcon size={17} />
        </button>
      </div>

      {picking ? (
        <div className="mt-2 rounded-lg border border-line p-2">
          <p className="px-1 text-[11px] uppercase tracking-wider text-muted">
            {picking === "cart" ? "Pick a size to add" : "Pick a size to order"}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => run(picking, s)}
                className="min-w-9 rounded-md border border-line px-2 py-1 text-xs text-ink transition-colors hover:border-ink hover:bg-ink hover:text-white"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
