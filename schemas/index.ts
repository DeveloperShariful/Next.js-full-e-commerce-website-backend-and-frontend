import * as z from "zod";
import { Role } from "@prisma/client";

// --- LOGIN SCHEMA ---
export const LoginSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
});

// --- REGISTER SCHEMA (Customer) ---
export const RegisterSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(6, {
    message: "Minimum 6 characters required",
  }),
  name: z.string().min(1, {
    message: "Name is required",
  }),
});

// --- STAFF CREATION SCHEMA (Admin Only) ---
export const StaffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Minimum 6 characters"),
  role: z.enum([Role.ADMIN, Role.MANAGER, Role.EDITOR, Role.SUPPORT]), // Only staff roles
});