import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const protectedPrefixes = ["/comprador", "/vendedor", "/admin", "/api/protected"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));

  if (!isProtected) return NextResponse.next();

  if (!req.auth) {
    const login = new URL("/login", req.nextUrl.origin);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  const role = req.auth.user?.role;

  if (pathname.startsWith("/comprador") && role !== "comprador" && role !== "admin") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }
  if (pathname.startsWith("/vendedor") && role !== "vendedor" && role !== "admin") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/comprador/:path*", "/vendedor/:path*", "/admin/:path*", "/api/protected/:path*"],
};
