// routes.ts

/**
 * এই রাউটগুলোতে লগইন ছাড়াই ঢোকা যাবে।
 * পাবলিক পেজগুলো এখানে লিস্ট করতে হবে।
 * @type {string[]}
 */
export const publicRoutes = [
  "/",
  "/shop",
  "/product",    // মিডলওয়্যারে startsWith চেক আছে, তবুও বেস পাথ রাখা হলো
  "/categories",
  "/about",
  "/contact",
  "/cart",       // কার্ট সাধারণত পাবলিক থাকে
  "/privacy",    // পলিসি পেজ
  "/terms",      // টার্মস পেজ
];

/**
 * এই রাউটগুলো অথেন্টিকেশনের জন্য ব্যবহার হয়।
 * লগইন করা থাকলে এই পেজে আর ঢুকতে দেব না (সরাসরি ড্যাশবোর্ড বা হোমে পাঠাবো)।
 * @type {string[]}
 */
export const authRoutes = [
  "/auth/login",
  "/auth/register",
  "/auth/error",
  // যদি পাসওয়ার্ড রিসেট পেজ থাকে তবে এগুলোও যোগ করতে পারেন:
  // "/auth/reset",
  // "/auth/new-password"
];

/**
 * API অথেন্টিকেশন রাউট (কখনোই ব্লক করা যাবে না)।
 * @type {string}
 */
export const apiAuthPrefix = "/api/auth";

/**
 * লগইন করার পর অ্যাডমিন বা স্টাফদের ডিফল্ট যেখানে পাঠানো হবে।
 * (কাস্টমারদের জন্য মিডলওয়্যারে আলাদা লজিক আছে)।
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT = "/admin";