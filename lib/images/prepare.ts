// Shrinks photos in the browser before upload. Phone cameras produce 4–12 MB
// images; product photos never need more than ~2000px, so we resize and
// re-encode as JPEG. Small, already-web-friendly files are left untouched.

import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/products/shared";

const MAX_EDGE = 2000;
const KEEP_AS_IS_BYTES = 1.5 * 1024 * 1024;
const JPEG_QUALITY = 0.85;

const TYPE_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  heic: "image/heic",
  heif: "image/heif",
};

/** Some Android pickers give files an empty `type`; fall back to the extension. */
function detectType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return TYPE_BY_EXT[ext] ?? "";
}

export type PreparedImage = { file: File } | { error: string };

export async function prepareImage(file: File): Promise<PreparedImage> {
  const type = detectType(file);
  const allowed = (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type);

  if (allowed && file.size <= KEEP_AS_IS_BYTES) {
    return { file: type === file.type ? file : new File([file], file.name, { type }) };
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return {
      error:
        type === "image/heic" || type === "image/heif"
          ? `"${file.name}" is a HEIC photo this browser can't read. In your camera settings choose "Most compatible" / JPG, or pick it from the gallery as JPG.`
          : `"${file.name}" couldn't be read as an image.`,
    };
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return { error: `Couldn't process "${file.name}".` };
  }
  // White behind any transparent areas, since JPEG has no transparency.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  if (!blob) return { error: `Couldn't process "${file.name}".` };
  if (blob.size > MAX_IMAGE_BYTES) return { error: `"${file.name}" is too large even after resizing.` };

  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return { file: new File([blob], name, { type: "image/jpeg" }) };
}
