// auth.ts

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/prisma";
import { authConfig } from "./auth.config";

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes — DB sync throttle

// Max failed login attempts per email+IP before temporary lockout
const MAX_FAILED_ATTEMPTS = 10;
// Lockout window: 15 minutes
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;

async function recordFailedLogin(rateKey: string, ip: string, email: string, reason: string) {
  try {
    await db.systemLog.create({
      data: {
        level: 'WARN',
        source: 'AUTH_RATE_LIMIT',
        message: rateKey,
        context: { ip, email, reason },
      },
    });
  } catch {
    // Never crash the auth flow if logging fails
  }
}

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
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).toLowerCase().trim();

        // Get the real client IP (Vercel sets x-forwarded-for)
        const ip =
          request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
          request.headers.get('x-real-ip') ??
          'unknown';

        // Rate-limit key is per email + IP combination
        const rateKey = `login_${ip}_${email}`;
        const windowStart = new Date(Date.now() - LOCKOUT_WINDOW_MS);

        // Count recent FAILED attempts only (successful logins are never logged here)
        try {
          const recentFailures = await db.systemLog.count({
            where: {
              source: 'AUTH_RATE_LIMIT',
              message: rateKey,
              createdAt: { gte: windowStart },
            },
          });

          if (recentFailures >= MAX_FAILED_ATTEMPTS) {
            // Too many failures — lock out silently (same response as wrong password)
            return null;
          }
        } catch {
          // If the DB check itself fails, allow the attempt rather than blocking all users
        }

        const user = await db.user.findUnique({ where: { email } });

        // User not found or has no password — log and reject
        if (!user || !user.password) {
          await recordFailedLogin(rateKey, ip, email, 'unknown_email');
          return null;
        }

        // User banned or soft-deleted — reject silently (no rate-limit log needed)
        if (!user.isActive || user.deletedAt !== null) return null;

        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        // Wrong password — log and reject
        if (!passwordsMatch) {
          await recordFailedLogin(rateKey, ip, email, 'wrong_password');
          return null;
        }

        // Successful login — do NOT log a failure, counter stays as-is
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
