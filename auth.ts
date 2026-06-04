// auth.ts

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Error: Email or Password missing in credentials");
          return null;
        }

        const email = (credentials.email as string).toLowerCase();

        // ১. ডাটাবেজে ইউজার আছে কি না চেক করুন
        const user = await db.user.findUnique({
          where: { email }
        });

        if (!user) {
          console.log(`❌ Error: No user found with email: ${email}`);
          return null;
        }

        if (!user.password) {
          console.log(`❌ Error: User ${email} exists but has NO password in DB )`);
          return null;
        }

        // ৩. পাসওয়ার্ড চেক করুন
        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordsMatch) {
          console.log(`❌ Error: Password mismatch for user: ${email}`);
          return null;
        }

        console.log(`✅ Success: User ${email} authenticated successfully!`);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      }
    })
  ],
  callbacks: {
    // ========================================================================
    // 🚀 REAL-TIME SESSION SYNC (ডাটাবেসের সাথে সেশন সিঙ্ক লজিক)
    // ========================================================================
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role || "CUSTOMER"; 
        token.id = user.id as string; 
      }

      // কাস্টমার রিফ্রেশ বা পেজ চেঞ্জ করার সময় ডাটাবেস থেকে রিয়েল-টাইম নাম ও পিকচার তুলে আনা হবে
      if (token?.id) {
        try {
          const dbUser = await db.user.findUnique({
            where: { id: token.id },
            select: { name: true, role: true, image: true }
          });
          if (dbUser) {
            token.name = dbUser.name;
            token.role = dbUser.role;
            token.picture = dbUser.image;
          }
        } catch (error) {
          console.error("Failed to sync session with database:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = (token.role as string) || "CUSTOMER";
        session.user.id = token.id as string;
        // ✅ ডাইনামিকলি সেশনে লেটেস্ট নাম ও পিকচার পুশ করা হচ্ছে
        session.user.name = token.name as string; 
        session.user.image = token.picture as string; 
      }
      return session;
    },
  }
});