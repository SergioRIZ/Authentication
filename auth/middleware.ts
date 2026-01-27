import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Rutas que requieren autenticación
const protectedRoutes = ["/dashboard", "/profile", "/settings"];

// Rutas solo para usuarios NO autenticados
const authRoutes = ["/login", "/register"];

// Validate callbackUrl to prevent open redirect attacks
function isSafeCallbackUrl(pathname: string): boolean {
  return (
    pathname.startsWith("/") &&
    !pathname.startsWith("//") &&
    !pathname.includes("://")
  );
}

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  const { pathname } = request.nextUrl;
  const isLoggedIn = !!token;

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isAuthRoute = authRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isAdminRoute = adminRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Si intenta acceder a ruta de admin sin ser admin o super_admin → dashboard
  if (isAdminRoute) {
    console.log("Token role:", token?.role);
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    if (token?.role !== "ADMIN" && token?.role !== "SUPER_ADMIN") {
      console.log("Redirecting to dashboard - role not allowed", token?.role);
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Si intenta acceder a ruta protegida sin auth → login
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    if (isSafeCallbackUrl(pathname)) {
      loginUrl.searchParams.set("callbackUrl", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Si ya está logueado e intenta ir a login/register → dashboard
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/settings/:path*", "/login", "/register"],
};