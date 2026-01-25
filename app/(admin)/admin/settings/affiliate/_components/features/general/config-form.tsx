// File: app/(admin)/admin/settings/affiliate/_components/features/general/config-form.tsx

"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { 
  Loader2, 
  Save, 
  Settings, 
  AlertTriangle,
  ChevronRight
} from "lucide-react";
import { z } from "zod";
import { useSearchParams } from "next/navigation";

import { affiliateGeneralSchema } from "@/app/actions/admin/settings/affiliates/schemas";
import { updateGeneralSettings } from "@/app/actions/admin/settings/affiliates/mutations/update-config";
import { AffiliateGeneralSettings } from "@/app/actions/admin/settings/affiliates/types";
import { cn } from "@/lib/utils";

// Type inference
type FormValues = z.infer<typeof affiliateGeneralSchema>;

interface Props {
  initialData: AffiliateGeneralSettings;
}

export default function AffiliateGeneralConfigForm({ initialData }: Props) {
  const searchParams = useSearchParams();
  // 🔥 Read tab from URL, default to 'general'
  const activeTab = searchParams.get("tab") || "general";
  
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(affiliateGeneralSchema) as any,
    defaultValues: initialData as any,
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const result = await updateGeneralSettings(data);
      if (result.success) {
        toast.success("Settings updated successfully");
      } else {
        toast.error(result.message);
      }
    });
  };

  // ----------------------------------------------------------------------
  // REUSABLE COMPONENTS
  // ----------------------------------------------------------------------

  const SectionHeader = ({ title, description }: { title: string; description?: string }) => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
    </div>
  );
  
  const ToggleField = ({ name, label, description }: { name: keyof FormValues; label: string; description?: string }) => (
    <div className="flex items-start sm:items-center justify-between p-5 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all duration-200">
      <div className="flex-1 pr-8">
        <label htmlFor={name} className="text-sm font-semibold text-gray-900 cursor-pointer select-none">
          {label}
        </label>
        {description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
        <input 
          type="checkbox" 
          id={name}
          className="sr-only peer" 
          {...form.register(name)} 
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
      </label>
    </div>
  );

  const InputField = ({ name, label, type = "text", placeholder, prefix, suffix, helperText }: { name: keyof FormValues; label: string; type?: string; placeholder?: string; prefix?: string; suffix?: string; helperText?: React.ReactNode }) => (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <div className="relative flex items-center group">
        {prefix && <span className="absolute left-3 text-gray-500 text-sm font-medium">{prefix}</span>}
        <input
          type={type}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-lg border border-gray-300 bg-white py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-all shadow-sm",
            prefix ? "pl-8 pr-3" : "px-3",
            suffix ? "pr-10" : ""
          )}
          {...form.register(name)}
        />
        {suffix && <span className="absolute right-3 text-gray-500 text-xs font-medium bg-gray-100 px-2 py-1 rounded">{suffix}</span>}
      </div>
      {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
      {form.formState.errors[name] && (
        <p className="text-red-500 text-xs font-medium flex items-center gap-1 animate-in slide-in-from-left-1">
          <AlertTriangle className="w-3 h-3"/> {form.formState.errors[name]?.message}
        </p>
      )}
    </div>
  );

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
      
      <div className="w-full bg-white border border-gray-200 rounded-2xl shadow-sm min-h-[600px] relative overflow-hidden">
        
        {/* Dynamic Header based on URL Tab */}
        <div className="bg-gray-50/50 border-b px-8 py-6 flex items-center gap-2">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight capitalize">
              {activeTab.replace("-", " ")} Settings
            </h2>
            <p className="text-sm text-gray-500 mt-1">Configure your program preferences.</p>
          </div>
        </div>

        <div className="p-8 pb-32">
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500" key={activeTab}>
            
            {/* === TAB 1: GENERAL === */}
            {activeTab === "general" && (
              <>
                <div className={cn(
                  "p-6 rounded-2xl border transition-all duration-300",
                  form.watch("isActive") 
                    ? "bg-green-50 border-green-200 shadow-sm" 
                    : "bg-gray-50 border-gray-200"
                )}>
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-3 rounded-xl flex-shrink-0",
                      form.watch("isActive") ? "bg-green-200 text-green-800" : "bg-gray-200 text-gray-500"
                    )}>
                      <Settings className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className={cn("text-base font-bold", form.watch("isActive") ? "text-green-900" : "text-gray-900")}>
                          Affiliate Program Status
                        </h4>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" {...form.register("isActive")} />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>
                      <p className={cn("text-sm mt-1", form.watch("isActive") ? "text-green-700" : "text-gray-500")}>
                        {form.watch("isActive") 
                          ? "Active. Users can register and earn." 
                          : "Disabled. Dashboard hidden from users."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-full h-px bg-gray-100" />

                <SectionHeader title="Brand Identity" description="How the program appears to your users." />
                
                <div className="grid gap-6">
                  <InputField 
                    name="programName" 
                    label="Program Name" 
                    placeholder="e.g. GoBike Partner Program" 
                  />
                  <InputField 
                    name="termsUrl" 
                    label="Terms URL" 
                    placeholder="https://gobike.au/terms" 
                    type="url"
                  />
                </div>
              </>
            )}

            {/* === TAB 2: COMMISSIONS === */}
            {activeTab === "commissions" && (
              <>
                <SectionHeader title="Calculation Logic" />
                <div className="grid gap-4">
                  <ToggleField name="excludeShipping" label="Exclude Shipping" description="Deduct shipping from total." />
                  <ToggleField name="excludeTax" label="Exclude Taxes" description="Deduct tax from total." />
                  <ToggleField name="zeroValueReferrals" label="Track Zero Value" description="Record free orders." />
                </div>
                <div className="w-full h-px bg-gray-100 my-4" />
                <SectionHeader title="Coupon Behavior" />
                <ToggleField name="autoApplyCoupon" label="Auto-Apply Coupon" description="Apply coupon on link click." />
              </>
            )}

            {/* === TAB 3: LINKS === */}
            {activeTab === "links" && (
              <>
                <SectionHeader title="Link Structure" />
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl mb-6">
                  <InputField name="referralParam" label="Query Parameter" placeholder="ref" prefix="?" />
                </div>
                <div className="w-full h-px bg-gray-100 my-2" />
                <SectionHeader title="Custom Slugs" />
                <ToggleField name="customSlugsEnabled" label="Enable Custom Slugs" />
                {form.watch("customSlugsEnabled") && (
                  <div className="ml-8 mt-4 space-y-4">
                     <InputField name="slugLimit" label="Max Slugs" type="number" />
                     <ToggleField name="autoCreateSlug" label="Auto-Create on Signup" />
                  </div>
                )}
              </>
            )}

            {/* === TAB 4: FRAUD & TRACKING === */}
            {activeTab === "fraud" && (
              <>
                <SectionHeader title="Cookies" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField name="cookieDuration" label="Cookie Days" type="number" suffix="Days" />
                </div>
                <div className="w-full h-px bg-gray-100 my-4" />
                <SectionHeader title="Lifetime Commissions" />
                <ToggleField name="isLifetimeLinkOnPurchase" label="Enable Lifetime Linking" />
                {form.watch("isLifetimeLinkOnPurchase") && (
                   <div className="ml-8 mt-4">
                      <InputField name="lifetimeDuration" label="Link Duration (Days)" type="number" helperText="Empty = Forever" />
                   </div>
                )}
                <div className="w-full h-px bg-gray-100 my-4" />
                <ToggleField name="allowSelfReferral" label="Allow Self-Referral" />
              </>
            )}

            {/* === TAB 5: PAYOUTS === */}
            {activeTab === "payouts" && (
              <>
                <SectionHeader title="Withdrawal Rules" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField name="minimumPayout" label="Min Payout" type="number" prefix="$" />
                  <InputField name="holdingPeriod" label="Holding Period" type="number" suffix="Days" />
                </div>
                <div className="w-full h-px bg-gray-100 my-4" />
                <label className="text-sm font-semibold text-gray-700">Methods</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                  {["BANK_TRANSFER", "PAYPAL", "STORE_CREDIT"].map((method) => (
                    <label key={method} className="relative flex items-center justify-center gap-2 border px-4 py-3 rounded-xl bg-white cursor-pointer hover:border-black transition-all select-none group">
                      <input type="checkbox" value={method} {...form.register("payoutMethods")} className="peer sr-only" />
                      <div className="absolute inset-0 border-2 border-transparent peer-checked:border-black rounded-xl"></div>
                      <span className="text-sm font-medium capitalize">{method.replace("_", " ").toLowerCase()}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-8">
                  <ToggleField name="autoApprovePayout" label="Auto-Approve Requests" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t flex justify-between items-center z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <p className="text-xs text-gray-400 hidden sm:block">Configuration applies globally.</p>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 bg-black text-white px-8 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-800 disabled:opacity-50 transition-all shadow-lg active:scale-95"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Configuration
          </button>
        </div>

      </div>
    </form>
  );
}