"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_PATH,
  createSessionToken,
} from "@/lib/auth/session";

export type LoginState = { error?: string };

function passwordsMatch(given: string, expected: string): boolean {
  // Hash both so the comparison is constant-time regardless of length.
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return { error: "ADMIN_PASSWORD is not set on the server. See .env.example." };
  }

  const password = String(formData.get("password") ?? "");
  if (!passwordsMatch(password, expected)) {
    // Small delay to slow down password guessing.
    await new Promise((r) => setTimeout(r, 600));
    return { error: "That password isn't right. Try again." };
  }

  const { token, expires } = await createSessionToken();
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: SESSION_COOKIE_PATH,
    expires,
  });

  redirect("/admin/products");
}

export async function logout(): Promise<void> {
  (await cookies()).delete({ name: SESSION_COOKIE, path: SESSION_COOKIE_PATH });
  redirect("/admin/login");
}
