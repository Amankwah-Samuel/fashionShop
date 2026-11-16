import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/dal";
import { adminListProducts } from "@/lib/products/queries";
import { formatPrice, productImageUrl } from "@/lib/products/shared";
import RowActions from "./RowActions";

export const metadata: Metadata = { title: "Products" };

const LOW_STOCK = 3;

export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold">
            Catalogue
          </p>
          <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">Products</h1>
        </div>
        <Link
          href="/admin/products/new"
          className="bg-ink px-5 py-3 text-sm uppercase tracking-wider text-white transition-colors hover:bg-black"
        >
          + Add product
        </Link>
      </div>

      <Suspense fallback={<ListSkeleton />}>
        <ProductList />
      </Suspense>
    </div>
  );
}

async function ProductList() {
  await requireAdmin();
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return (
      <div role="status" className="mt-8 border border-gold/40 bg-white px-6 py-8">
        <p className="font-serif text-2xl text-ink">Connect Supabase to start adding products</p>
        <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-muted">
          <li>Create a free project at supabase.com.</li>
          <li>In its SQL Editor, run the file <code>supabase/schema.sql</code>.</li>
          <li>
            Copy the project URL, anon key and service_role key into <code>.env.local</code>.
          </li>
          <li>Restart <code>pnpm dev</code> and refresh this page.</li>
        </ol>
      </div>
    );
  }

  const products = await adminListProducts();

  const stats = [
    { label: "Total", value: products.length },
    { label: "Live on shop", value: products.filter((p) => p.is_published).length },
    {
      label: "New arrivals",
      value: products.filter((p) => p.is_published && p.is_new_arrival).length,
    },
    { label: `Low stock (≤${LOW_STOCK})`, value: products.filter((p) => p.stock <= LOW_STOCK).length },
  ];

  return (
    <>
      <dl className="mt-8 grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white px-5 py-4">
            <dt className="text-xs uppercase tracking-wider text-muted">{s.label}</dt>
            <dd className="mt-1 font-serif text-2xl text-ink">{s.value}</dd>
          </div>
        ))}
      </dl>

      {products.length === 0 ? (
        <div className="mt-8 border border-dashed border-line bg-white px-6 py-16 text-center">
          <p className="font-serif text-2xl text-ink">No products yet</p>
          <p className="mt-2 text-muted">
            Add your first piece and it will appear in the shop and New Arrivals.
          </p>
          <Link
            href="/admin/products/new"
            className="mt-6 inline-block bg-ink px-5 py-3 text-sm uppercase tracking-wider text-white hover:bg-black"
          >
            Add product
          </Link>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-line border border-line bg-white">
          {products.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center gap-4 px-4 py-4 sm:flex-nowrap sm:px-5"
            >
              <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-blush/30">
                {p.images[0] ? (
                  <Image
                    src={productImageUrl(p.images[0])}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-[10px] uppercase tracking-wider text-muted">
                    No photo
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/products/${p.id}/edit`}
                  className="block truncate font-medium text-ink hover:underline"
                >
                  {p.name}
                </Link>
                <p className="mt-0.5 text-sm text-muted">
                  {p.category} · {formatPrice(p.price)}
                  {p.compare_at_price ? (
                    <span className="ml-1.5 line-through opacity-70">
                      {formatPrice(p.compare_at_price)}
                    </span>
                  ) : null}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] uppercase tracking-wider">
                  <Badge tone={p.is_published ? "green" : "neutral"}>
                    {p.is_published ? "Live" : "Draft"}
                  </Badge>
                  {p.is_new_arrival ? <Badge tone="gold">New arrival</Badge> : null}
                  <Badge tone={p.stock === 0 ? "red" : p.stock <= LOW_STOCK ? "amber" : "neutral"}>
                    {p.stock === 0 ? "Sold out" : `${p.stock} in stock`}
                  </Badge>
                </div>
              </div>

              <RowActions id={p.id} name={p.name} published={p.is_published} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

const toneClass = {
  green: "bg-emerald-50 text-emerald-800",
  gold: "bg-gold/15 text-[#7a6535]",
  red: "bg-red-50 text-red-800",
  amber: "bg-amber-50 text-amber-800",
  neutral: "bg-cream text-muted",
} as const;

function Badge({
  tone,
  children,
}: {
  tone: keyof typeof toneClass;
  children: React.ReactNode;
}) {
  return <span className={`px-2 py-0.5 ${toneClass[tone]}`}>{children}</span>;
}

function ListSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading products">
      <div className="mt-8 h-[82px] animate-pulse border border-line bg-white" />
      <div className="mt-8 divide-y divide-line border border-line bg-white">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="h-20 w-16 animate-pulse bg-line" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 animate-pulse bg-line" />
              <div className="h-3 w-1/4 animate-pulse bg-line" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
