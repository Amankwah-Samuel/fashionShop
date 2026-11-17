"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { removeFavourite, syncFavourites, useFavourites, type SavedItem } from "@/lib/favourites/store";
import { formatPrice, productImageUrl } from "@/lib/products/shared";
import CardActions from "../_components/CardActions";
import FavouriteButton from "../_components/FavouriteButton";
import { HeartIcon } from "../_components/icons";
import { getLiveProducts } from "../cart/actions";

const noopSubscribe = () => () => {};

export default function FavouritesView() {
  const items = useFavourites();
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  useRefreshFromServer(items);

  return (
    <div className="mx-auto max-w-7xl px-5 pt-8 sm:px-8 sm:pt-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-ink sm:text-4xl">Favourites</h1>
          {hydrated && items.length > 0 ? (
            <p className="mt-1 text-sm text-muted">
              {items.length} saved {items.length === 1 ? "piece" : "pieces"}
            </p>
          ) : null}
        </div>
        <Link href="/shop" className="text-sm text-ink underline-offset-4 hover:underline sm:text-base">
          Continue Shopping
        </Link>
      </div>

      {!hydrated ? (
        <div aria-busy="true" className="mt-8 grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="aspect-[3/4] animate-pulse bg-blush" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-xl border border-line px-6 py-20 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blush text-accent">
            <HeartIcon size={24} />
          </span>
          <p className="mt-5 font-serif text-2xl text-ink">No favourites yet</p>
          <p className="mt-2 max-w-sm text-muted">
            Tap the heart on any piece to save it here for later.
          </p>
          <Link
            href="/shop"
            className="mt-8 rounded-lg bg-ink px-8 py-3.5 text-sm uppercase tracking-wider text-white transition-colors hover:bg-black"
          >
            Browse the shop
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
          {items.map((item) => (
            <li key={item.productId}>
              <SavedCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SavedCard({ item }: { item: SavedItem }) {
  const soldOut = !item.unavailable && item.stock <= 0;
  const onSale = item.compareAtPrice !== null && item.compareAtPrice > item.price;
  const product = {
    id: item.productId,
    slug: item.slug,
    name: item.name,
    price: item.price,
    compareAtPrice: item.compareAtPrice,
    stock: item.unavailable ? 0 : item.stock,
    sizes: item.sizes,
    colors: item.colors,
    image: item.image,
  };

  return (
    <div className="relative">
      <div className="absolute right-2.5 top-2.5 z-10">
        <FavouriteButton product={product} />
      </div>
      <Link href={`/products/${item.slug}`} className="group block">
        <div className="relative aspect-[3/4] overflow-hidden bg-blush">
          {item.image ? (
            <Image
              src={productImageUrl(item.image)}
              alt={item.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className={`object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] ${
                item.unavailable || soldOut ? "opacity-60" : ""
              }`}
            />
          ) : null}
          {item.unavailable || soldOut ? (
            <span className="absolute left-3 top-3 bg-ink px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white">
              {item.unavailable ? "Unavailable" : "Sold out"}
            </span>
          ) : null}
        </div>
        <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <h3 className="line-clamp-2 min-w-0 text-[15px] text-ink underline-offset-4 group-hover:underline sm:truncate">
            {item.name}
          </h3>
          <p className="shrink-0 text-[15px] sm:text-right">
            {onSale ? (
              <>
                <span className="text-accent">{formatPrice(item.price)}</span>
                <span className="ml-1.5 text-sm text-muted line-through">{formatPrice(item.compareAtPrice!)}</span>
              </>
            ) : (
              <span className="text-ink">{formatPrice(item.price)}</span>
            )}
          </p>
        </div>
      </Link>

      {item.unavailable ? (
        <button
          type="button"
          onClick={() => removeFavourite(item.productId)}
          className="mt-3 w-full rounded-lg border border-line px-3 py-2 text-xs uppercase tracking-wider text-muted transition-colors hover:border-ink hover:text-ink"
        >
          Remove
        </button>
      ) : (
        <CardActions product={product} />
      )}
    </div>
  );
}

/** Once per visit, refresh saved prices/stock against the live catalog. */
function useRefreshFromServer(items: SavedItem[]) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current || items.length === 0) return;
    done.current = true;
    getLiveProducts(items.map((s) => s.productId))
      .then(syncFavourites)
      .catch(() => {
        // Offline or Supabase hiccup: keep showing saved data.
      });
  }, [items]);
}
