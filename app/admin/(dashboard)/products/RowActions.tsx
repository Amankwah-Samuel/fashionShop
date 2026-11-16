"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteProduct, setPublished } from "./actions";

export default function RowActions({
  id,
  name,
  published,
}: {
  id: string;
  name: string;
  published: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex w-full flex-col items-end gap-1 sm:w-auto">
      <div className="flex items-center gap-1 text-sm">
        <Link
          href={`/admin/products/${id}/edit`}
          className="px-3 py-2 text-ink transition-colors hover:bg-cream"
        >
          Edit
        </Link>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setPublished(id, !published))}
          className="px-3 py-2 text-muted transition-colors hover:bg-cream hover:text-ink disabled:opacity-50"
        >
          {published ? "Unpublish" : "Publish"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (window.confirm(`Delete "${name}"? This also deletes its photos and can't be undone.`)) {
              run(() => deleteProduct(id));
            }
          }}
          className="px-3 py-2 text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
