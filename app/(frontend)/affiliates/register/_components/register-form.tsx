//app/(frontend)/affiliates/register/_components/register-form.tsx

"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { 
    Loader2, ArrowRight, Globe, Link as LinkIcon, 
    Instagram, CheckCircle2, TrendingUp, DollarSign, ShieldCheck 
} from "lucide-react"; 
import { useRouter } from "next/navigation";
import { registerAffiliateAction } from "@/app/actions/frontend/affiliate/_services/register-affiliate";

// ✅ Enhanced Schema
const schema = z.object({
  slug: z.string().min(3).max(20).regex(/^[a-zA-Z0-9-_]+$/),
  website: z.string().url().optional().or(z.literal("")), // Optional but must be URL if present
  socialProfile: z.string().min(3, "Social profile is required for verification"),
  promotionMethod: z.string().min(10, "Please describe briefly how you will promote us"),
  agreeTerms: z.boolean().refine((val) => val === true, { message: "Required" }),
});

type FormData = z.infer<typeof schema>;

interface Props {
    user: { name: string | null; email: string; image: string | null } | null;
    commissionRate?: number;
}

export default function EnterpriseRegisterForm({ user, commissionRate = 10 }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  
  const suggestedSlug = user?.email.split("@")[0].replace(/[^a-zA-Z0-9-_]/g, "") || "";

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      slug: suggestedSlug,
      agreeTerms: false,
      website: "",
      socialProfile: "",
      promotionMethod: ""
    }
  });

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const res = await registerAffiliateAction(data); 
      if (res.success) {
        toast.success("Application Received! We will review it shortly.");
        router.push("/affiliates"); 
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
      
      {/* 🟢 LEFT SIDE: Enterprise Marketing / Benefits */}
      <div className="hidden lg:flex lg:w-5/12 bg-slate-900 p-10 flex-col justify-between text-white relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-600/20 to-transparent pointer-events-none" />
         
         <div className="relative z-10">
             <h3 className="text-2xl font-bold mb-2">Partner Benefits</h3>
             <p className="text-slate-400 text-sm">Join 5,000+ creators earning with us.</p>
             
             <div className="mt-8 space-y-6">
                 <div className="flex gap-4">
                     <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                         <DollarSign className="w-5 h-5 text-green-400"/>
                     </div>
                     <div>
                         <h4 className="font-bold text-sm">Competitive Commissions</h4>
                         <p className="text-xs text-slate-400 mt-1">Earn up to 20% on every sale.</p>
                     </div>
                 </div>
                 <div className="flex gap-4">
                     <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                         <TrendingUp className="w-5 h-5 text-blue-400"/>
                     </div>
                     <div>
                         <h4 className="font-bold text-sm">Real-time Analytics</h4>
                         <p className="text-xs text-slate-400 mt-1">Track clicks and sales instantly.</p>
                     </div>
                 </div>
                 <div className="flex gap-4">
                     <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                         <ShieldCheck className="w-5 h-5 text-indigo-400"/>
                     </div>
                     <div>
                         <h4 className="font-bold text-sm">Reliable Payouts</h4>
                         <p className="text-xs text-slate-400 mt-1">Net-30 payouts via Bank or PayPal.</p>
                     </div>
                 </div>
             </div>
         </div>

         <div className="relative z-10 pt-10">
             <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                 {user?.image && <img src={user.image} className="w-8 h-8 rounded-full border border-white/20"/>}
                 <div className="text-xs">
                     <p className="text-slate-400">Logged in as</p>
                     <p className="font-bold text-white">{user?.email}</p>
                 </div>
                 <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto"/>
             </div>
         </div>
      </div>

      {/* RIGHT SIDE: The Form */}
      <div className="w-full lg:w-7/12 overflow-y-auto">

        {/* Mobile-only gradient header (desktop has left panel) */}
        <div className="lg:hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 text-white px-6 pt-8 pb-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-3 py-1 mb-4">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold tracking-wide">GoBike Partner Program</span>
            </div>
            <h1 className="text-2xl font-extrabold leading-tight mb-1">Turn your audience<br/>into income.</h1>
            <p className="text-sm text-white/70 mb-5">Join our growing partner network and earn on every sale.</p>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <DollarSign className="w-3.5 h-3.5 text-green-300 shrink-0" />
                <span className="text-xs font-bold">Up to {commissionRate}% commission</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                <span className="text-xs font-bold">Reliable Payouts</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
                <span className="text-xs font-bold">Real-time Analytics</span>
              </div>
            </div>
            {user && (
              <div className="flex items-center gap-2 mt-5 bg-white/10 rounded-xl px-3 py-2 border border-white/15">
                {user.image
                  ? <img src={user.image} className="w-7 h-7 rounded-full border border-white/20" alt="" />
                  : <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{(user.name || user.email)[0].toUpperCase()}</div>
                }
                <div className="text-xs min-w-0">
                  <p className="text-white/60 leading-none">Logged in as</p>
                  <p className="font-semibold text-white truncate leading-snug">{user.email}</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-green-400 ml-auto shrink-0" />
              </div>
            )}
          </div>
        </div>

        {/* Form body */}
        <div className="p-6 lg:p-12">
          <div className="mb-6 hidden lg:block">
            <h2 className="text-2xl font-extrabold text-gray-900">Apply for Partnership</h2>
            <p className="text-sm text-gray-500 mt-1">Tell us a bit about how you promote.</p>
          </div>
          <div className="mb-6 lg:hidden">
            <h2 className="text-xl font-extrabold text-gray-900">Apply for Partnership</h2>
            <p className="text-sm text-gray-500 mt-1">Complete the form below to get started.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Handle / Slug */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                Your Referral Handle <span className="text-red-500">*</span>
              </label>
              <div className={`flex rounded-xl border overflow-hidden transition-all focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 ${errors.slug ? 'border-red-400' : 'border-gray-200'}`}>
                <span className="bg-gray-50 text-gray-400 px-3 py-3 text-sm border-r border-gray-200 whitespace-nowrap font-medium">gobike.au/ref/</span>
                <input
                  {...register("slug")}
                  className="flex-1 px-3 py-3 text-sm outline-none font-semibold text-gray-900 placeholder-gray-300 bg-white"
                  placeholder="your-brand"
                />
              </div>
              {errors.slug
                ? <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>
                : <p className="text-gray-400 text-xs mt-1">Letters, numbers, hyphens only. This is your unique link.</p>
              }
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Website */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Website <span className="text-gray-400 font-normal normal-case">(optional)</span></label>
                <div className={`relative rounded-xl border overflow-hidden transition-all focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 ${errors.website ? 'border-red-400' : 'border-gray-200'}`}>
                  <Globe className="absolute left-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    {...register("website")}
                    className="w-full pl-9 pr-3 py-3 text-sm outline-none bg-white text-gray-900 placeholder-gray-300"
                    placeholder="https://yourblog.com"
                  />
                </div>
                {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website.message}</p>}
              </div>

              {/* Social */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Primary Social <span className="text-red-500">*</span></label>
                <div className={`relative rounded-xl border overflow-hidden transition-all focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 ${errors.socialProfile ? 'border-red-400' : 'border-gray-200'}`}>
                  <Instagram className="absolute left-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    {...register("socialProfile")}
                    className="w-full pl-9 pr-3 py-3 text-sm outline-none bg-white text-gray-900 placeholder-gray-300"
                    placeholder="@username or profile link"
                  />
                </div>
                {errors.socialProfile && <p className="text-red-500 text-xs mt-1">{errors.socialProfile.message}</p>}
              </div>
            </div>

            {/* Promotion method */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">How will you promote us? <span className="text-red-500">*</span></label>
              <textarea
                {...register("promotionMethod")}
                rows={3}
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none bg-white text-gray-900 placeholder-gray-300 ${errors.promotionMethod ? 'border-red-400' : 'border-gray-200'}`}
                placeholder="E.g. I create bike reviews on YouTube and run a cycling blog with 10k monthly readers..."
              />
              {errors.promotionMethod && <p className="text-red-500 text-xs mt-1">{errors.promotionMethod.message}</p>}
            </div>

            {/* Terms */}
            <div className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${errors.agreeTerms ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
              <input
                id="agreeTerms"
                type="checkbox"
                {...register("agreeTerms")}
                className="mt-0.5 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 shrink-0 cursor-pointer"
              />
              <label htmlFor="agreeTerms" className="text-xs text-gray-600 leading-relaxed cursor-pointer select-none">
                I confirm the information above is accurate and I agree to the{" "}
                <a href="/terms-and-conditions" className="font-bold text-gray-900 underline hover:text-indigo-600 transition-colors">Partner Terms &amp; Conditions</a>.
              </label>
            </div>
            {errors.agreeTerms && <p className="text-red-500 text-xs -mt-3 px-1">* You must accept the terms to continue</p>}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
            >
              {isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              {isPending ? "Submitting..." : "Submit Application"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}