"use client";

import Link from "next/link";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import {
  ALLOWED_IMAGE_TYPES,
  CATEGORIES,
  MAX_IMAGE_BYTES,
  MAX_IMAGES,
  PRODUCT_IMAGES_BUCKET,
  SIZES,
  productImageUrl,
  type Product,
} from "@/lib/products/shared";
import {
  createImageUploads,
  saveProduct,
  type ProductFormState,
} from "./actions";

/** An image already in storage (`path`) or picked but not uploaded yet (`file`). */
type ImageItem = {
  key: string;
  previewUrl: string;
  path?: string;
  file?: File;
};

const inputClass =
  "mt-2 w-full border border-line bg-white px-4 py-3 text-ink outline-none transition-colors focus:border-ink aria-[invalid=true]:border-red-600";

export default function ProductForm({ product }: { product?: Product }) {
  const [state, formAction, saving] = useActionState<ProductFormState, FormData>(
    saveProduct,
    {},
  );
  const [uploading, startTransition] = useTransition();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [images, setImages] = useState<ImageItem[]>(() =>
    (product?.images ?? []).map((path) => ({
      key: path,
      path,
      previewUrl: productImageUrl(path),
    })),
  );
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // Free blob: preview URLs when the form goes away.
  const imagesRef = useRef(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);
  useEffect(
    () => () => {
      for (const i of imagesRef.current) {
        if (i.file) URL.revokeObjectURL(i.previewUrl);
      }
    },
    [],
  );

  const busy = uploading || saving;
  const errors = state.fieldErrors ?? {};

  function addFiles(list: FileList | null) {
    if (!list) return;
    setUploadError(null);
    const picked: ImageItem[] = [];
    for (const file of Array.from(list)) {
      if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
        setUploadError(`"${file.name}" isn't a JPG, PNG, WebP or AVIF image.`);
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setUploadError(`"${file.name}" is larger than 5 MB.`);
        continue;
      }
      picked.push({
        key: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }
    setImages((prev) => {
      const room = MAX_IMAGES - prev.length;
      if (picked.length > room) {
        setUploadError(`A product can have up to ${MAX_IMAGES} photos.`);
        for (const extra of picked.slice(room)) URL.revokeObjectURL(extra.previewUrl);
      }
      return [...prev, ...picked.slice(0, Math.max(room, 0))];
    });
    if (fileInput.current) fileInput.current.value = "";
  }

  function removeImage(key: string) {
    setImages((prev) => {
      const item = prev.find((i) => i.key === key);
      if (item?.file) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.key !== key);
    });
  }

  function moveImage(key: string, to: number) {
    setImages((prev) => {
      const from = prev.findIndex((i) => i.key === key);
      if (from < 0 || to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setUploadError(null);

    startTransition(async () => {
      let current = images;
      const pending = current.filter((i) => i.file);

      if (pending.length > 0) {
        const res = await createImageUploads(
          pending.map((i) => ({ type: i.file!.type, size: i.file!.size })),
        );
        if ("error" in res) {
          setUploadError(res.error);
          return;
        }

        const storage = supabaseBrowser().storage.from(PRODUCT_IMAGES_BUCKET);
        const uploaded = new Map<string, string>();
        let failed: string | null = null;
        for (let n = 0; n < pending.length; n++) {
          const { path, token } = res.uploads[n];
          const file = pending[n].file!;
          const { error } = await storage.uploadToSignedUrl(path, token, file, {
            contentType: file.type,
          });
          if (error) {
            failed = `Couldn't upload "${file.name}": ${error.message}`;
            break;
          }
          uploaded.set(pending[n].key, path);
        }

        // Remember what made it to storage so a retry doesn't upload twice.
        current = current.map((i) =>
          uploaded.has(i.key) ? { key: i.key, previewUrl: i.previewUrl, path: uploaded.get(i.key) } : i,
        );
        setImages(current);
        if (failed) {
          setUploadError(failed);
          return;
        }
      }

      for (const i of current) formData.append("images", i.path!);
      startTransition(() => formAction(formData));
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-8">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Details */}
        <section className="space-y-6 border border-line bg-white p-5 sm:p-7">
          <h2 className="font-serif text-xl text-ink">Details</h2>

          <Field label="Name" htmlFor="name" error={errors.name}>
            <input
              id="name"
              name="name"
              required
              maxLength={120}
              defaultValue={product?.name}
              placeholder="e.g. Blush Pleated Skirt"
              aria-invalid={!!errors.name}
              className={inputClass}
            />
          </Field>

          <Field label="Description" htmlFor="description" error={errors.description}>
            <textarea
              id="description"
              name="description"
              rows={5}
              maxLength={2000}
              defaultValue={product?.description}
              placeholder="Fabric, fit, styling notes…"
              aria-invalid={!!errors.description}
              className={inputClass}
            />
          </Field>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Price" htmlFor="price" error={errors.price}>
              <input
                id="price"
                name="price"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                required
                defaultValue={product?.price}
                aria-invalid={!!errors.price}
                className={inputClass}
              />
            </Field>
            <Field
              label="Original price (optional)"
              hint="Shown crossed out when the item is on sale."
              htmlFor="compare_at_price"
              error={errors.compare_at_price}
            >
              <input
                id="compare_at_price"
                name="compare_at_price"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                defaultValue={product?.compare_at_price ?? ""}
                aria-invalid={!!errors.compare_at_price}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Category" htmlFor="category" error={errors.category}>
              <select
                id="category"
                name="category"
                required
                defaultValue={product?.category ?? ""}
                aria-invalid={!!errors.category}
                className={inputClass}
              >
                <option value="" disabled>
                  Choose…
                </option>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Stock" htmlFor="stock" error={errors.stock}>
              <input
                id="stock"
                name="stock"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                required
                defaultValue={product?.stock ?? 0}
                aria-invalid={!!errors.stock}
                className={inputClass}
              />
            </Field>
          </div>

          <fieldset>
            <legend className="text-sm text-muted">Sizes</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <label key={s} className="cursor-pointer">
                  <input
                    type="checkbox"
                    name="sizes"
                    value={s}
                    defaultChecked={product?.sizes.includes(s)}
                    className="peer sr-only"
                  />
                  <span className="block border border-line px-4 py-2 text-sm text-muted transition-colors peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink">
                    {s}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <Field
            label="Colours"
            hint="Separate with commas, e.g. Ivory, Blush, Black"
            htmlFor="colors"
            error={errors.colors}
          >
            <input
              id="colors"
              name="colors"
              defaultValue={product?.colors.join(", ")}
              aria-invalid={!!errors.colors}
              className={inputClass}
            />
          </Field>
        </section>

        {/* Photos + visibility */}
        <div className="space-y-8">
          <section className="border border-line bg-white p-5 sm:p-7">
            <div className="flex items-baseline justify-between">
              <h2 className="font-serif text-xl text-ink">Photos</h2>
              <span className="text-xs text-muted">
                {images.length}/{MAX_IMAGES}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">The first photo is the cover.</p>

            {images.length > 0 ? (
              <ul className="mt-4 grid grid-cols-3 gap-2">
                {images.map((img, i) => (
                  <li key={img.key} className="group relative aspect-[3/4] overflow-hidden bg-cream">
                    {/* eslint-disable-next-line @next/next/no-img-element -- local blob: previews */}
                    <img src={img.previewUrl} alt="" className="h-full w-full object-cover" />
                    {i === 0 ? (
                      <span className="absolute left-1 top-1 bg-ink px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-white">
                        Cover
                      </span>
                    ) : null}
                    <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/55 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => moveImage(img.key, i - 1)}
                        disabled={i === 0 || busy}
                        aria-label={`Move photo ${i + 1} earlier`}
                        className="px-2 py-1 text-white disabled:opacity-30"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(img.key)}
                        disabled={busy}
                        aria-label={`Remove photo ${i + 1}`}
                        className="px-2 py-1 text-white"
                      >
                        ✕
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(img.key, i + 1)}
                        disabled={i === images.length - 1 || busy}
                        aria-label={`Move photo ${i + 1} later`}
                        className="px-2 py-1 text-white disabled:opacity-30"
                      >
                        →
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}

            {images.length < MAX_IMAGES ? (
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  addFiles(e.dataTransfer.files);
                }}
                className={`mt-4 flex cursor-pointer flex-col items-center justify-center border border-dashed px-4 py-8 text-center transition-colors ${
                  dragging ? "border-ink bg-cream" : "border-line hover:border-muted"
                }`}
              >
                <span className="text-sm text-ink">Click or drop photos here</span>
                <span className="mt-1 text-xs text-muted">JPG, PNG, WebP or AVIF · up to 5 MB each</span>
                <input
                  ref={fileInput}
                  type="file"
                  multiple
                  accept={ALLOWED_IMAGE_TYPES.join(",")}
                  onChange={(e) => addFiles(e.target.files)}
                  className="sr-only"
                />
              </label>
            ) : null}

            {uploadError || errors.images ? (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {uploadError ?? errors.images}
              </p>
            ) : null}
          </section>

          <section className="space-y-4 border border-line bg-white p-5 sm:p-7">
            <h2 className="font-serif text-xl text-ink">Visibility</h2>
            <Toggle
              name="is_published"
              label="Live on the shop"
              hint="Turn off to keep it as a draft."
              defaultChecked={product?.is_published ?? true}
            />
            <Toggle
              name="is_new_arrival"
              label="Show in New Arrivals"
              defaultChecked={product?.is_new_arrival ?? true}
            />
          </section>
        </div>
      </div>

      <div className="sticky bottom-0 mt-8 flex flex-wrap items-center justify-end gap-4 border-t border-line bg-cream/95 py-4 backdrop-blur">
        {state.error ? (
          <p role="alert" className="mr-auto text-sm text-red-700">
            {state.error}
          </p>
        ) : null}
        <Link href="/admin/products" className="px-4 py-3 text-sm text-muted hover:text-ink">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={busy}
          className="bg-ink px-7 py-3 text-sm uppercase tracking-wider text-white transition-colors hover:bg-black disabled:opacity-60"
        >
          {uploading && !saving
            ? "Uploading photos…"
            : saving
              ? "Saving…"
              : product
                ? "Save changes"
                : "Add product"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  htmlFor,
  error,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm text-muted">
        {label}
      </label>
      {children}
      {hint && !error ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
      {error ? <p className="mt-1.5 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

function Toggle({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-sm text-ink">{label}</span>
        {hint ? <span className="block text-xs text-muted">{hint}</span> : null}
      </span>
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-line transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-ink peer-checked:after:translate-x-5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink"
      />
    </label>
  );
}
