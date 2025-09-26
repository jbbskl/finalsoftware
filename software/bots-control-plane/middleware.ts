import { NextRequest, NextResponse } from "next/server";

const AUTH_DISABLED = process.env.AUTH_DISABLED === "true";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();

  // Let server components see the real URL (for ?as=creator etc.)
  res.headers.set("x-url", req.url);

  // Bypass auth entirely in dev mode
  if (AUTH_DISABLED) return res;

  // Allow all NextJS internal routes and API routes
  if (pathname.startsWith("/_next") || 
      pathname.startsWith("/favicon") || 
      pathname.startsWith("/api") ||
      pathname === "/login" ||
      pathname === "/signup") {
    return res;
  }

  // For all other routes, let NextAuth and page components handle authentication
  // Don't do any redirects in middleware to avoid conflicts
  return res;
}

export const config = { 
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] 
};