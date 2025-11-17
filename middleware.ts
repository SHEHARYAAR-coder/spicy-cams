import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./lib/auth";
import { UserRole } from "@prisma/client";

// Route configurations
const PROTECTED_ROUTES: Record<string, UserRole[]> = {
  "/dashboard": [],
  "/creator": [UserRole.CREATOR, UserRole.ADMIN],
  "/admin": [UserRole.ADMIN],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the current path requires authentication
  const protectedRoute = Object.keys(PROTECTED_ROUTES).find((route) =>
    pathname.startsWith(route)
  );

  if (!protectedRoute) {
    return NextResponse.next();
  }

  try {
    // Get the session
    const session = await auth();

    // If no session, redirect to login
    if (!session?.user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check role-based access
    const requiredRoles =
      PROTECTED_ROUTES[protectedRoute as keyof typeof PROTECTED_ROUTES];

    const userRole = (session.user as { role?: string })?.role as
      | UserRole
      | undefined;

    if (
      requiredRoles.length > 0 &&
      userRole &&
      !requiredRoles.includes(userRole)
    ) {
      // User doesn't have required role
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    // Check email verification for protected routes
    const emailVerified = (session.user as { emailVerified?: boolean })
      ?.emailVerified;
    if (!emailVerified && pathname !== "/verify-email") {
      return NextResponse.redirect(new URL("/verify-email", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
