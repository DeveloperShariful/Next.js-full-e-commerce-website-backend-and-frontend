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
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");

  // ১. API রাউট হলে বাধা দেব না
  if (isApiAuthRoute) {
    return;
  }

  // ২. যদি লগইন/রেজিস্টার পেজে থাকে
  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return;
  }

  // ৩. অ্যাডমিন রাউট প্রোটেকশন
  if (isAdminRoute) {
    if (!isLoggedIn) {
      return Response.redirect(new URL("/auth/login", nextUrl));
    }

    if (role === "CUSTOMER") {
      return Response.redirect(new URL("/", nextUrl));
    }
  }

  return;
});

// Matcher Configuration
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};