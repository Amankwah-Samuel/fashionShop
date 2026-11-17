import Link from "next/link";
import { logout } from "../auth-actions";
import { Suspense } from "react";
import AdminNav, { AdminNavStatic } from "./AdminNav";

export default function DashboardLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="border-b border-line bg-white md:sticky md:top-0 md:flex md:h-svh md:w-60 md:shrink-0 md:flex-col md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-5 py-4 md:block md:px-6 md:py-7">
          <Link href="/admin/products" className="block">
            <span className="font-serif text-xl text-ink">Girl&apos;s Hood</span>
            <span className="mt-0.5 block text-[10px] uppercase tracking-[0.3em] text-accent">
              Admin
            </span>
          </Link>
          {/* Phones: the sidebar footer is hidden, so its links live up here. */}
          <div className="flex items-center gap-1 md:hidden">
            <Link
              href="/"
              className="rounded-lg border border-line px-3 py-2 text-sm text-ink transition-colors hover:border-ink"
            >
              View shop ↗
            </Link>
            <form action={logout}>
              <button type="submit" className="px-3 py-2 text-sm text-muted hover:text-ink">
                Sign out
              </button>
            </form>
          </div>
        </div>

        <Suspense fallback={<AdminNavStatic />}>
          <AdminNav />
        </Suspense>

        <div className="mt-auto hidden space-y-1 border-t border-line px-3 py-4 md:block">
          <Link
            href="/"
            className="block px-3 py-2 text-sm text-muted transition-colors hover:text-ink"
          >
            View shop ↗
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="block w-full px-3 py-2 text-left text-sm text-muted transition-colors hover:text-ink"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-12">{children}</main>
    </div>
  );
}
