// lib/db.ts
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

// গ্লোবাল ভেরিয়েবল ব্যবহার করা হয় যাতে হট-রিলোডে বারবার কানেকশন ওপেন না হয়
export const db = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}