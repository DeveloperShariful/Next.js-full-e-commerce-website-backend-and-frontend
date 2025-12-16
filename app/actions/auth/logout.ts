// app/actions/auth/logout.ts

"use server";

import { signOut } from "@/auth";
import { cookies } from "next/headers";

export const logout = async () => {
  // ১. কুকি জার (Cookie Jar) থেকে কুকিগুলো ফোর্স ডিলিট করা
  const cookieStore = await cookies();
  
  // প্রোডাকশন (Netlify - Secure) এবং লোকালহোস্ট দুটোর জন্যই কুকি ডিলিট করা
  cookieStore.delete("authjs.session-token");
  cookieStore.delete("__Secure-next-auth.session-token");
  cookieStore.delete("next-auth.session-token");
  cookieStore.delete("__Secure-next-auth.callback-url");
  cookieStore.delete("next-auth.callback-url");

  // ২. এরপর NextAuth এর অফিশিয়াল সাইনআউট কল করা
  await signOut({ redirectTo: "/auth/login", redirect: true });
};