// proxy.ts — Next.js Middleware (Auth + Affiliate Tracking)

import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";

const { auth } = NextAuth(authConfig);

// ==========================================
// ROUTE DEFINITIONS
// ==========================================

const protectedRoutes = [
  "/admin",
  "/profile",
  "/api/admin",
  "/affiliates",
] as const;

const adminRoutes = ["/admin", "/api/admin"] as const;

// Login করা user কে এই routes-এ যেতে দেব না
const authOnlyRoutes = ["/sign-in", "/sign-up"] as const;

// এই API routes-এ middleware apply হবে না
const publicApiPrefixes = ["/api/webhooks", "/api/tracking"] as const;

// এই roles admin panel ব্যবহার করতে পারবে (CUSTOMER পারবে না)
const ADMIN_ALLOWED_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "EDITOR",
  "SUPPORT",
  "AFFILIATE",
  "SUBSCRIBER",
] as const;

type AdminAllowedRole = (typeof ADMIN_ALLOWED_ROLES)[number];

function isAdminAllowedRole(role: string | undefined | null): role is AdminAllowedRole {
  if (!role) return false;
  return (ADMIN_ALLOWED_ROLES as readonly string[]).includes(role);
}

function setAffiliateCookie(res: NextResponse, code: string): void {
  res.cookies.set("affiliate_token", code, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 দিন
    httpOnly: false,            // client-side analytics-এর জন্য readable রাখা হয়েছে
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}

// ==========================================
// MAIN MIDDLEWARE
// ==========================================

export default auth((req: NextAuthRequest) => {
  const url = req.nextUrl;
  const referralCode = url.searchParams.get("ref");
  const isLoggedIn  = !!req.auth;
  const userRole    = req.auth?.user?.role;   // types/next-auth.d.ts এ role: string defined

  // ── Public API: webhook, tracking — middleware skip ─────────────────
  const isPublicApi = publicApiPrefixes.some((p) => url.pathname.startsWith(p));
  if (isPublicApi) return NextResponse.next();

  // ── Base response (affiliate cookie এখানে set হবে) ──────────────────
  const response = NextResponse.next();
  if (referralCode) {
    setAffiliateCookie(response, referralCode);
  }

  // ── Auth-only routes: login করা user কে redirect করো ────────────────
  const isAuthRoute = (authOnlyRoutes as readonly string[]).includes(url.pathname);
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  // ── Protected routes: login ছাড়া block করো ──────────────────────────
  const isProtectedRoute = protectedRoutes.some((route) =>
    url.pathname.startsWith(route)
  );

  if (isProtectedRoute && !isLoggedIn) {
    if (url.pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Redirect করার সময়ও affiliate cookie বহন করো
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("callbackUrl", url.pathname);
    const redirectRes = NextResponse.redirect(signInUrl);
    if (referralCode) {
      setAffiliateCookie(redirectRes, referralCode);
    }
    return redirectRes;
  }

  // ── Admin routes: CUSTOMER role block করো ───────────────────────────
  const isAdminRoute = adminRoutes.some((route) =>
    url.pathname.startsWith(route)
  );

  if (isAdminRoute && isLoggedIn && !isAdminAllowedRole(userRole)) {
    if (url.pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Forbidden. Insufficient permissions." },
        { status: 403 }
      );
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  return response;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
