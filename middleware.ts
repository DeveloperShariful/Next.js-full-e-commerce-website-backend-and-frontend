// middleware.ts

import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import {
  publicRoutes,
  authRoutes,
  apiAuthPrefix,
  DEFAULT_LOGIN_REDIRECT,
} from "@/routes";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  // @ts-ignore
  const role = req.auth?.user?.role;

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  
  // [UPDATED] Check for exact matches OR dynamic sub-paths
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname) || 
                        nextUrl.pathname.startsWith("/product") || 
                        nextUrl.pathname.startsWith("/shop") ||
                        nextUrl.pathname.startsWith("/categories");

  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");

  // 1. API Routes
  if (isApiAuthRoute) return;

  // 2. Auth Routes (Login/Register)
  if (isAuthRoute) {
    if (isLoggedIn) {
      if (role === "CUSTOMER") {
        return Response.redirect(new URL("/", nextUrl));
      }
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return;
  }

  // 3. Admin Routes
  if (isAdminRoute) {
    if (!isLoggedIn) {
      let callbackUrl = nextUrl.pathname;
      if (nextUrl.search) callbackUrl += nextUrl.search;
      const encodedCallbackUrl = encodeURIComponent(callbackUrl);
      return Response.redirect(new URL(`/auth/login?callbackUrl=${encodedCallbackUrl}`, nextUrl));
    }
    
    if (role === "CUSTOMER") {
      return Response.redirect(new URL("/", nextUrl)); 
    }
    return;
  }

  // 4. Protected Routes (Any route not public requires login)
  if (!isLoggedIn && !isPublicRoute) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }

    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return Response.redirect(new URL(`/auth/login?callbackUrl=${encodedCallbackUrl}`, nextUrl));
  }

  return;
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};