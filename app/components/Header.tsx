"use client";

import Link from "next/link";
import { useState } from "react";
import { useCartCount } from "@/lib/cart/store";

const navLinks = [
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "Shop", href: "/shop" },
  { label: "Cart", href: "/cart" },
  { label: "Our Story", href: "/#our-story" },
];

function IconButton({
  label,
  children,
  badge,
}: {
  label: string;
  children: React.ReactNode;
  badge?: number;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="relative flex h-10 w-10 items-center justify-center text-ink transition-colors hover:text-rose"
    >
      {children}
      {badge ? (
        <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-medium text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export default function Header() {
  const [open, setOpen] = useState(false);
  const cartCount = useCartCount();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="font-serif text-2xl tracking-wide text-ink">
          Girl&apos;s Hood
        </Link>

        <nav className="hidden md:block" aria-label="Main">
          <ul className="flex items-center gap-8 text-[15px] text-muted">
            {navLinks.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="transition-colors hover:text-ink">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1 sm:gap-3">
          <IconButton label="Search">
            <svg {...iconProps}>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </IconButton>
          <IconButton label="Wishlist">
            <svg {...iconProps}>
              <path d="M19.5 12.6 12 20l-7.5-7.4A4.9 4.9 0 0 1 12 6.3a4.9 4.9 0 0 1 7.5 6.3Z" />
            </svg>
          </IconButton>
          <Link
            href="/cart"
            aria-label={cartCount ? `Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}` : "Cart"}
            className="relative flex h-10 w-10 items-center justify-center text-ink transition-colors hover:text-rose"
          >
            <svg {...iconProps}>
              <path d="M5 7h14l-1.2 12.1a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9L5 7Z" />
              <path d="M9 10V6a3 3 0 0 1 6 0v4" />
            </svg>
            {cartCount ? (
              <span className="absolute right-0 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center md:hidden"
          >
            <svg {...iconProps}>
              {open ? (
                <path d="M6 6l12 12M18 6 6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-line md:hidden" aria-label="Mobile">
          <ul className="flex flex-col px-5 py-4 text-muted">
            {navLinks.map((l) => (
              <li key={l.label}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 transition-colors hover:text-ink"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
