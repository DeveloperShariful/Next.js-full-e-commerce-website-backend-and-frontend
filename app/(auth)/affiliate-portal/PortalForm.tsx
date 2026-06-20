// File: app/(auth)/affiliate-portal/PortalForm.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from "next-auth/react";
import { Loader2, ShieldAlert, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PortalForm() {
  const router = useRouter();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: loginEmail,
        password: loginPassword,
      });

      if (res?.error) {
        setLoginError('Invalid email or password.');
      } else {
        router.push('/affiliates');
        router.refresh();
      }
    } catch {
      setLoginError('Login failed. Try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const inputClass = "w-full border border-[#8c8f94] rounded-sm px-3 py-2 text-[13px] text-[#2c3338] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none transition-shadow bg-white";
  const labelClass = "block text-[13px] font-semibold text-[#1d2327] mb-1";
  const btnPrimary = "border border-[#2271b1] bg-[#2271b1] hover:bg-[#135e96] hover:border-[#135e96] text-white text-[13px] font-semibold px-4 py-2 rounded-sm transition-colors cursor-pointer flex items-center justify-center gap-2 w-full";

  return (
    <div className="max-w-[400px] mx-auto px-4 py-12 font-sans text-[#1d2327]">

      {/* Brand header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-[#2271b1] rounded-xl mb-4 shadow-lg">
          <TrendingUp className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-[22px] font-bold text-[#1d2327]">GoBike Affiliate Portal</h1>
        <p className="text-[13px] text-[#646970] mt-1">Sign in to access your affiliate dashboard</p>
      </div>

      {/* Login card */}
      <div className="bg-white border border-[#c3c4c7] shadow-sm p-6 rounded-sm">

        {loginError && (
          <div className="bg-[#fcf0f1] text-[#d63638] border border-[#d63638]/30 p-3 mb-4 text-[13px] flex items-center gap-2 rounded-sm">
            <ShieldAlert className="w-4 h-4 shrink-0" /> {loginError}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className={labelClass}>Email Address <span className="text-[#d63638]">*</span></label>
            <input
              type="email"
              required
              className={inputClass}
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className={labelClass}>Password <span className="text-[#d63638]">*</span></label>
            <input
              type="password"
              required
              className={inputClass}
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loginLoading}
            className={cn(btnPrimary, loginLoading && "opacity-50 cursor-not-allowed")}
          >
            {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loginLoading ? 'Signing in...' : 'Sign In to Affiliate Portal'}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-[#f0f0f1] flex justify-between items-center">
          <Link href="/forgot-password" className="text-[12px] text-[#2271b1] hover:underline">
            Lost your password?
          </Link>
          <Link href="/sign-in" className="text-[12px] text-[#646970] hover:underline">
            Regular sign in
          </Link>
        </div>
      </div>

      {/* New affiliate CTA */}
      <div className="mt-4 bg-white border border-[#c3c4c7] shadow-sm p-4 rounded-sm text-center">
        <p className="text-[13px] text-[#50575e] mb-2">Want to join our affiliate program?</p>
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#2271b1] hover:underline"
        >
          <TrendingUp className="w-4 h-4" />
          Create an account &amp; apply
        </Link>
      </div>

      <p className="text-center text-[11px] text-[#646970] mt-6">
        &copy; {new Date().getFullYear()} GoBike Australia. All rights reserved.
      </p>
    </div>
  );
}
