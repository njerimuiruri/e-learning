import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // List of public routes that don't require authentication
  const publicRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/courses",
    "/",
  ];

  // Check if route is public
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For protected routes, token validation would happen client-side
  // since we're using localStorage (client-side only)
  // Middleware here can add additional security headers or logging

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/instructor/:path*",
    "/student/:path*",
    "/auth/:path*",
    "/courses/:path*",
  ],
};
