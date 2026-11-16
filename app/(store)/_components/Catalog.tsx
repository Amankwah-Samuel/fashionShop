import Link from "next/link";
import { Suspense } from "react";
import { getNewArrivals, getPublishedProducts } from "@/lib/products/queries";
import { CATEGORIES, type Product } from "@/lib/products/shared";
import ProductCard from "./ProductCard";

// One catalog used by both /shop and /new-arrivals.

type Source = "all" | "new";
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;
type Sort = (typeof SORTS)[number]["value"];

export default function Catalog({
  eyebrow,
  title,
  intro,
  source,
  basePath,
  searchParams,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  source: Source;
  basePath: string;
  searchParams: SearchParams;
}) {
  return (
    <main className="flex-1">
      {/* Title banner (static, renders instantly) */}
      <section className="bg-blush">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">{eyebrow}</p>
          <span className="mt-4 block h-px w-12 bg-accent/60" />
          <h1 className="mt-6 font-serif text-5xl text-ink sm:text-6xl">{title}</h1>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-muted">{intro}</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Suspense fallback={<CatalogSkeleton />}>
          <CatalogResults source={source} basePath={basePath} searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function CatalogResults({
  source,
  basePath,
  searchParams,
}: {
  source: Source;
  basePath: string;
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const all = source === "new" ? await getNewArrivals(48) : await getPublishedProducts();

  // Only offer categories that actually have products.
  const categories = CATEGORIES.filter((c) => all.some((p) => p.category === c));
  const category =
    typeof params.category === "string" && (categories as string[]).includes(params.category)
      ? params.category
      : undefined;
  const sort: Sort = SORTS.some((s) => s.value === params.sort)
    ? (params.sort as Sort)
    : "newest";

  const products = sortProducts(
    category ? all.filter((p) => p.category === category) : all,
    sort,
  );

  const href = (next: { category?: string; sort?: Sort }) => {
    const q = new URLSearchParams();
    const c = "category" in next ? next.category : category;
    const s = next.sort ?? sort;
    if (c) q.set("category", c);
    if (s !== "newest") q.set("sort", s);
    const qs = q.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  if (all.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="font-serif text-3xl text-ink">
          {source === "new" ? "New pieces are on their way" : "The collection is coming soon"}
        </p>
        <p className="mt-3 text-muted">Check back shortly. We&apos;re styling something lovely.</p>
        {source === "new" ? null : (
          <Link href="/" className="mt-8 inline-block border-b border-muted/50 pb-0.5 text-muted hover:border-ink hover:text-ink">
            Back to home
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Toolbar: categories + sort */}
      <div className="sticky top-20 z-30 -mx-5 flex flex-col gap-4 border-b border-line bg-white/95 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Categories" className="-mx-1 overflow-x-auto">
          <ul className="flex gap-2 px-1">
            <li>
              <FilterPill href={href({ category: undefined })} active={!category}>
                All
              </FilterPill>
            </li>
            {categories.map((c) => (
              <li key={c}>
                <FilterPill href={href({ category: c })} active={category === c}>
                  {c}
                </FilterPill>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center justify-between gap-6 text-sm lg:justify-end">
          <p className="text-muted" aria-live="polite">
            {products.length} {products.length === 1 ? "piece" : "pieces"}
          </p>
          <nav aria-label="Sort" className="flex items-center gap-1">
            <span className="mr-1 hidden text-muted sm:inline">Sort:</span>
            {SORTS.map((s) => (
              <Link
                key={s.value}
                href={href({ sort: s.value })}
                scroll={false}
                aria-current={sort === s.value ? "true" : undefined}
                className={`px-2 py-1 transition-colors ${
                  sort === s.value ? "text-ink underline underline-offset-4" : "text-muted hover:text-ink"
                }`}
              >
                {s.value === "newest" ? "Newest" : s.value === "price-asc" ? "Price ↑" : "Price ↓"}
                <span className="sr-only"> ({s.label})</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
        {products.map((p, i) => (
          <li key={p.id}>
            <ProductCard product={p} showNewBadge={source !== "new"} priority={i < 4} />
          </li>
        ))}
      </ul>
    </>
  );
}

function sortProducts(list: Product[], sort: Sort): Product[] {
  const copy = [...list];
  if (sort === "price-asc") copy.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") copy.sort((a, b) => b.price - a.price);
  else copy.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return copy;
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={`block whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition-colors ${
        active
          ? "border-ink bg-ink text-white"
          : "border-line bg-white text-muted hover:border-rose hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function CatalogSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading products">
      <div className="flex gap-2 border-b border-line py-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-blush" />
        ))}
      </div>
      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[3/4] animate-pulse bg-blush" />
            <div className="mt-4 h-4 w-2/3 animate-pulse bg-line" />
            <div className="mt-2 h-3 w-1/3 animate-pulse bg-line" />
          </div>
        ))}
      </div>
    </div>
  );
}
