// auth.config.ts

import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { LoginSchema } from "@/schemas";
import { db } from "@/lib/db"; // Note: Prisma in config might warn in pure Edge, but for authorize logic usually we fetch user inside. 
// For strict Edge compliance, usually we fetch user via fetch/API, but in Vercel/Node environment, this works if Prisma is Edge compatible or if we stick to non-DB logic here.
// However, the standard V5 pattern is to put the DB call inside authorize here.

export default {
  providers: [
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials);

        if (validatedFields.success) {
          const { email, password } = validatedFields.data;
          
          const user = await db.user.findUnique({
            where: { email }
          });

          if (!user || !user.password) return null;

          const passwordsMatch = await bcrypt.compare(
            password,
            user.password,
          );

          if (passwordsMatch) return user;
        }

        return null;
      }
    })
  ],
} satisfies NextAuthConfig;