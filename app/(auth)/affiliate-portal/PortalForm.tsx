// File: app/(auth)/affiliate-portal/PortalForm.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from "next-auth/react"; // ✅ FIXED: Using native NextAuth signIn
import { Loader2, Settings, ShieldAlert, CheckCircle } from "lucide-react";
import { registerAffiliateAction } from '@/app/actions/frontend/affiliate/_services/auth-actions';
import { cn } from "@/lib/utils";

export default function PortalForm() {
  const router = useRouter();
  
  // Registration States
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regMessage, setRegMessage] = useState({ type: '', text: '' });
  const [agreed, setAgreed] = useState(false);

  // Login States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Handle Registration via Prisma Server Action
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); 

    if (!agreed) {
        alert("Please agree to the Terms of Service first.");
        return;
    }

    setRegLoading(true);
    setRegMessage({ type: '', text: '' });

    try {
        const res = await registerAffiliateAction({
            username: regUsername,
            email: regEmail,
            password: regPassword
        });

        if (res.success) {
            setRegMessage({ type: 'success', text: res.message });
            setRegUsername('');
            setRegEmail('');
            setRegPassword('');
            setAgreed(false);
        } else {
            setRegMessage({ type: 'error', text: res.message });
        }
    } catch (err) {
        setRegMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
        setRegLoading(false);
    }
  };

  // Handle Login via Native NextAuth Credentials Provider
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
        // ✅ FIXED: Using NextAuth signIn directly instead of old custom API fetch
        const res = await signIn("credentials", {
            redirect: false,
            email: loginEmail,
            password: loginPassword,
        });

        if (res?.error) {
            setLoginError('Invalid email or password.');
        } else {
            router.push('/affiliates'); // Redirecting to optimized dashboard
            router.refresh();
        }
    } catch (err) {
        setLoginError('Login failed. Try again.');
    } finally {
        setLoginLoading(false);
    }
  };

  // WooCommerce/WordPress Styling classes
  const metaboxClass = "bg-white border border-[#c3c4c7] p-6 shadow-sm rounded-none";
  const headingClass = "text-[20px] font-normal text-[#1d2327] mb-4 pb-2 border-b border-[#f0f0f1]";
  const labelClass = "block text-[13px] font-semibold text-[#1d2327] mb-1";
  const inputClass = "w-full border border-[#8c8f94] rounded-sm px-3 py-1.5 text-[13px] text-[#2c3338] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none transition-shadow bg-white";
  const btnPrimary = "border border-[#2271b1] bg-[#2271b1] hover:bg-[#135e96] hover:border-[#135e96] text-white text-[13px] font-semibold px-4 py-2 rounded-sm transition-colors cursor-pointer flex items-center justify-center gap-2 w-full";

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8 font-sans text-[#1d2327]">
        
        {/* WP Breadcrumbs */}
        <div className="mb-6 flex justify-between items-center border-b border-[#c3c4c7] pb-3">
             <div className="text-[13px] text-[#50575e] m-0">
                <Link href="/" className="text-[#2271b1] hover:underline">Home</Link> / Affiliate Portal
             </div>
             <span className="font-semibold text-[13px] text-[#50575e] flex items-center gap-1">
                <Settings className="w-4 h-4"/> GoBike Australia
             </span>
        </div>

        <h1 className="text-[28px] font-normal text-[#1d2327] mb-8">Affiliate Portal</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            
            {/* REGISTER FORM (WooCommerce Style) */}
            <div className={metaboxClass}>
                <h2 className={headingClass}>Register</h2>
                
                {regMessage.text && (
                    <div className={cn("p-3 mb-4 border text-[13px] flex items-start gap-2",
                        regMessage.type === 'success' ? 'bg-[#f0f6fc] text-[#00a32a] border-[#00a32a]/30' : 'bg-[#fcf0f1] text-[#d63638] border-[#d63638]/30'
                    )}>
                        {regMessage.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5"/> : <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5"/>}
                        <span>
                          {regMessage.text}
                          {(regMessage as any).isExistingCustomer && (
                            <> Use your <strong>existing account password</strong> in the Password field above.</>
                          )}
                          {(regMessage as any).alreadyAffiliate && (
                            <> Use the <strong>Login form</strong> on the right to access your affiliate dashboard.</>
                          )}
                        </span>
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className={labelClass}>Username <span className="text-[#d63638]">*</span></label>
                        <input 
                            type="text" required 
                            className={inputClass}
                            placeholder="Your username"
                            value={regUsername}
                            onChange={(e) => setRegUsername(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Email Address <span className="text-[#d63638]">*</span></label>
                        <input 
                            type="email" required 
                            className={inputClass}
                            placeholder="Your primary email"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Password <span className="text-[#d63638]">*</span></label>
                        <input
                            type="password" required
                            className={inputClass}
                            placeholder="New password (or existing account password)"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                        />
                        <p className="text-[11px] text-[#646970] mt-1">Already a customer? Enter your existing password to apply as an affiliate.</p>
                    </div>

                    {/* WC Style Terms Agreement */}
                    <div className="flex items-center gap-2 p-3 bg-[#f6f7f7] border border-[#c3c4c7] rounded-sm">
                        <input 
                            type="checkbox" 
                            id="terms" 
                            className="w-4 h-4 cursor-pointer rounded-sm border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                        />
                        <label htmlFor="terms" className="text-[13px] text-[#1d2327] cursor-pointer select-none">
                            I agree to the <Link href="/terms-and-conditions" className="text-[#2271b1] hover:underline font-semibold">Terms of Service</Link>
                        </label>
                    </div>

                    <button 
                        type="submit" 
                        disabled={regLoading || !agreed}
                        className={cn(btnPrimary, (regLoading || !agreed) && "opacity-50 cursor-not-allowed")}
                    >
                        {regLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : null}
                        {regLoading ? 'Registering...' : 'Register as Affiliate'}
                    </button>
                    
                    {!agreed && (
                        <p className="text-[11px] text-[#d63638] m-0">* You must accept the terms to register.</p>
                    )}
                </form>
            </div>

            {/* LOGIN FORM (WooCommerce Style) */}
            <div className={metaboxClass}>
                <h2 className={headingClass}>Login</h2>

                {loginError && (
                    <div className="bg-[#fcf0f1] text-[#d63638] border border-[#d63638]/30 p-3 mb-4 text-[13px] flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4" /> {loginError}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className={labelClass}>Username or Email Address <span className="text-[#d63638]">*</span></label>
                        <input 
                            type="text" required 
                            className={inputClass}
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Password <span className="text-[#d63638]">*</span></label>
                        <input 
                            type="password" required 
                            className={inputClass}
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <Link href="/forgot-password" className="text-[13px] text-[#2271b1] hover:underline">
                            Lost your password?
                        </Link>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loginLoading}
                        className={cn(btnPrimary, loginLoading && "opacity-50 cursor-not-allowed")}
                    >
                        {loginLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : null}
                        {loginLoading ? 'Logging in...' : 'Login as Affiliate'}
                    </button>
                </form>
            </div>

        </div>
    </div>
  );
}