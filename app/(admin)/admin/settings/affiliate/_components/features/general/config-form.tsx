// File: app/(admin)/admin/settings/affiliate/_components/features/general/config-form.tsx

"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { 
  Loader2, 
  Save, 
  Settings, 
  Percent, 
  Link as LinkIcon, 
  ShieldAlert, 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle 
} from "lucide-react";
import { z } from "zod";

import { affiliateGeneralSchema } from "@/app/actions/admin/settings/affiliate/schemas";
import { updateGeneralSettings } from "@/app/actions/admin/settings/affiliate/mutations/update-config";
import { AffiliateGeneralSettings } from "@/app/actions/admin/settings/affiliate/types";
import { cn } from "@/lib/utils";

// Type inference
type FormValues = z.infer<typeof affiliateGeneralSchema>;

interface Props {
  initialData: AffiliateGeneralSettings;
}

// ----------------------------------------------------------------------
// UI CONSTANTS: TABS CONFIGURATION
// ----------------------------------------------------------------------
const SETTINGS_TABS = [
  { id: "general", label: "General", icon: Settings, description: "Program identity & terms" },
  { id: "commissions", label: "Commissions", icon: Percent, description: "Calculation logic & exclusions" },
  { id: "links", label: "Affiliate Links", icon: LinkIcon, description: "Slugs & parameters" },
  { id: "fraud", label: "Tracking & Fraud", icon: ShieldAlert, description: "Cookies, lifetime & risk" },
  { id: "payouts", label: "Payouts", icon: CreditCard, description: "Financial settings" },
] as const;

