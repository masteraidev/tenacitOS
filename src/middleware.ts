import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that never require authentication
const PUBLIC_ROUTES = new Set(["/login"]);

// API routes that are always public (auth endpoints + health check)
const PUBLIC_API_PREFIXES = ["/api/auth/", "/api/health"];

function isAuthenticated(request: NextRequest): boolean {
  const authCookie = request.cookies.get("mc_auth");
  const expectedValue = "simple-auth-secret-123";
  const isAuthenticated = !!(authCookie && authCookie.value === expectedValue);
  console.log("Auth check:", {
    hasCookie: !!authCookie,
    cookieValue: authCookie?.value,
    expectedValue,
    isAuthenticated,
  });
  return isAuthenticated;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Log the request path for debugging
  if (!pathname.startsWith("/_next") && !pathname.includes(".")) {
    console.log(`[Middleware] Path: ${pathname}`);
  }
  
  // Always allow public pages (login)
  if (PUBLIC_ROUTES.has(pathname)) {
    return NextResponse.next();
  }

  // Always allow public API routes (auth + health)
  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Check authentication
  if (!isAuthenticated(request)) {
    // For API routes: return 401 JSON (not a redirect)
    if (pathname.startsWith("/api/")) {
      console.log(`[Middleware] API route ${pathname} - not authenticated, returning 401`);
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    // For page routes: redirect to login
    console.log(`[Middleware] Page route ${pathname} - not authenticated, redirecting to login`);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  console.log(`[Middleware] ${pathname} - authenticated, allowing`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files and images
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"
  ],
};
