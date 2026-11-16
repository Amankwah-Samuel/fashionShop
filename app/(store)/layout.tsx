import Link from "next/link";
import Header from "../components/Header";

// Shared frame for every customer-facing page: header on top, footer below.
export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      {children}
      <footer className="mt-24 border-t border-line bg-blush/40">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-12 sm:flex-row sm:items-end sm:justify-between sm:px-8">
          <div>
            <p className="font-serif text-2xl text-ink">Girl&apos;s Hood</p>
            <p className="mt-2 max-w-xs text-sm text-muted">
              Curated Korean-style fashion for the modern woman.
            </p>
          </div>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted">
              <li><Link href="/new-arrivals" className="hover:text-ink">New Arrivals</Link></li>
              <li><Link href="/shop" className="hover:text-ink">Shop</Link></li>
              <li><Link href="/cart" className="hover:text-ink">Cart</Link></li>
            </ul>
          </nav>
        </div>
      </footer>
    </>
  );
}
