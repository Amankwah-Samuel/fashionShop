"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";
import { PRODUCTS_TAG } from "@/lib/products/queries";
import {
  ALLOWED_IMAGE_TYPES,
  CATEGORIES,
  MAX_IMAGE_BYTES,
  MAX_IMAGES,
  PRODUCT_IMAGES_BUCKET,
  SIZES,
} from "@/lib/products/shared";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IMAGE_PATH_RE =
  /^products\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|avif)$/;

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

// ---------------------------------------------------------------------------
// Image uploads
// ---------------------------------------------------------------------------

export type UploadTicket = { path: string; token: string };

/**
 * Issues short-lived signed upload URLs so the browser can send images
 * straight to Supabase Storage (avoids the Server Action body size limit).
 */
export async function createImageUploads(
  files: { type: string; size: number }[],
): Promise<{ uploads: UploadTicket[] } | { error: string }> {
  await requireAdmin();

  if (!Array.isArray(files) || files.length === 0) return { uploads: [] };
  if (files.length > MAX_IMAGES) {
    return { error: `You can upload up to ${MAX_IMAGES} images per product.` };
  }
  for (const f of files) {
    if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(f.type)) {
      return { error: "Images must be JPG, PNG, WebP or AVIF." };
    }
    if (typeof f.size !== "number" || f.size > MAX_IMAGE_BYTES) {
      return { error: "Each image must be 5 MB or smaller." };
    }
  }

  const storage = supabaseAdmin().storage.from(PRODUCT_IMAGES_BUCKET);
  const uploads: UploadTicket[] = [];
  for (const f of files) {
    const path = `products/${crypto.randomUUID()}.${EXT_BY_TYPE[f.type]}`;
    const { data, error } = await storage.createSignedUploadUrl(path);
    if (error) return { error: `Could not prepare upload: ${error.message}` };
    uploads.push({ path, token: data.token });
  }
  return { uploads };
}

// ---------------------------------------------------------------------------
// Create / update
// ---------------------------------------------------------------------------

type Field =
  | "name"
  | "price"
  | "compare_at_price"
  | "category"
  | "stock"
  | "description"
  | "colors"
  | "images";

export type ProductFormState = {
  error?: string;
  fieldErrors?: Partial<Record<Field, string>>;
};

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const suffix = crypto.randomUUID().slice(0, 6);
  return `${base || "item"}-${suffix}`;
}

function parseProduct(formData: FormData) {
  const fieldErrors: Partial<Record<Field, string>> = {};
  const str = (k: string) => String(formData.get(k) ?? "").trim();

  const name = str("name");
  if (!name) fieldErrors.name = "Name is required.";
  else if (name.length > 120) fieldErrors.name = "Keep the name under 120 characters.";

  const description = str("description");
  if (description.length > 2000) {
    fieldErrors.description = "Keep the description under 2000 characters.";
  }

  const price = Number(str("price"));
  if (str("price") === "" || !Number.isFinite(price) || price < 0) {
    fieldErrors.price = "Enter a valid price.";
  }

  const compareRaw = str("compare_at_price");
  const compareAt = compareRaw === "" ? null : Number(compareRaw);
  if (compareAt !== null && (!Number.isFinite(compareAt) || compareAt <= price)) {
    fieldErrors.compare_at_price =
      "Original price must be higher than the selling price (or leave it empty).";
  }

  const category = str("category");
  if (!(CATEGORIES as readonly string[]).includes(category)) {
    fieldErrors.category = "Choose a category.";
  }

  const stock = Number(str("stock"));
  if (!Number.isInteger(stock) || stock < 0) {
    fieldErrors.stock = "Stock must be a whole number, 0 or more.";
  }

  const sizes = formData
    .getAll("sizes")
    .map(String)
    .filter((s) => (SIZES as readonly string[]).includes(s));

  const colors = [
    ...new Set(
      str("colors")
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
    ),
  ];
  if (colors.length > 12 || colors.some((c) => c.length > 30)) {
    fieldErrors.colors = "Use up to 12 short colour names, separated by commas.";
  }

  const images = formData.getAll("images").map(String);
  const isPublished = formData.get("is_published") === "on";
  if (images.length > MAX_IMAGES || images.some((p) => !IMAGE_PATH_RE.test(p))) {
    fieldErrors.images = "Something went wrong with the images. Please re-add them.";
  } else if (isPublished && images.length === 0) {
    fieldErrors.images = "Add at least one photo before publishing.";
  }

  return {
    fieldErrors,
    values: {
      name,
      description,
      price,
      compare_at_price: compareAt,
      category,
      sizes,
      colors,
      stock,
      images,
      is_new_arrival: formData.get("is_new_arrival") === "on",
      is_published: isPublished,
    },
  };
}

export async function saveProduct(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (id && !UUID_RE.test(id)) return { error: "Invalid product id." };

  const { fieldErrors, values } = parseProduct(formData);
  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }

  const db = supabaseAdmin();

  if (id) {
    const { data: existing, error: readError } = await db
      .from("products")
      .select("images")
      .eq("id", id)
      .maybeSingle();
    if (readError) return { error: readError.message };
    if (!existing) return { error: "This product no longer exists." };

    const { error } = await db.from("products").update(values).eq("id", id);
    if (error) return { error: `Could not save: ${error.message}` };

    // Delete photos that were removed in this edit.
    const removed = (existing.images as string[]).filter(
      (p) => !values.images.includes(p),
    );
    if (removed.length > 0) {
      await db.storage.from(PRODUCT_IMAGES_BUCKET).remove(removed);
    }
  } else {
    const { error } = await db
      .from("products")
      .insert({ ...values, slug: slugify(values.name) });
    if (error) return { error: `Could not save: ${error.message}` };
  }

  updateTag(PRODUCTS_TAG);
  redirect("/admin/products");
}

// ---------------------------------------------------------------------------
// Delete / publish toggle
// ---------------------------------------------------------------------------

export async function deleteProduct(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  if (!UUID_RE.test(id)) return { error: "Invalid product id." };

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("products")
    .delete()
    .eq("id", id)
    .select("images")
    .maybeSingle();
  if (error) return { error: `Could not delete: ${error.message}` };

  const images = (data?.images as string[] | undefined) ?? [];
  if (images.length > 0) {
    await db.storage.from(PRODUCT_IMAGES_BUCKET).remove(images);
  }

  updateTag(PRODUCTS_TAG);
  refresh();
  return {};
}

export async function setPublished(
  id: string,
  published: boolean,
): Promise<{ error?: string }> {
  await requireAdmin();
  if (!UUID_RE.test(id)) return { error: "Invalid product id." };

  const db = supabaseAdmin();
  if (published) {
    const { data } = await db
      .from("products")
      .select("images")
      .eq("id", id)
      .maybeSingle();
    if (!data || (data.images as string[]).length === 0) {
      return { error: "Add at least one photo before publishing." };
    }
  }

  const { error } = await db
    .from("products")
    .update({ is_published: published })
    .eq("id", id);
  if (error) return { error: error.message };

  updateTag(PRODUCTS_TAG);
  refresh();
  return {};
}
