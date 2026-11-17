"use client";

import { MinusIcon, PlusIcon } from "./icons";

export default function QuantityStepper({
  value,
  max,
  onChange,
  label = "Quantity",
}: {
  value: number;
  max: number;
  onChange: (next: number) => void;
  label?: string;
}) {
  const btn =
    "flex h-9 w-9 items-center justify-center text-ink transition-colors hover:bg-blush/60 disabled:cursor-not-allowed disabled:text-line disabled:hover:bg-transparent";
  return (
    <div role="group" aria-label={label} className="inline-flex items-center rounded-lg border border-line bg-white">
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
        className={`${btn} rounded-l-lg`}
      >
        <MinusIcon size={16} />
      </button>
      <span aria-live="polite" className="min-w-8 text-center text-sm tabular-nums text-ink">
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className={`${btn} rounded-r-lg`}
      >
        <PlusIcon size={16} />
      </button>
    </div>
  );
}
