// Next.js middleware — runs on every request matched by config.matcher.
// Enforces two redirect rules: unauthenticated users are sent to /login;
// authenticated users who visit /login or /signup are sent to /dashboard.
import { auth } from "@/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/login", "/signup"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = publicRoutes.some((r) => pathname.startsWith(r));

  if (!req.auth && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (req.auth && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
});

export const config = {
  // api/auth is excluded so NextAuth's own callback routes aren't intercepted.
  // Static assets and favicon are excluded to avoid unnecessary auth overhead.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