export default function AffiliateGeneralConfigForm({ initialData }: Props) {
  const [activeTab, setActiveTab] = useState<typeof SETTINGS_TABS[number]["id"]>("general");
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

  // Helper for Error Messages
  const ErrorMsg = ({ name }: { name: keyof FormValues }) => {
    const error = form.formState.errors[name];
    return error ? <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {error.message}</p> : null;
  };

  // ----------------------------------------------------------------------
  // REUSABLE UI COMPONENTS
  // ----------------------------------------------------------------------
  
  // 1. Section Toggle Switch
  const ToggleField = ({ name, label, description }: { name: keyof FormValues; label: string; description?: string }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-gray-50/50 transition-colors">
      <div className="flex-1 pr-4">
        <label htmlFor={name} className="text-sm font-medium text-gray-900 block cursor-pointer select-none">
          {label}
        </label>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input 
          type="checkbox" 
          id={name}
          className="sr-only peer" 
          {...form.register(name)} 
        />
        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-black/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-black"></div>
      </label>
    </div>
  );

  // 2. Input Field
  const InputField = ({ name, label, type = "text", placeholder, prefix, suffix }: { name: keyof FormValues; label: string; type?: string; placeholder?: string; prefix?: string; suffix?: string }) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-3 text-gray-500 text-sm">{prefix}</span>}
        <input
          type={type}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-md border border-gray-300 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all",
            prefix ? "pl-8 pr-3" : "px-3",
            suffix ? "pr-8" : ""
          )}
          {...form.register(name)}
        />
        {suffix && <span className="absolute right-3 text-gray-500 text-sm">{suffix}</span>}
      </div>
      <ErrorMsg name={name} />
    </div>
  );

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col lg:flex-row gap-8">
      
      {/* ------------------- LEFT SIDEBAR: NAVIGATION ------------------- */}
      <div className="w-full lg:w-64 flex-shrink-0 space-y-1">
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 text-left",
                isActive 
                  ? "bg-gray-100 text-black shadow-sm" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-black" : "text-gray-400")} />
              <div>
                <span className="block">{tab.label}</span>
                {/* <span className="text-[10px] font-normal opacity-70 hidden xl:block">{tab.description}</span> */}
              </div>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-black" />}
            </button>
          );
        })}

        {/* Global Save Button (Mobile only) */}
        <div className="lg:hidden pt-4">
           <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-black text-white px-4 py-3 rounded-lg font-medium text-sm disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* ------------------- RIGHT CONTENT: FORM SECTIONS ------------------- */}
      <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm p-6 lg:p-8 min-h-[500px]">
        
        {/* Header of Active Tab */}
        <div className="mb-6 pb-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">{SETTINGS_TABS.find(t => t.id === activeTab)?.label} Settings</h2>
          <p className="text-sm text-gray-500 mt-1">{SETTINGS_TABS.find(t => t.id === activeTab)?.description}</p>
        </div>

        <div className="space-y-6 max-w-3xl animate-in fade-in slide-in-from-bottom-2 duration-300" key={activeTab}>
          
          {/* === TAB 1: GENERAL === */}
          {activeTab === "general" && (
            <>
              {/* Master Switch */}
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 flex items-start gap-4">
                <div className="p-2 bg-blue-100 rounded-md text-blue-700">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-blue-900">Enable Affiliate Program</h4>
                  <p className="text-xs text-blue-700 mt-1 mb-3">
                    Toggle the entire affiliate system ON or OFF. Turning this off will hide the dashboard for users.
                  </p>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" {...form.register("isActive")} />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-blue-900">{form.watch("isActive") ? "System Active" : "System Disabled"}</span>
                  </label>
                </div>
              </div>

              <div className="h-px bg-gray-100 my-2" />

              <InputField 
                name="programName" 
                label="Program Name" 
                placeholder="GoBike Partner Program" 
                prefix="" 
              />
              
              <InputField 
                name="termsUrl" 
                label="Terms & Conditions URL" 
                placeholder="https://gobike.au/terms" 
                type="url"
              />
            </>
          )}

          {/* === TAB 2: COMMISSIONS === */}
          {activeTab === "commissions" && (
            <>
              <div className="grid gap-4">
                <ToggleField 
                  name="excludeShipping" 
                  label="Exclude Shipping" 
                  description="Deduct shipping costs from order total before calculating commission." 
                />
                <ToggleField 
                  name="excludeTax" 
                  label="Exclude Tax" 
                  description="Deduct taxes from order total before calculating commission." 
                />
                <ToggleField 
                  name="autoApplyCoupon" 
                  label="Auto Apply Coupon" 
                  description="Automatically apply the affiliate's coupon code at checkout when visitor arrives via link." 
                />
                <ToggleField 
                  name="zeroValueReferrals" 
                  label="Zero Value Referrals" 
                  description="Record referrals even if the order total is $0.00 (e.g. Free Trials)." 
                />
              </div>
            </>
          )}

          {/* === TAB 3: LINKS === */}
          {activeTab === "links" && (
            <>
              <InputField 
                name="referralParam" 
                label="Tracking Parameter" 
                placeholder="ref" 
                prefix="?=" 
                suffix="" 
              />
              <p className="text-xs text-gray-500 -mt-4">
                Example: <code>https://gobike.au/?{form.watch("referralParam")}=123</code>
              </p>

              <div className="h-px bg-gray-100 my-2" />

              <div className="grid gap-4">
                <ToggleField 
                  name="customSlugsEnabled" 
                  label="Enable Custom Slugs" 
                  description="Allow affiliates to create named links (e.g. /ref/john-doe)." 
                />
                
                {form.watch("customSlugsEnabled") && (
                  <div className="ml-8 p-4 border-l-2 border-gray-200 bg-gray-50 space-y-4">
                    <InputField 
                      name="slugLimit" 
                      label="Max Slugs per Affiliate" 
                      type="number"
                    />
                    <ToggleField 
                      name="autoCreateSlug" 
                      label="Auto-Create Slug" 
                      description="Automatically generate a slug from the user's name upon registration." 
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* === TAB 4: FRAUD & TRACKING === */}
          {activeTab === "fraud" && (
            <>
              <div className="grid grid-cols-2 gap-6">
                <InputField 
                  name="cookieDuration" 
                  label="Cookie Duration (Days)" 
                  type="number" 
                  suffix="Days"
                />
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100 text-xs text-yellow-800">
                  <p className="font-semibold mb-1">Note:</p>
                  If a customer clicks multiple affiliate links, the most recent click will be credited (Last Click Attribution).
                </div>
              </div>

              <div className="h-px bg-gray-100 my-2" />

              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Lifetime Commissions</h3>
              <div className="space-y-4">
                <ToggleField 
                  name="isLifetimeLinkOnPurchase" 
                  label="Link Customer on Purchase" 
                  description="Permanently link a customer to an affiliate after their first purchase." 
                />
                
                {form.watch("isLifetimeLinkOnPurchase") && (
                  <div className="ml-8">
                    <InputField 
                      name="lifetimeDuration" 
                      label="Duration (Days)" 
                      placeholder="Leave empty for Forever" 
                      type="number"
                    />
                    <p className="text-xs text-gray-500 mt-1">Set to 0 or leave empty for unlimited lifetime.</p>
                  </div>
                )}
              </div>

              <div className="h-px bg-gray-100 my-2" />

              <ToggleField 
                name="allowSelfReferral" 
                label="Allow Self-Referral" 
                description="If enabled, affiliates can earn commission on their own purchases. (Not recommended)" 
              />
            </>
          )}

          {/* === TAB 5: PAYOUTS === */}
          {activeTab === "payouts" && (
            <>
              <div className="grid grid-cols-2 gap-6">
                <InputField 
                  name="minimumPayout" 
                  label="Minimum Payout Amount" 
                  type="number" 
                  prefix="$"
                />
                <InputField 
                  name="holdingPeriod" 
                  label="Holding Period (Refund Buffer)" 
                  type="number" 
                  suffix="Days"
                />
              </div>

              <div className="space-y-2 mt-4">
                <label className="text-sm font-medium text-gray-700">Allowed Payout Methods</label>
                <div className="flex flex-wrap gap-3">
                  {["BANK_TRANSFER", "PAYPAL", "STORE_CREDIT"].map((method) => (
                    <label key={method} className="flex items-center gap-2 border px-3 py-2.5 rounded-md bg-white cursor-pointer hover:border-black transition-colors select-none">
                      <input
                        type="checkbox"
                        value={method}
                        {...form.register("payoutMethods")}
                        className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                      />
                      <span className="text-sm font-medium capitalize">{method.replace("_", " ").toLowerCase()}</span>
                    </label>
                  ))}
                </div>
                <ErrorMsg name="payoutMethods" />
              </div>

              <div className="mt-4">
                <ToggleField 
                  name="autoApprovePayout" 
                  label="Auto-Approve Payout Requests" 
                  description="Automatically mark payout requests as approved. (Requires manual payment processing)" 
                />
              </div>
            </>
          )}

        </div>

        {/* ------------------- FOOTER ACTIONS ------------------- */}
        <div className="mt-10 pt-6 border-t flex justify-between items-center">
          <p className="text-xs text-gray-400">
            Changes are applied globally immediately after saving.
          </p>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-800 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </button>
        </div>

      </div>
    </form>
  );
}