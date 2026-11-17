import Image from "next/image";
import Link from "next/link";
import { formatPrice, productImageUrl, type Product } from "@/lib/products/shared";
import CardActions from "./CardActions";

export default function ProductCard({
  product,
  showNewBadge = true,
  priority = false,
}: {
  product: Product;
  showNewBadge?: boolean;
  priority?: boolean;
}) {
  const [cover, hover] = product.images;
  const onSale = product.compare_at_price !== null && product.compare_at_price > product.price;
  const soldOut = product.stock === 0;
  const sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw";

  return (
    <div>
      <Link href={`/products/${product.slug}`} className="group block">
        <div className="relative aspect-[3/4] overflow-hidden bg-blush">
          {cover ? (
            <Image
              src={productImageUrl(cover)}
              alt={product.name}
              fill
              sizes={sizes}
              preload={priority}
              className={`object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] ${soldOut ? "opacity-70" : ""}`}
            />
          ) : null}
          {/* Second photo fades in on hover (desktop) */}
          {hover ? (
            <Image
              src={productImageUrl(hover)}
              alt=""
              fill
              sizes={sizes}
              className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          ) : null}

          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5 text-[10px] font-medium uppercase tracking-[0.2em]">
            {soldOut ? (
              <span className="bg-ink px-2.5 py-1 text-white">Sold out</span>
            ) : onSale ? (
              <span className="bg-rose px-2.5 py-1 text-ink">Sale</span>
            ) : null}
            {showNewBadge && product.is_new_arrival && !soldOut ? (
              <span className="bg-white/90 px-2.5 py-1 text-ink">New</span>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-[15px] text-ink underline-offset-4 group-hover:underline sm:truncate">
              {product.name}
            </h3>
            <p className="mt-0.5 text-xs uppercase tracking-wider text-muted">
              {product.category}
            </p>
          </div>
          <p className="shrink-0 text-[15px] sm:text-right">
            {onSale ? (
              <>
                <span className="text-accent">{formatPrice(product.price)}</span>
                <span className="ml-1.5 text-sm text-muted line-through">
                  {formatPrice(product.compare_at_price!)}
                </span>
              </>
            ) : (
              <span className="text-ink">{formatPrice(product.price)}</span>
            )}
          </p>
        </div>
      </Link>
      <CardActions
        product={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: Number(product.price),
          stock: product.stock,
          sizes: product.sizes,
          colors: product.colors,
          image: cover ?? null,
        }}
      />
    </div>
  );
}
