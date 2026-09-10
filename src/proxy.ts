import { auth } from "@/auth";
import { NextResponse } from "next/server";

function requestOrigin(req: { headers: Headers; nextUrl: URL }) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host) return req.nextUrl.origin;
  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
  return `${proto}://${host}`;
}

const publicPaths = new Set(["/login", "/login/recuperar"]);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const pathname = req.nextUrl.pathname;
  const origin = requestOrigin(req);
  const isPublic = publicPaths.has(pathname);

  if (!isLoggedIn && !isPublic) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && pathname === "/login") {
    const mustChange = Boolean(req.auth?.user?.mustChangePassword);
    return NextResponse.redirect(new URL(mustChange ? "/conta/senha" : "/", origin));
  }

  if (isLoggedIn && Boolean(req.auth?.user?.mustChangePassword)) {
    const allowed = pathname === "/conta/senha" || pathname.startsWith("/api/auth");
    if (!allowed) {
      return NextResponse.redirect(new URL("/conta/senha", origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
