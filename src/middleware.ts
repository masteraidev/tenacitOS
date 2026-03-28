import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that never require authentication
const PUBLIC_ROUTES = new Set(["/login"]);

// API routes that are always public (auth endpoints + health check)
const PUBLIC_API_PREFIXES = ["/api/auth/", "/api/health"];

function isAuthenticated(request: NextRequest): boolean {
  const authCookie = request.cookies.get("mc_auth");
  // Hardcode the expected value for now to debug
  const expectedValue = "simple-auth-secret-123";
  const isAuthenticated = !!(authCookie && authCookie.value === expectedValue);
  console.log("Auth check:", {
    hasCookie: !!authCookie,
    cookieValue: authCookie?.value,
    expectedValue,
    isAuthenticated
  });
  return isAuthenticated;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log("Middleware called for:", pathname);

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
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (with extension)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
