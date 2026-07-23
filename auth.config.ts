//auth.config.ts

// auth.config.ts

import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/sign-in",
  },
  providers: [], // আমরা auth.ts ফাইলে Credentials অ্যাড করেছি
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdminRoute = nextUrl.pathname.startsWith('/admin');
      const isProtectedRoute = isAdminRoute ||
        ["/profile", "/affiliates"].some((path) => nextUrl.pathname.startsWith(path));

      if (!isProtectedRoute) return true;
      if (!isLoggedIn) return false;

      if (isAdminRoute) {
        const role = auth?.user?.role as string | undefined;
        return ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EDITOR', 'SUPPORT'].includes(role ?? '');
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        // 'string | undefined' এরর ফিক্স করা হলো
        token.role = user.role || "CUSTOMER"; 
        token.id = user.id as string; 
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = (token.role as string) || "CUSTOMER";
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;