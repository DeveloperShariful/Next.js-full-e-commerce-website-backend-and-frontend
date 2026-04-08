//types/next-auth.d.ts

import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  // AdapterUser এর সাথে ম্যাচ করার জন্য role কে optional করা হলো
  interface User extends DefaultUser {
    role?: string; 
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    role?: string;
  }
}