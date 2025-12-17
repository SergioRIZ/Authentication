import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedRoute = ["/dashboard"]

const authRouters = ["/login", "/register"]

export async function middleware(req: NextRequest) {
    const { pathname} = req.nextUrl;

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    const isAuthenticated = !!token;

    if(authRouters.some(route => pathname.startsWith(route))) {
        if(isAuthenticated) {
            return NextResponse.redirect(new URL("/dashboard", req.url))
        }
    }

    return NextResponse.next();

}

export const config = {
    matcher : [
         "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
    ]
}