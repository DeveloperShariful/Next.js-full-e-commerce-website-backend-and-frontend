// File: app/(admin)/admin/settings/affiliate/_components/Configuration/general-config-manager.tsx

"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save, Settings, AlertTriangle, Link as LinkIcon, DollarSign, Shield, Clock, Network, Percent } from "lucide-react";
import { z } from "zod";

// ✅ Correct Import Path
import { affiliateGeneralSchema } from "@/app/actions/admin/settings/affiliate/schemas";
import { updateGeneralSettingsAction } from "@/app/actions/admin/settings/affiliate/_services/general-config-service";
import { AffiliateGeneralSettings } from "@/app/actions/admin/settings/affiliate/types";
import { cn } from "@/lib/utils";
import { useGlobalStore } from "@/app/providers/global-store-provider";

import MLMForm from "./mlm-form";

type FormValues = z.infer<typeof affiliateGeneralSchema>;

interface Props {
  initialData: AffiliateGeneralSettings;
  mlmInitialData: any;
}

export default function AffiliateGeneralConfigForm({ initialData, mlmInitialData }: Props) {
  const { symbol } = useGlobalStore(); // ✅ স্টোর থেকে সিম্বল আনুন
  const currency = symbol || " ";
  const [activeTab, setActiveTab] = useState<"GENERAL" | "MLM">("GENERAL");
  const [isPending, startTransition] = useTransition();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  const form = useForm<FormValues>({
    resolver: zodResolver(affiliateGeneralSchema) as any,
    defaultValues: initialData as any,
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      // ✅ Call Service Method
      const result = await updateGeneralSettingsAction(data);
      if (result.success) {
        toast.success("Settings updated successfully");
      } else {
        toast.error(result.message);
      }
    });
  };

  const SectionHeader = ({ title, description, icon: Icon }: { title: string; description?: string; icon: any }) => (
    <div className="mb-4 flex items-start gap-3 border-b border-gray-100 pb-3">
      <div className="p-2 bg-gray-50 rounded-lg border border-gray-100 text-gray-500">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
    </div>
  );
  
  const ToggleField = ({ name, label, description }: { name: keyof FormValues; label: string; description?: string }) => (
    <div className="flex items-start justify-between p-3 border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-all shadow-sm group">
      <div className="flex-1 pr-4">
        <label htmlFor={name} className="text-xs font-bold text-gray-900 cursor-pointer select-none group-hover:text-black">
          {label}
        </label>
        {description && <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{description}</p>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
        <input 
          type="checkbox" 
          id={name}
          className="sr-only peer" 
          {...form.register(name)} 
        />
        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-black"></div>
      </label>
    </div>
  );

  const InputField = ({ name, label, type = "text", placeholder, prefix, suffix, helperText }: { name: keyof FormValues; label: string; type?: string; placeholder?: string; prefix?: string; suffix?: string; helperText?: React.ReactNode }) => (
    <div className="space-y-1">
      <label className="text-xs font-bold text-gray-700 uppercase">{label}</label>
      <div className="relative flex items-center group">
        {prefix && <span className="absolute left-3 text-gray-500 text-sm font-medium">{prefix}</span>}
        <input
          type={type}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-md border border-gray-300 bg-white py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-all shadow-sm h-9",
            prefix ? "pl-8 pr-3" : "px-3",
            suffix ? "pr-12" : ""
          )}
          {...form.register(name)}
        />
        {suffix && <span className="absolute right-2 text-gray-500 text-[10px] font-medium bg-gray-50 border px-1.5 py-0.5 rounded">{suffix}</span>}
      </div>
      {helperText && <p className="text-[10px] text-gray-500">{helperText}</p>}
      {form.formState.errors[name] && (
        <p className="text-red-500 text-[10px] font-medium flex items-center gap-1 animate-in slide-in-from-left-1">
          <AlertTriangle className="w-3 h-3"/> {form.formState.errors[name]?.message}
        </p>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto pb-20">
        
        <div className="flex border-b border-gray-200 mb-6 space-x-6">
            <button 
                onClick={() => setActiveTab("GENERAL")}
                className={cn("pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2", activeTab === "GENERAL" ? "border-black text-black" : "border-transparent text-gray-500 hover:text-gray-800")}
            >
                <Settings className="w-4 h-4" /> General Config
            </button>
            <button 
                onClick={() => setActiveTab("MLM")}
                className={cn("pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2", activeTab === "MLM" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-800")}
            >
                <Network className="w-4 h-4" /> Network (MLM)
            </button>
        </div>

        {activeTab === "GENERAL" && (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 animate-in fade-in slide-in-from-left-2">
                
                <div className={cn(
                    "p-5 rounded-xl border transition-all duration-300 flex items-center justify-between",
                    form.watch("isActive") ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                )}>
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", form.watch("isActive") ? "bg-green-200 text-green-800" : "bg-gray-200 text-gray-500")}>
                            <Settings className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900">Program Status</h4>
                            <p className="text-xs text-gray-600">{form.watch("isActive") ? "Active & Running" : "Disabled"}</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" {...form.register("isActive")} />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <SectionHeader title="Brand Identity" description="How the program appears." icon={Settings} />
                            <div className="grid gap-4">
                                <InputField name="programName" label="Program Name" placeholder="e.g. GoBike Partner Program" />
                                <InputField name="termsUrl" label="Terms URL" placeholder={`${siteUrl}/terms`} type="url" />
                            </div>
                        </section>

                        <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <SectionHeader title="Commission Logic" description="Calculation rules." icon={DollarSign} />
                            <div className="grid gap-3">
                                <ToggleField name="excludeShipping" label="Exclude Shipping" description="Deduct shipping from total." />
                                <ToggleField name="excludeTax" label="Exclude Taxes" description="Deduct tax from total." />
                                <ToggleField name="zeroValueReferrals" label="Track Zero Value"  description={`Record orders with ${currency}0 total.`} />
                                <ToggleField name="autoApplyCoupon" label="Auto-Apply Coupon" description="Apply coupon on link click." />
                            </div>
                        </section>
                        <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
    <SectionHeader title="Commission Logic" description="Set the default earnings for all partners." icon={DollarSign} />
    
    <div className="space-y-6">
        
        {/* 🔥 NEW: Professional Commission Input UI */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <label className="text-xs font-bold text-gray-700 uppercase mb-3 block">Global Default Commission</label>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                
                {/* Type Toggle (Segmented Control) */}
                <div className="flex p-1 bg-gray-200 rounded-lg shrink-0">
                    <button
                        type="button"
                        onClick={() => form.setValue("commissionType", "PERCENTAGE")}
                        className={cn(
                            "px-4 py-2 text-xs font-bold rounded-md flex items-center gap-2 transition-all shadow-sm",
                            form.watch("commissionType") === "PERCENTAGE" 
                                ? "bg-white text-black ring-1 ring-black/5" 
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 shadow-none"
                        )}
                    >
                        <Percent className="w-3.5 h-3.5" /> Percentage
                    </button>
                    <button
                        type="button"
                        onClick={() => form.setValue("commissionType", "FIXED")}
                        className={cn(
                            "px-4 py-2 text-xs font-bold rounded-md flex items-center gap-2 transition-all shadow-sm",
                            form.watch("commissionType") === "FIXED" 
                                ? "bg-white text-black ring-1 ring-black/5" 
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 shadow-none"
                        )}
                    >
                        <DollarSign className="w-3.5 h-3.5" /> Fixed Amount
                    </button>
                </div>

                {/* Amount Input */}
                <div className="relative flex-1 w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm font-bold">
                            {form.watch("commissionType") === "FIXED" ? currency  : "%"}
                        </span>
                    </div>
                    <input
                        type="number"
                        step="0.01"
                        {...form.register("commissionRate")}
                        className="pl-8 pr-4 py-2.5 w-full border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-black/10 focus:border-black outline-none transition-all bg-white"
                        placeholder="10"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-xs text-gray-400">per order</span>
                    </div>
                </div>
            </div>
            <p className="text-[11px] text-gray-500 mt-3 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-orange-500"/>
                This rate applies to affiliates who are not in a specific Tier or Group.
            </p>
        </div>

        <div className="h-px bg-gray-100 w-full"></div>
    </div>
</section>
                    </div>

                    <div className="space-y-6">
                        <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <SectionHeader title="Link Structure" description="URL configuration." icon={LinkIcon} />
                            <div className="space-y-4">
                                <InputField name="referralParam" label="Query Parameter" placeholder="ref" prefix="?" />
                                
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                                    <ToggleField name="customSlugsEnabled" label="Allow Custom Slugs" />
                                    {form.watch("customSlugsEnabled") && (
                                        <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                                            <InputField name="slugLimit" label="Slugs per User" type="number" />
                                            <div className="flex items-end">
                                                <ToggleField name="autoCreateSlug" label="Auto-Create" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <SectionHeader title="Tracking & Fraud" description="Cookie & Fraud rules." icon={Shield} />
                            <div className="grid gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField name="cookieDuration" label="Cookie Duration" type="number" suffix="Days" />
                                    <InputField name="lifetimeDuration" label="Lifetime Link" type="number" suffix="Days" placeholder="∞" />
                                </div>
                                <ToggleField name="isLifetimeLinkOnPurchase" label="Lifetime Linking" description="Lock customer to affiliate after purchase." />
                                <ToggleField name="allowSelfReferral" label="Allow Self-Referral" description="Affiliates earn from own purchases." />
                            </div>
                        </section>

                        <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <SectionHeader title="Payouts" description="Withdrawal configuration." icon={Clock} />
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField name="minimumPayout" label="Min Payout" type="number" prefix={currency} />
                                    <InputField name="holdingPeriod" label="Holding Period" type="number" suffix="Days" />
                                </div>
                                
                                <div>
                                    <label className="text-xs font-bold text-gray-700 uppercase mb-2 block">Allowed Methods</label>
                                    <div className="flex flex-wrap gap-2">
                                    {["BANK_TRANSFER", "PAYPAL", "STORE_CREDIT"].map((method) => (
                                        <label key={method} className="relative flex items-center justify-center gap-1.5 border px-3 py-1.5 rounded-md bg-gray-50 cursor-pointer hover:border-black transition-all select-none has-[:checked]:bg-black has-[:checked]:text-white">
                                            <input type="checkbox" value={method} {...form.register("payoutMethods")} className="peer sr-only" />
                                            <span className="text-[10px] font-bold capitalize">{method.replace("_", " ").toLowerCase()}</span>
                                        </label>
                                    ))}
                                    </div>
                                </div>
                                
                                <ToggleField name="autoApprovePayout" label="Auto-Approve Payouts" description="Skip manual review step." />
                            </div>
                        </section>
                    </div>
                </div>

               
          
          <div className="text-xs text-gray-500">
              <p>Changes apply immediately across the system.</p>
          </div>

          <div className="flex items-center gap-3">
              <button 
                  type="button" 
                  onClick={() => window.location.reload()} // Optional Cancel Action
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
              >
                  Discard
              </button>

              <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-800 disabled:opacity-50 transition-all shadow-sm active:scale-95"
              >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
              </button>
           </div>
            </form>
        )}

        {activeTab === "MLM" && (
            <div className="animate-in fade-in slide-in-from-right-2">
                <MLMForm initialData={mlmInitialData} />
            </div>
        )}

    </div>
  );
}