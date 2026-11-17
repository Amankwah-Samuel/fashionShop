"use client";

import { useEffect, useState } from "react";
import { addToCart } from "@/lib/cart/store";
import { openWhatsAppOrder } from "@/lib/whatsapp";
import type { BuyBoxProduct } from "./BuyBox";
import { BagIcon, ChatIcon, CheckIcon } from "./icons";

/**
 * Quick "Add to cart" / "Order on WhatsApp" under a product card. No picker:
 * a single fixed size/colour is filled in automatically, anything else is
 * optional and can be chosen on the product page or confirmed on WhatsApp.
 */
export default function CardActions({ product }: { product: BuyBoxProduct }) {
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 2000);
    return () => clearTimeout(t);
  }, [added]);

  if (product.stock <= 0) return null;

  const size = product.sizes.length === 1 ? product.sizes[0] : null;
  const color = product.colors.length === 1 ? product.colors[0] : null;

  function handleAdd() {
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
  }

  function handleOrder() {
    openWhatsAppOrder([{ name: product.name, slug: product.slug, size, color, qty: 1, price: product.price }]);
  }

  return (
    <div className="mt-3 flex gap-2">
      <button
        type="button"
        onClick={handleAdd}
        aria-label={`Add ${product.name} to cart`}
        className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs uppercase tracking-wider transition-colors ${
          added ? "border-ink bg-ink text-white" : "border-line text-ink hover:border-ink"
        }`}
      >
        {added ? <CheckIcon size={15} /> : <BagIcon size={15} />}
        <span className="truncate">{added ? "Added" : "Add to cart"}</span>
      </button>
      <button
        type="button"
        onClick={handleOrder}
        aria-label={`Order ${product.name} on WhatsApp`}
        title="Order on WhatsApp"
        className="flex h-8.5 w-10 shrink-0 items-center justify-center rounded-lg border border-line text-whatsapp transition-colors hover:border-ink"
      >
        <ChatIcon size={17} />
      </button>
    </div>
  );
}
