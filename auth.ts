// auth.ts

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/prisma";
import { authConfig } from "./auth.config";

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes — DB sync throttle

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).toLowerCase().trim();

        const user = await db.user.findUnique({ where: { email } });

        // User not found, no password, banned, or soft-deleted → reject
        if (!user || !user.password) return null;
        if (!user.isActive || user.deletedAt !== null) return null;

        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordsMatch) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // First sign-in: populate token directly from credentials result
      if (user) {
        token.role = user.role || "CUSTOMER";
        token.id = user.id as string;
        token.syncedAt = Date.now();
        return token;
      }

      // Throttle: only hit the DB every 5 minutes per session
      const needsSync =
        !token.syncedAt || Date.now() - (token.syncedAt as number) > SYNC_INTERVAL;

      if (token?.id && needsSync) {
        try {
          const dbUser = await db.user.findUnique({
            where: { id: token.id as string },
            select: {
              name: true,
              role: true,
              image: true,
              isActive: true,
              deletedAt: true,
            },
          });

          // User deleted, banned, or not found → kill session immediately
          if (!dbUser || !dbUser.isActive || dbUser.deletedAt !== null) {
            return null;
          }

          token.name = dbUser.name;
          token.role = dbUser.role;
          token.picture = dbUser.image;
          token.syncedAt = Date.now();
        } catch (error) {
          console.error("Session sync failed:", error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (!token?.id) return session;
      if (token && session.user) {
        session.user.role = (token.role as string) || "CUSTOMER";
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
});
