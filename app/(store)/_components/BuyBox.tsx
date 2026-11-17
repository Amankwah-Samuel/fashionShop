"use client";

import Link from "next/link";
import { useState } from "react";
import { addToCart } from "@/lib/cart/store";
import { openWhatsAppOrder } from "@/lib/whatsapp";
import { ArrowIcon, BagIcon, ChatIcon, CheckIcon } from "./icons";
import QuantityStepper from "./QuantityStepper";

export type BuyBoxProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  stock: number;
  sizes: string[];
  colors: string[];
  image: string | null;
};

/** Size/colour picker with "Add to cart" and "Order on WhatsApp" for the product page. */
export default function BuyBox({ product }: { product: BuyBoxProduct }) {
  const soldOut = product.stock <= 0;
  const [size, setSize] = useState<string | null>(product.sizes.length === 1 ? product.sizes[0] : null);
  const [color, setColor] = useState<string | null>(product.colors.length === 1 ? product.colors[0] : null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  function validate(): boolean {
    if (product.sizes.length > 0 && !size) {
      setError("Please choose a size.");
      return false;
    }
    if (product.colors.length > 0 && !color) {
      setError("Please choose a colour.");
      return false;
    }
    setError(null);
    return true;
  }

  function handleAdd() {
    if (!validate()) return;
    addToCart(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.image,
        price: product.price,
        stock: product.stock,
        size,
        color,
      },
      qty,
    );
    setAdded(true);
  }

  function handleOrder() {
    if (!validate()) return;
    openWhatsAppOrder([{ name: product.name, slug: product.slug, size, color, qty, price: product.price }]);
  }

  return (
    <div className="mt-8">
      {product.sizes.length > 0 ? (
        <OptionGroup
          label="Size"
          options={product.sizes}
          value={size}
          onChange={(v) => {
            setSize(v);
            setError(null);
            setAdded(false);
          }}
          disabled={soldOut}
        />
      ) : null}

      {product.colors.length > 0 ? (
        <div className={product.sizes.length > 0 ? "mt-6" : ""}>
          <OptionGroup
            label="Colour"
            options={product.colors}
            value={color}
            onChange={(v) => {
              setColor(v);
              setError(null);
              setAdded(false);
            }}
            disabled={soldOut}
          />
        </div>
      ) : null}

      {!soldOut ? (
        <div className="mt-6 flex items-center gap-4">
          <span className="text-sm text-muted">Quantity</span>
          <QuantityStepper value={qty} max={product.stock} onChange={(n) => { setQty(n); setAdded(false); }} />
        </div>
      ) : null}

      <p role="alert" className="mt-4 min-h-5 text-sm text-accent">
        {error}
      </p>

      <div className="mt-2 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleAdd}
          disabled={soldOut}
          className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-ink px-8 py-4 text-sm uppercase tracking-wider text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          <BagIcon />
          {soldOut ? "Sold out" : "Add to cart"}
        </button>
        <button
          type="button"
          onClick={handleOrder}
          disabled={soldOut}
          className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-ink/80 bg-white px-8 py-4 text-sm uppercase tracking-wider text-ink transition-colors hover:bg-blush/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChatIcon className="text-whatsapp" />
          Order on WhatsApp
        </button>
      </div>

      <div aria-live="polite">
        {added ? (
          <div className="mt-4 flex items-center justify-between gap-4 rounded-lg bg-blush/50 px-4 py-3 text-sm">
            <span className="flex items-center gap-2 text-ink">
              <CheckIcon size={16} className="text-whatsapp" />
              Added to your cart
            </span>
            <Link href="/cart" className="flex items-center gap-1.5 font-medium text-ink underline-offset-4 hover:underline">
              View cart <ArrowIcon size={14} />
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function OptionGroup({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: string[];
  value: string | null;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset disabled={disabled}>
      <legend className="text-sm text-muted">
        {label}
        {value ? <span className="ml-2 text-ink">{value}</span> : null}
      </legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => {
          const active = value === o;
          return (
            <button
              key={o}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o)}
              className={`min-w-12 rounded-lg border px-4 py-2 text-center text-sm transition-colors disabled:opacity-50 ${
                active ? "border-ink bg-ink text-white" : "border-line text-ink hover:border-rose"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
