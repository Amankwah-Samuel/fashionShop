"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/products", label: "Products" },
  { href: "/admin/products/new", label: "Add product" },
];

/** Reads the URL, so render it inside <Suspense> with <AdminNavStatic /> as fallback. */
export default function AdminNav() {
  return <NavList pathname={usePathname()} />;
}

export function AdminNavStatic() {
  return <NavList pathname={null} />;
}

function NavList({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Admin" className="px-3 pb-3 md:pb-0">
      <ul className="flex gap-1 md:flex-col">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`block px-3 py-2 text-sm transition-colors ${
                  active ? "bg-cream font-medium text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
