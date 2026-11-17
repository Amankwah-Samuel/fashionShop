"use client";

import ErrorScreen from "../components/ErrorScreen";

export default function StoreError({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorScreen error={error} retry={retry} homeHref="/" homeLabel="Back to home" />;
}
