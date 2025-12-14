// routes.ts

/**
 * এই রাউটগুলোতে লগইন ছাড়াই ঢোকা যাবে।
 * @type {string[]}
 */
export const publicRoutes = [
  "/",
  "/shop",
  "/product", // Dynamic routes will be handled in middleware logic
];

/**
 * এই রাউটগুলো অথেন্টিকেশনের জন্য ব্যবহার হয়।
 * লগইন করা থাকলে এই পেজে আর ঢুকতে দেব না (সরাসরি ড্যাশবোর্ডে পাঠাবো)।
 * @type {string[]}
 */
export const authRoutes = [
  "/auth/login",
  "/auth/register",
];

/**
 * API অথেন্টিকেশন রাউট (কখনোই ব্লক করা যাবে না)।
 * @type {string}
 */
export const apiAuthPrefix = "/api/auth";

/**
 * লগইন করার পর ডিফল্ট যেখানে যাবে।
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT = "/admin";