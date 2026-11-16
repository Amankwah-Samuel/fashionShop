import type { Metadata } from "next";
import Link from "next/link";
import { SUPABASE_NOT_CONFIGURED, isSupabaseConfigured } from "@/lib/supabase/server";
import ProductForm from "../ProductForm";

export const metadata: Metadata = { title: "Add product" };

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/products" className="text-sm text-muted hover:text-ink">
        ← All products
      </Link>
      <h1 className="mt-3 font-serif text-3xl text-ink sm:text-4xl">Add product</h1>
      {!isSupabaseConfigured() ? (
        <p role="status" className="mt-6 border border-gold/40 bg-white px-5 py-4 text-sm text-muted">
          <strong className="font-medium text-ink">Saving is off for now.</strong>{" "}
          {SUPABASE_NOT_CONFIGURED}
        </p>
      ) : null}
      <ProductForm />
    </div>
  );
}
