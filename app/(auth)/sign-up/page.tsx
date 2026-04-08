// app/(auth)/sign-up/page.tsx

"use client";

import { registerUser } from "@/app/actions/auth";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Eye, EyeOff, Mail, Lock, User, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const clientAction = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const res = await registerUser(formData);
      if (res?.error) {
        setError(res.error);
        toast.error(res.error);
      } else {
        toast.success("Account created successfully!");
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900">Create Account</h2>
          <p className="text-slate-500 mt-2 text-sm">Join GoBike and start your journey</p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center border border-red-100 animate-pulse">
            {error}
          </div>
        )}

        <form action={clientAction} className="space-y-5">
          {/* Name Field */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700 block">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                name="name" 
                required 
                placeholder="John Doe"
                className="w-full border border-slate-200 rounded-xl p-3 pl-10 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="email" 
                name="email" 
                required 
                placeholder="name@example.com"
                className="w-full border border-slate-200 rounded-xl p-3 pl-10 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700 block">Create Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                required 
                placeholder="••••••••"
                className="w-full border border-slate-200 rounded-xl p-3 pl-10 pr-10 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isPending}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign Up"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-600 text-sm">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-blue-600 font-bold hover:underline">
              Sign In here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}