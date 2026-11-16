import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getProductBySlug } from "@/lib/products/queries";
import { formatPrice, productImageUrl } from "@/lib/products/shared";

type Params = PageProps<"/products/[slug]">["params"];

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Not found · Girl's Hood" };
  return {
    title: `${product.name} · Girl's Hood`,
    description: product.description.slice(0, 160) || `${product.name} from Girl's Hood.`,
  };
}

export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    <main className="flex-1">
      <Suspense fallback={<ProductSkeleton />}>
        <ProductDetail params={params} />
      </Suspense>
    </main>
  );
}

async function ProductDetail({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const onSale = product.compare_at_price !== null && product.compare_at_price > product.price;
  const soldOut = product.stock === 0;

  return (
    <div className="mx-auto max-w-7xl px-5 pt-6 sm:px-8 sm:pt-10">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/shop" className="hover:text-ink">Shop</Link></li>
          <li aria-hidden>/</li>
          <li>
            <Link href={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-ink">
              {product.category}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="truncate text-ink">{product.name}</li>
        </ol>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
        {/* Gallery: swipe on phones, two-column grid on desktop */}
        <ul className="-mx-5 flex snap-x snap-mandatory gap-2 overflow-x-auto px-5 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-2 lg:overflow-visible lg:px-0">
          {product.images.map((path, i) => (
            <li
              key={path}
              className={`relative aspect-[3/4] w-[85%] shrink-0 snap-start overflow-hidden bg-blush sm:w-[60%] lg:w-auto ${
                i === 0 && product.images.length % 2 === 1 ? "lg:col-span-2 lg:aspect-[4/5]" : ""
              }`}
            >
              <Image
                src={productImageUrl(path)}
                alt={i === 0 ? product.name : `${product.name}, photo ${i + 1}`}
                fill
                preload={i === 0}
                sizes="(min-width: 1024px) 40vw, 85vw"
                className="object-cover"
              />
            </li>
          ))}
        </ul>

        {/* Details */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">{product.category}</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">{product.name}</h1>

          <p className="mt-5 text-2xl">
            {onSale ? (
              <>
                <span className="text-accent">{formatPrice(product.price)}</span>
                <span className="ml-3 text-lg text-muted line-through">
                  {formatPrice(product.compare_at_price!)}
                </span>
              </>
            ) : (
              <span className="text-ink">{formatPrice(product.price)}</span>
            )}
          </p>

          <p className={`mt-2 text-sm ${soldOut ? "text-accent" : "text-muted"}`}>
            {soldOut ? "Sold out" : product.stock <= 3 ? `Only ${product.stock} left` : "In stock"}
          </p>

          {product.sizes.length > 0 ? (
            <div className="mt-8">
              <p className="text-sm text-muted">Sizes</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <li key={s} className="min-w-12 border border-line px-4 py-2 text-center text-sm text-ink">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {product.colors.length > 0 ? (
            <div className="mt-6">
              <p className="text-sm text-muted">Colours</p>
              <p className="mt-1 text-ink">{product.colors.join(" · ")}</p>
            </div>
          ) : null}

          {/* Add-to-bag (size picker + button) is built with the cart. */}
          <button
            type="button"
            disabled
            className="mt-10 w-full bg-ink px-8 py-4 text-sm uppercase tracking-wider text-white opacity-60"
          >
            {soldOut ? "Sold out" : "Add to bag — coming soon"}
          </button>

          {product.description ? (
            <div className="mt-10 border-t border-line pt-6">
              <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-ink">Details</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-muted">{product.description}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div aria-busy="true" className="mx-auto max-w-7xl px-5 pt-10 sm:px-8">
      <div className="h-4 w-48 animate-pulse bg-line" />
      <div className="mt-6 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="aspect-[4/5] animate-pulse bg-blush" />
        <div className="space-y-4">
          <div className="h-3 w-24 animate-pulse bg-line" />
          <div className="h-12 w-3/4 animate-pulse bg-line" />
          <div className="h-6 w-28 animate-pulse bg-line" />
        </div>
      </div>
    </div>
  );
}
