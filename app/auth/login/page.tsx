// app/auth/login/page.tsx

"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { LoginSchema } from "@/schemas";
import { login } from "@/app/actions/login";
import Link from "next/link";
import { Loader2, Lock, Mail, AlertCircle, Eye, EyeOff } from "lucide-react"; // Icons added

export default function LoginPage() {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false); // New State

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      login(values).then((data) => {
        if (data?.error) {
          // @ts-ignore
          setError(data.error);
        }
      });
    });
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Welcome Back</h1>
        <p className="text-slate-500 text-sm mt-2">Login to manage your store</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Email */}
        <div className="space-y-1">
          <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              {...form.register("email")}
              disabled={isPending}
              placeholder="admin@example.com"
              type="email"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          {form.formState.errors.email && (
            <p className="text-red-500 text-xs ml-1">{form.formState.errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              {...form.register("password")}
              disabled={isPending}
              placeholder="******"
              type={showPassword ? "text" : "password"} // Toggle type
              className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            {/* Eye Icon Button */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {form.formState.errors.password && (
            <p className="text-red-500 text-xs ml-1">{form.formState.errors.password.message}</p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}
        
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-lg disabled:opacity-70 flex justify-center items-center gap-2"
        >
          {isPending ? <Loader2 className="animate-spin" /> : "Login"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-500">
        Don't have an account?{" "}
        <Link href="/auth/register" className="text-blue-600 font-bold hover:underline">
          Register
        </Link>
      </div>
    </div>
  );
}