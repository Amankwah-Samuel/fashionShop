import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

// Early redirect for the admin area. Every admin page and action still checks
// the session itself (lib/auth/dal.ts); this just avoids rendering the
// dashboard for signed-out visitors.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const signedIn = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
  );

  if (pathname === "/admin/login") {
    return signedIn
      ? NextResponse.redirect(new URL("/admin/products", request.url))
      : NextResponse.next();
  }

  if (!signedIn) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
