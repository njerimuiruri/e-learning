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

  // Get user cookie
  const userCookie = request.cookies.get("user");

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For protected routes, check if user has valid cookie
  if (!userCookie && !isPublicRoute) {
    // Redirect to login if no user cookie and trying to access protected route
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/instructor/:path*",
    "/student/:path*",
    "/login",
    "/register",
    "/courses/:path*",
  ],
};
