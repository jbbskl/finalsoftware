import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const AUTH_DISABLED = process.env.AUTH_DISABLED === "true";

export async function middleware(req: NextRequest) {
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

  // Check authentication for protected routes
  const session = await auth();
  
  // If not authenticated, redirect to login
  if (!session?.user && (pathname.startsWith("/creator") || pathname.startsWith("/agency") || pathname.startsWith("/admin"))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  
  // If authenticated, check role-based access
  if (session?.user) {
    const userRole = (session.user as any).role || "creator";
    
    // Redirect to appropriate dashboard if accessing root
    if (pathname === "/") {
      const dashboardPath = userRole === "creator" ? "/creator" : 
                           userRole === "agency" ? "/agency" : 
                           userRole === "admin" ? "/admin" : "/creator";
      return NextResponse.redirect(new URL(dashboardPath, req.url));
    }
    
    // Check role-based route access
    if (pathname.startsWith("/creator") && userRole !== "creator") {
      const allowedPath = userRole === "agency" ? "/agency" : "/admin";
      return NextResponse.redirect(new URL(allowedPath, req.url));
    }
    if (pathname.startsWith("/agency") && userRole !== "agency") {
      const allowedPath = userRole === "creator" ? "/creator" : "/admin";
      return NextResponse.redirect(new URL(allowedPath, req.url));
    }
    if (pathname.startsWith("/admin") && userRole !== "admin") {
      const allowedPath = userRole === "creator" ? "/creator" : "/agency";
      return NextResponse.redirect(new URL(allowedPath, req.url));
    }
  }

  return res;
}

export const config = { 
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] 
};