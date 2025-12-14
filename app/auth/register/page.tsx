// app/auth/register/page.tsx

"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { RegisterSchema } from "@/schemas";
import { register } from "@/app/actions/register";
import Link from "next/link";
import { Loader2, Lock, Mail, User, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      register(values).then((data) => {
        if (data?.error) {
           setError(data.error);
        }
        if (data?.success) {
           setSuccess(data.success);
           form.reset();
        }
      });
    });
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Create Account</h1>
        <p className="text-slate-500 text-sm mt-2">Join us to start shopping</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Name */}
        <div className="space-y-1">
          <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              {...form.register("name")}
              disabled={isPending}
              placeholder="John Doe"
              type="text"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          {form.formState.errors.name && (
            <p className="text-red-500 text-xs ml-1">{form.formState.errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              {...form.register("email")}
              disabled={isPending}
              placeholder="john@example.com"
              type="email"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          {form.formState.errors.email && (
            <p className="text-red-500 text-xs ml-1">{form.formState.errors.email.message}</p>
          )}
        </div>

        {/* Password with Eye Icon */}
        <div className="space-y-1">
          <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              {...form.register("password")}
              disabled={isPending}
              placeholder="******"
              type={showPassword ? "text" : "password"} // ✅ Dynamic Type
              className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            
            {/* ✅ Eye Button */}
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

        {/* Messages */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle2 size={16} /> {success}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-lg disabled:opacity-70 flex justify-center items-center gap-2"
        >
          {isPending ? <Loader2 className="animate-spin" /> : "Register"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-blue-600 font-bold hover:underline">
          Login
        </Link>
      </div>
    </div>
  );
}