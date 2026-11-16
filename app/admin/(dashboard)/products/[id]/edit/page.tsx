import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { adminGetProduct } from "@/lib/products/queries";
import ProductForm from "../../ProductForm";

export const metadata: Metadata = { title: "Edit product" };

export default function EditProductPage({
  params,
}: PageProps<"/admin/products/[id]/edit">) {
  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/products" className="text-sm text-muted hover:text-ink">
        ← All products
      </Link>
      <Suspense
        fallback={
          <div aria-busy="true" className="mt-3">
            <div className="h-10 w-64 animate-pulse bg-line" />
            <div className="mt-8 h-96 animate-pulse border border-line bg-white" />
          </div>
        }
      >
        <EditProduct params={params} />
      </Suspense>
    </div>
  );
}

async function EditProduct({
  params,
}: {
  params: PageProps<"/admin/products/[id]/edit">["params"];
}) {
  const { id } = await params;
  const product = await adminGetProduct(id);
  if (!product) notFound();

  return (
    <>
      <h1 className="mt-3 font-serif text-3xl text-ink sm:text-4xl">
        Edit <em className="text-rose">{product.name}</em>
      </h1>
      <ProductForm key={product.updated_at} product={product} />
    </>
  );
}
