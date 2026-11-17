import type { Metadata } from "next";
import CartView from "./CartView";

export const metadata: Metadata = {
  title: "My Cart · Girl's Hood",
  description: "Review your pieces and order on WhatsApp.",
};

export default function CartPage() {
  return (
    <main className="flex-1">
      <CartView />
    </main>
  );
}
