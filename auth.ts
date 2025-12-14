import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import authConfig from "@/auth.config";
import { Role } from "@prisma/client";
import Credentials from "next-auth/providers/credentials";
import { LoginSchema } from "@/schemas";
import bcrypt from "bcryptjs";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  events: {
    async linkAccount({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() }
      })
    }
  },
  
  callbacks: {
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        // @ts-ignore
        session.user.role = token.role as Role;
      }

      return session;
    },

    async jwt({ token }) {
      if (!token.sub) return token;

      const existingUser = await db.user.findUnique({
        where: { id: token.sub }
      });

      if (!existingUser) return token;

      token.role = existingUser.role;
      return token;
    }
  },

  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  
  providers: [
    Credentials({
      async authorize(credentials) {
        console.log("🔥 Login Attempt Started..."); // ডিবাগ লগ ১

        const validatedFields = LoginSchema.safeParse(credentials);

        if (validatedFields.success) {
          const { email, password } = validatedFields.data;
          console.log("📧 Email being checked:", email); // ডিবাগ লগ ২

          const user = await db.user.findUnique({
            where: { email }
          });

          if (!user || !user.password) {
            console.log("❌ User not found or no password in DB"); // ডিবাগ লগ ৩
            return null;
          }

          console.log("✅ User found in DB. Checking password..."); // ডিবাগ লগ ৪
          
          // পাসওয়ার্ড ম্যাচ করা
          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) {
            console.log("🎉 Password Matched! Logging in..."); // ডিবাগ লগ ৫
            return user;
          } else {
            console.log("🚫 Password DID NOT Match!"); // ডিবাগ লগ ৬
          }
        } else {
            console.log("⚠️ Validation Failed");
        }

        return null;
      }
    })
  ],
});