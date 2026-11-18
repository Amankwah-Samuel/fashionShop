// Builds wa.me links that open WhatsApp with the order already typed out.

import { formatPrice } from "@/lib/products/shared";

/** Shop's WhatsApp number in international format, digits only (e.g. 2348012345678). */
export const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");

export type OrderItem = {
  name: string;
  slug: string;
  size: string | null;
  color: string | null;
  qty: number;
  price: number;
};

export function whatsappOrderUrl(items: OrderItem[], origin: string): string {
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  const lines = items.map((i, n) => {
    const options = [i.size && `Size: ${i.size}`, i.color && `Colour: ${i.color}`]
      .filter(Boolean)
      .join(" · ");
    return [
      `${n + 1}. *${i.name}*`,
      options ? `   ${options}` : null,
      `   Qty: ${i.qty} × ${formatPrice(i.price)} = ${formatPrice(i.price * i.qty)}`,
      `   ${origin}/products/${i.slug}`,
    ]
      .filter(Boolean)
      .join("\n");
  });

  const text = [
    "Hello Girl's Hood! I'd like to place an order:",
    "",
    lines.join("\n\n"),
    "",
    `*Total: ${formatPrice(total)}*`,
    "",
    "Please confirm availability, delivery and payment. Thank you!",
  ].join("\n");

  if (!WHATSAPP_NUMBER && process.env.NODE_ENV !== "production") {
    console.warn("NEXT_PUBLIC_WHATSAPP_NUMBER is not set; WhatsApp will ask the shopper to pick a contact.");
  }
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function openWhatsAppOrder(items: OrderItem[]) {
  window.open(whatsappOrderUrl(items, window.location.origin), "_blank", "noopener,noreferrer");
}
