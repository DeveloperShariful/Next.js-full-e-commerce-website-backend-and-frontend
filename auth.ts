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
});