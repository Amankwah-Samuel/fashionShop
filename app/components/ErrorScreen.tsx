"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Friendly fallback when a page fails to load (usually a dropped connection). */
export default function ErrorScreen({
  error,
  retry,
  homeHref,
  homeLabel,
}: {
  error: unknown;
  retry: () => void;
  homeHref: string;
  homeLabel: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const message = error instanceof Error ? error.message : "";
  const network = /fetch failed|network|timeout|ECONN|ENOTFOUND/i.test(message);

  return (
    <main className="flex flex-1 items-center justify-center px-5 py-24">
      <div className="max-w-md text-center">
        <p className="font-serif text-3xl text-ink">
          {network ? "Connection hiccup" : "Something went wrong"}
        </p>
        <p className="mt-3 leading-relaxed text-muted">
          {network
            ? "We couldn't reach the shop's database just now. Check your internet connection and try again."
            : "This page didn't load properly. Please try again."}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => retry()}
            className="rounded-lg bg-ink px-8 py-3.5 text-sm uppercase tracking-wider text-white transition-colors hover:bg-black"
          >
            Try again
          </button>
          <Link href={homeHref} className="px-4 py-3 text-sm text-muted hover:text-ink">
            {homeLabel}
          </Link>
        </div>
      </div>
    </main>
  );
}
