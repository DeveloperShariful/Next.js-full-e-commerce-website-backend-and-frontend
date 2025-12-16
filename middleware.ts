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
  
  // ডায়নামিক পাবলিক রাউট চেক
  const isPublicRoute = publicRoutes.some(route => {
    if (route === "/") return nextUrl.pathname === "/";
    return nextUrl.pathname.startsWith(route);
  });

  // ১. API রাউট হলে বাধা দেব না (সবার আগে চেক)
  if (isApiAuthRoute) {
    return;
  }

  // ২. লগইন বা রেজিস্টার পেজে থাকলে (Auth Routes)
  if (isAuthRoute) {
    if (isLoggedIn) {
      // যদি লগইন থাকে, তবেই রিডাইরেক্ট করো
      if (role === "CUSTOMER") {
        return Response.redirect(new URL("/", nextUrl));
      }
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    // [গুরুত্বপূর্ণ] যদি লগইন না থাকে, তাহলে পেজটি লোড হতে দাও (Return void)
    return;
  }

  // ৩. অ্যাডমিন রাউট হলে (Admin Routes)
  if (isAdminRoute) {
    if (!isLoggedIn) {
      return Response.redirect(new URL("/auth/login", nextUrl));
    }
    if (role === "CUSTOMER") {
      return Response.redirect(new URL("/", nextUrl));
    }
    return; 
  }

  // ৪. বাকি সব প্রাইভেট রাউট (যদি পাবলিক না হয় এবং লগইন না থাকে)
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

// Matcher (Static files বাদ দেওয়া হয়েছে)
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};