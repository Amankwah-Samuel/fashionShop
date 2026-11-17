"use client";

import { toggleFavourite, useIsFavourite } from "@/lib/favourites/store";
import type { BuyBoxProduct } from "./BuyBox";
import { HeartIcon } from "./icons";

/** Heart toggle. `overlay` sits on a product photo; `full` is a labelled button. */
export default function FavouriteButton({
  product,
  variant = "overlay",
}: {
  product: BuyBoxProduct;
  variant?: "overlay" | "full";
}) {
  const saved = useIsFavourite(product.id);

  function toggle() {
    toggleFavourite({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      stock: product.stock,
      sizes: product.sizes,
      colors: product.colors,
    });
  }

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-pressed={saved}
        className="flex w-full items-center justify-center gap-2.5 rounded-lg px-8 py-3 text-sm text-ink transition-colors hover:bg-blush/50"
      >
        <HeartIcon filled={saved} className={saved ? "text-accent" : ""} />
        {saved ? "Saved to favourites" : "Save to favourites"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${product.name} from favourites` : `Save ${product.name} to favourites`}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-colors hover:text-accent ${
        saved ? "text-accent" : "text-ink"
      }`}
    >
      <HeartIcon size={17} filled={saved} />
    </button>
  );
}
