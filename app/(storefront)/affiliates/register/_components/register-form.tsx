//app/(storefront)/affiliates/register/_components/register-form.tsx

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
import { registerAffiliateAction } from "@/app/actions/storefront/affiliates/_services/register-affiliate";

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
    user: any;
}

export default function EnterpriseRegisterForm({ user }: Props) {
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

      {/* 🔴 RIGHT SIDE: The Form */}
      <div className="w-full lg:w-7/12 p-8 lg:p-12 overflow-y-auto">
        <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-gray-900">Apply for Partnership</h2>
            <p className="text-sm text-gray-500 mt-1">Tell us a bit about how you promote.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Custom Slug */}
            <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Your Handle</label>
                <div className="flex rounded-lg shadow-sm border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-black focus-within:border-black transition-all">
                    <span className="bg-gray-50 text-gray-500 px-3 py-2.5 text-sm border-r border-gray-300">gobike.au/ref/</span>
                    <input 
                        {...register("slug")}
                        className="flex-1 px-3 py-2.5 text-sm outline-none font-medium text-gray-900 placeholder-gray-300"
                        placeholder="your-brand"
                    />
                </div>
                {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Website */}
                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Website (Optional)</label>
                    <div className="relative">
                        <Globe className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"/>
                        <input 
                            {...register("website")}
                            className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-black transition-colors"
                            placeholder="https://yourblog.com"
                        />
                    </div>
                    {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website.message}</p>}
                </div>

                {/* Social Profile */}
                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Primary Social</label>
                    <div className="relative">
                        <Instagram className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"/>
                        <input 
                            {...register("socialProfile")}
                            className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-black transition-colors"
                            placeholder="@username or Link"
                        />
                    </div>
                    {errors.socialProfile && <p className="text-red-500 text-xs mt-1">{errors.socialProfile.message}</p>}
                </div>
            </div>

            {/* Promotion Strategy */}
            <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">How will you promote us?</label>
                <textarea 
                    {...register("promotionMethod")}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-black transition-colors min-h-[80px]"
                    placeholder="E.g. I create tech reviews on YouTube and have a blog about cycling..."
                />
                {errors.promotionMethod && <p className="text-red-500 text-xs mt-1">{errors.promotionMethod.message}</p>}
            </div>

            {/* Terms */}
            <div className="flex items-start bg-gray-50 p-3 rounded-lg">
                <input
                    id="agreeTerms"
                    type="checkbox"
                    {...register("agreeTerms")}
                    className="mt-1 h-4 w-4 text-black border-gray-300 rounded focus:ring-black"
                />
                <label htmlFor="agreeTerms" className="ml-3 text-xs text-gray-600 leading-snug cursor-pointer">
                    I verify that the information above is accurate and I agree to the <span className="font-bold text-gray-900 underline">Partner Terms & Conditions</span>.
                </label>
            </div>
            {errors.agreeTerms && <p className="text-red-500 text-xs px-1">* You must accept the terms</p>}

            <button
                type="submit"
                disabled={isPending}
                className="w-full py-3.5 bg-black hover:bg-gray-800 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isPending ? <Loader2 className="animate-spin w-4 h-4" /> : "Submit Application"} 
                {!isPending && <ArrowRight className="w-4 h-4" />}
            </button>

        </form>
      </div>
    </div>
  );
}