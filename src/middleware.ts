import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that never require authentication
const PUBLIC_ROUTES = new Set(["/login"]);

// API routes that are always public (auth endpoints + health check)
const PUBLIC_API_PREFIXES = ["/api/auth/", "/api/health"];

function isAuthenticated(request: NextRequest): boolean {
  const authCookie = request.cookies.get("mc_auth");
  const expectedValue = process.env.AUTH_SECRET;
  const isAuthenticated = !!(authCookie && authCookie.value === expectedValue);
  console.log("Auth check:", {
    hasCookie: !!authCookie,
    cookieValue: authCookie?.value,
    expectedValue,
    isAuthenticated,
    envLength: process.env.AUTH_SECRET?.length
  });
  return isAuthenticated;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieHeader = request.headers.get("cookie");
  
  console.log("=== MIDDLEWARE DEBUG ===");
  console.log("Path:", pathname);
  console.log("Cookie header:", cookieHeader);
  
  // Always allow public pages (login)
  if (PUBLIC_ROUTES.has(pathname)) {
    console.log("Public route, allowing");
    return NextResponse.next();
  }

  // Always allow public API routes (auth + health)
  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    console.log("Public API route, allowing");
    return NextResponse.next();
  }

  // Check authentication
  const authCookie = request.cookies.get("mc_auth");
  console.log("Auth cookie:", authCookie);
  console.log("AUTH_SECRET env:", process.env.AUTH_SECRET);
  
  if (!isAuthenticated(request)) {
    console.log("Not authenticated, redirecting");
    // For API routes: return 401 JSON (not a redirect)
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    // For page routes: redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  console.log("Authenticated, allowing");
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths
     */
    "/(.*)"
  ],
};
