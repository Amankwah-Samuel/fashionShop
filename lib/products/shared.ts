// Product types and helpers that are safe to use on both server and client.

export const PRODUCT_IMAGES_BUCKET = "product-images";

export const CATEGORIES = [
  "Tops",
  "Dresses",
  "Skirts",
  "Pants",
  "Outerwear",
  "Sets",
  "Bags",
  "Accessories",
] as const;

export const SIZES = ["XS", "S", "M", "L", "XL", "Free Size"] as const;

export const MAX_IMAGES = 8;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

/** Change this to your shop's currency code (e.g. "NGN", "GBP", "KRW"). */
export const CURRENCY = "USD";

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  category: string;
  sizes: string[];
  colors: string[];
  stock: number;
  /** Storage paths in the product-images bucket; the first is the cover. */
  images: string[];
  is_new_arrival: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export function productImageUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${path}`;
}

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: CURRENCY,
});

export function formatPrice(value: number): string {
  return priceFormatter.format(value);
}
