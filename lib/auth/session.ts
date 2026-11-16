// Signed admin session tokens. Uses Web Crypto so it works in both Proxy and
// Server Components / Server Actions.
//
// Token format: "<expiresAtMs>.<base64url HMAC-SHA256 of 'admin.<expiresAtMs>'>"
// Rotating SESSION_SECRET signs every admin out.

export const SESSION_COOKIE = "admin_session";
export const SESSION_COOKIE_PATH = "/admin";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

const encoder = new TextEncoder();

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET must be set to a random string of at least 32 characters.",
    );
  }
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toBase64Url(bytes: ArrayBuffer): string {
  let binary = "";
  for (const b of new Uint8Array(bytes)) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> | null {
  try {
    const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

export async function createSessionToken(): Promise<{
  token: string;
  expires: Date;
}> {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const sig = await crypto.subtle.sign(
    "HMAC",
    await getKey(),
    encoder.encode(`admin.${expiresAt}`),
  );
  return { token: `${expiresAt}.${toBase64Url(sig)}`, expires: new Date(expiresAt) };
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;
  const [expiresRaw, sigRaw] = token.split(".");
  const expiresAt = Number(expiresRaw);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now() || !sigRaw) {
    return false;
  }
  const sig = fromBase64Url(sigRaw);
  if (!sig) return false;
  return crypto.subtle.verify(
    "HMAC",
    await getKey(),
    sig,
    encoder.encode(`admin.${expiresAt}`),
  );
}
