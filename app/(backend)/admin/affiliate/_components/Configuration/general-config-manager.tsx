// File: app/(backend)/admin/affiliate/_components/Configuration/general-config-manager.tsx

"use client";

import { useState, useTransition } from "react";
import { useForm, type DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { affiliateGeneralSchema } from "@/app/actions/backend/affiliate/schemas";
import { updateGeneralSettingsAction } from "@/app/actions/backend/affiliate/_services/general-config-service";
import { AffiliateGeneralSettings } from "@/app/actions/backend/affiliate/types";
import {
  Loader2, Save, Settings, Link as LinkIcon, DollarSign,
  Shield, Clock, Percent, AlertTriangle, CheckCircle,
  Users, ShieldCheck, Zap, Globe, Activity, RefreshCw,
  Lock, Bell, ChevronsRight, XCircle, Info
} from "lucide-react";

// ==============================================================================
// TYPES — Zod v4: use z.input for form fields, z.infer for submit output
// ==============================================================================
type FormInput  = z.input<typeof affiliateGeneralSchema>;
type FormValues = z.infer<typeof affiliateGeneralSchema>;

type Tab = "program" | "commission" | "tracking" | "payouts" | "compliance" | "automation" | "integrations";

interface Props {
  initialData: AffiliateGeneralSettings;
}

// ==============================================================================
// SHARED PRIMITIVES
// ==============================================================================

function Metabox({ title, icon: Icon, danger, children }: {
  title: string;
  icon: React.ElementType;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("bg-white border shadow-sm", danger ? "border-[#d63638]/40" : "border-[#c3c4c7]")}>
      <div className={cn("px-4 py-3 border-b flex items-center gap-2", danger ? "bg-[#fcf0f1] border-[#d63638]/30" : "bg-[#f6f7f7] border-[#c3c4c7]")}>
        <Icon className={cn("w-4 h-4", danger ? "text-[#d63638]" : "text-[#2271b1]")} />
        <h3 className={cn("text-[13px] font-semibold m-0", danger ? "text-[#d63638]" : "text-[#1d2327]")}>{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function FieldWrap({ label, hint, error, children }: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[12px] font-semibold text-[#1d2327] block">{label}</label>
      {children}
      {hint && !error && <p className="text-[11px] text-[#8c8f94] m-0">{hint}</p>}
      {error && (
        <p className="text-[11px] text-[#d63638] font-medium flex items-center gap-1 m-0">
          <AlertTriangle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full border border-[#8c8f94] rounded-sm px-2.5 py-1.5 text-[13px] bg-white",
        "focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none transition-colors",
        className
      )}
      {...props}
    />
  );
}

function Toggle({ label, description, danger, ...props }: {
  label: string;
  description?: string;
  danger?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn(
      "flex items-center justify-between px-3 py-2.5 border rounded-sm transition-colors",
      danger ? "border-[#d63638]/30 bg-[#fcf0f1]" : "border-[#c3c4c7] bg-white hover:bg-[#f6f7f7]"
    )}>
      <div className="flex-1 pr-4 min-w-0">
        <p className="text-[13px] font-semibold text-[#1d2327] m-0">{label}</p>
        {description && <p className="text-[11px] text-[#8c8f94] m-0 mt-0.5">{description}</p>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer shrink-0">
        <input type="checkbox" className="sr-only peer" {...props} />
        <div className={cn(
          "w-10 h-5 rounded-full transition-colors relative",
          "after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all",
          "peer-checked:after:translate-x-5",
          danger ? "bg-[#e8b8b8] peer-checked:bg-[#d63638]" : "bg-[#c3c4c7] peer-checked:bg-[#2271b1]"
        )} />
      </label>
    </div>
  );
}

function SegmentedControl({ value, onChange, options }: {
  value: string | undefined;
  onChange: (v: string) => void;
  options: { value: string; label: string; icon?: React.ElementType }[];
}) {
  return (
    <div className="inline-flex border border-[#c3c4c7] rounded-sm overflow-hidden bg-[#f6f7f7]">
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-semibold transition-colors",
              isActive ? "bg-[#2271b1] text-white" : "text-[#50575e] hover:bg-[#e8e8e8]"
            )}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "program",      label: "Program",      icon: Settings   },
  { id: "commission",   label: "Commission",   icon: DollarSign },
  { id: "tracking",     label: "Tracking",     icon: Activity   },
  { id: "payouts",      label: "Payouts",      icon: Clock      },
  { id: "compliance",   label: "Compliance",   icon: ShieldCheck},
  { id: "automation",   label: "Automation",   icon: Zap        },
  { id: "integrations", label: "Integrations", icon: Globe      },
];

// ==============================================================================
// MAIN COMPONENT
// ==============================================================================

export default function AffiliateGeneralConfigForm({ initialData }: Props) {
  const { symbol } = useGlobalStore();
  const currency = symbol || "$";
  const [isPending, startTransition] = useTransition();
  const [savingTab, setSavingTab] = useState<Tab | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("program");

  // Zod v4: FormInput = input type (optionals for defaults), FormValues = output type (all required)
  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(affiliateGeneralSchema),
    defaultValues: initialData as DefaultValues<FormInput>,
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form;

  const onSubmit = (tab: Tab) => (data: FormValues) => {
    setSavingTab(tab);
    startTransition(async () => {
      try {
        const result = await updateGeneralSettingsAction(data);
        if (result.success) toast.success(result.message);
        else toast.error(result.message);
      } finally {
        setSavingTab(null);
      }
    });
  };

  // Per-tab save button
  function SaveBar({ tab, label }: { tab: Tab; label: string }) {
    const isSaving = savingTab === tab && isPending;
    return (
      <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-[#f0f0f1]">
        <button
          type="button"
          onClick={() => form.reset(initialData as DefaultValues<FormInput>)}
          className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-semibold text-[#50575e] border border-[#c3c4c7] rounded-sm hover:bg-[#f6f7f7] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Discard
        </button>
        <button
          type="button"
          onClick={() => handleSubmit(onSubmit(tab))()}
          disabled={isPending}
          className="flex items-center gap-2 bg-[#2271b1] text-white px-5 py-1.5 rounded-sm text-[13px] font-semibold hover:bg-[#135e96] disabled:opacity-50 transition-colors"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save {label} Settings
        </button>
      </div>
    );
  }

  // ============================================================
  // TAB 1: PROGRAM
  // ============================================================
  const ProgramTab = () => (
    <div className="space-y-4">
      {/* Status Banner */}
      <div className={cn(
        "flex items-center justify-between px-5 py-4 border-l-4 transition-all",
        watch("isActive")
          ? "bg-[#f0faf0] border-[#00a32a]"
          : "bg-[#f0f0f1] border-[#8c8f94]"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn("w-9 h-9 rounded-full flex items-center justify-center",
            watch("isActive") ? "bg-[#00a32a]/20" : "bg-[#8c8f94]/20"
          )}>
            {watch("isActive")
              ? <CheckCircle className="w-5 h-5 text-[#00a32a]" />
              : <XCircle className="w-5 h-5 text-[#8c8f94]" />}
          </div>
          <div>
            <p className="text-[14px] font-bold text-[#1d2327] m-0">
              {watch("isActive") ? "Affiliate Program is LIVE" : "Affiliate Program is DISABLED"}
            </p>
            <p className="text-[12px] text-[#50575e] m-0">
              {watch("isActive")
                ? "Tracking active. Commissions are being recorded."
                : "No clicks, referrals, or commissions will be tracked."}
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" {...register("isActive")} />
          <div className="w-12 h-6 rounded-full bg-[#c3c4c7] peer-checked:bg-[#00a32a] relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-6" />
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Metabox title="Brand Identity" icon={Settings}>
          <div className="space-y-4">
            <FieldWrap label="Program Name" hint="Displayed on the affiliate dashboard." error={errors.programName?.message}>
              <Input placeholder="e.g. GoBike Partner Program" {...register("programName")} />
            </FieldWrap>
            <FieldWrap label="Terms & Conditions URL" hint="Affiliates must accept this on signup." error={errors.termsUrl?.message}>
              <div className="relative">
                <LinkIcon className="absolute left-2.5 top-2 w-3.5 h-3.5 text-[#8c8f94]" />
                <Input placeholder="https://example.com/affiliate-terms" className="pl-7" {...register("termsUrl")} />
              </div>
            </FieldWrap>
          </div>
        </Metabox>

        <Metabox title="Registration" icon={Users}>
          <div className="space-y-3">
            <Toggle label="Open Registration" description="Allow new users to sign up as affiliates." {...register("registrationEnabled")} />
            <Toggle label="Auto-Approve Applicants" description="New affiliates are immediately ACTIVE (skip review)." danger={!!watch("autoApprove")} {...register("autoApprove")} />
            <Toggle label="Require Terms Acceptance" description="Block registration until user checks the terms checkbox." {...register("requireTermsAccept")} />
            <Toggle label="Welcome Email on Approval" description="Send a welcome email when an affiliate is approved." {...register("welcomeEmailEnabled")} />
            <div className="pt-1 border-t border-[#f0f0f1]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[12px] font-semibold text-[#1d2327] m-0">Max Affiliates Limit</p>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={watch("maxAffiliatesLimit") != null} onChange={(e) => setValue("maxAffiliatesLimit", e.target.checked ? 100 : null)} className="w-3.5 h-3.5 accent-[#2271b1]" />
                  <span className="text-[11px] text-[#50575e]">Enable limit</span>
                </label>
              </div>
              {watch("maxAffiliatesLimit") != null ? (
                <div className="relative">
                  <Input type="number" min={1} placeholder="e.g. 500" value={watch("maxAffiliatesLimit") as number} onChange={(e) => setValue("maxAffiliatesLimit", e.target.value ? Number(e.target.value) : null)} />
                  <span className="absolute right-2.5 top-2 text-[11px] text-[#8c8f94]">affiliates</span>
                </div>
              ) : (
                <p className="text-[12px] text-[#8c8f94] italic m-0">Unlimited — no cap on total affiliates.</p>
              )}
            </div>
          </div>
        </Metabox>
      </div>
      <SaveBar tab="program" label="Program" />
    </div>
  );

  // ============================================================
  // TAB 2: COMMISSION
  // ============================================================
  const CommissionTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Metabox title="Default Commission Rate" icon={DollarSign}>
          <div className="space-y-4">
            <div>
              <label className="text-[12px] font-semibold text-[#1d2327] block mb-2">Commission Type</label>
              <SegmentedControl
                value={watch("commissionType")}
                onChange={(v) => setValue("commissionType", v as "PERCENTAGE" | "FIXED")}
                options={[
                  { value: "PERCENTAGE", label: "Percentage", icon: Percent },
                  { value: "FIXED",      label: "Fixed Amount", icon: DollarSign },
                ]}
              />
            </div>
            <FieldWrap label={watch("commissionType") === "PERCENTAGE" ? "Rate (%)" : `Amount (${currency})`} hint="Base rate for all affiliates not in a specific tier." error={errors.commissionRate?.message}>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-[13px] text-[#50575e] font-medium">{watch("commissionType") === "PERCENTAGE" ? "%" : currency}</span>
                <Input type="number" step="0.01" min="0" className="pl-7" {...register("commissionRate")} />
              </div>
            </FieldWrap>
            <div className="border-t border-[#f0f0f1] pt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[12px] font-semibold text-[#1d2327] m-0">Commission Cap (per order)</p>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={watch("maxCommissionCap") != null} onChange={(e) => setValue("maxCommissionCap", e.target.checked ? 100 : null)} className="w-3.5 h-3.5 accent-[#2271b1]" />
                  <span className="text-[11px] text-[#50575e]">Enable cap</span>
                </label>
              </div>
              {watch("maxCommissionCap") != null ? (
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-[13px] text-[#50575e]">{currency}</span>
                  <Input type="number" min={0} step="0.01" className="pl-7" value={watch("maxCommissionCap") as number} onChange={(e) => setValue("maxCommissionCap", e.target.value ? Number(e.target.value) : null)} />
                </div>
              ) : (
                <p className="text-[12px] text-[#8c8f94] italic m-0">No cap — commission on full order value.</p>
              )}
            </div>
          </div>
        </Metabox>

        <Metabox title="Calculation Rules" icon={Settings}>
          <div className="space-y-3">
            <Toggle label="Exclude Shipping Cost" description="Calculate commission on product subtotal only." {...register("excludeShipping")} />
            <Toggle label="Exclude Taxes" description="Deduct tax from order total before calculating." {...register("excludeTax")} />
            <Toggle label="Track Zero-Value Orders" description={`Record referrals even when commission = ${currency}0.`} {...register("zeroValueReferrals")} />
            <Toggle label="Auto-Apply Affiliate Coupon" description="Automatically apply the affiliate's coupon on link click." {...register("autoApplyCoupon")} />
          </div>
        </Metabox>

        <Metabox title="Profit Margin Protection" icon={Shield}>
          <div className="space-y-3">
            <Toggle label="Enable Profit Margin Guard" description="Block commission if order profit margin is too low." {...register("enableProfitMarginProtection")} />
            {watch("enableProfitMarginProtection") && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                <FieldWrap label="Minimum Profit Margin" hint="Commission is voided if profit falls below this %." error={errors.minProfitMargin?.message}>
                  <div className="relative">
                    <Input type="number" min={0} max={100} className="pr-7" {...register("minProfitMargin")} />
                    <span className="absolute right-2.5 top-2 text-[11px] text-[#8c8f94]">%</span>
                  </div>
                </FieldWrap>
              </div>
            )}
            {!watch("enableProfitMarginProtection") && (
              <div className="flex items-start gap-2 p-3 bg-[#f6f7f7] border border-[#c3c4c7] rounded-sm">
                <Info className="w-4 h-4 text-[#50575e] shrink-0 mt-0.5" />
                <p className="text-[12px] text-[#50575e] m-0">When enabled, the system checks product cost vs revenue before approving commission.</p>
              </div>
            )}
          </div>
        </Metabox>

        <Metabox title="First Referral Bonus" icon={Zap}>
          <div className="space-y-3">
            <Toggle label="Enable First-Referral Bonus" description="Pay an extra bonus when an affiliate earns their very first commission." {...register("firstReferralBonus")} />
            {watch("firstReferralBonus") && (
              <div className="animate-in fade-in duration-200 space-y-3">
                <div>
                  <label className="text-[12px] font-semibold text-[#1d2327] block mb-2">Bonus Type</label>
                  <SegmentedControl value={watch("firstReferralBonusType")} onChange={(v) => setValue("firstReferralBonusType", v as "PERCENTAGE" | "FIXED")} options={[{ value: "PERCENTAGE", label: "Percentage" }, { value: "FIXED", label: "Fixed" }]} />
                </div>
                <FieldWrap label="Bonus Amount" error={errors.firstReferralBonusAmount?.message}>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-[13px] text-[#50575e]">{watch("firstReferralBonusType") === "PERCENTAGE" ? "%" : currency}</span>
                    <Input type="number" min={0} step="0.01" className="pl-7" {...register("firstReferralBonusAmount")} />
                  </div>
                </FieldWrap>
              </div>
            )}
          </div>
        </Metabox>
      </div>
      <SaveBar tab="commission" label="Commission" />
    </div>
  );

  // ============================================================
  // TAB 3: TRACKING
  // ============================================================
  const TrackingTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Metabox title="Referral Link Configuration" icon={LinkIcon}>
          <div className="space-y-4">
            <FieldWrap label="URL Query Parameter" hint={`Links will look like: example.com?${watch("referralParam") || "ref"}=abc123`} error={errors.referralParam?.message}>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-[12px] text-[#8c8f94] font-mono">?</span>
                <Input className="pl-5 font-mono" placeholder="ref" {...register("referralParam")} />
                <span className="absolute right-2.5 top-2 text-[12px] text-[#8c8f94] font-mono">=slug</span>
              </div>
            </FieldWrap>
            <div className="border-t border-[#f0f0f1] pt-3 space-y-3">
              <Toggle label="Allow Custom Slugs" description="Affiliates can set named links like /ref/my-brand" {...register("customSlugsEnabled")} />
              {watch("customSlugsEnabled") && (
                <div className="animate-in fade-in duration-200 space-y-3 pl-2 border-l-2 border-[#2271b1]/30">
                  <FieldWrap label="Max Slugs per Affiliate" error={errors.slugLimit?.message}>
                    <Input type="number" min={1} max={100} {...register("slugLimit")} />
                  </FieldWrap>
                  <Toggle label="Auto-Generate Slug on Signup" description="Create a default slug automatically when affiliate registers." {...register("autoCreateSlug")} />
                </div>
              )}
            </div>
          </div>
        </Metabox>

        <Metabox title="Attribution Model" icon={Activity}>
          <div className="space-y-4">
            <div>
              <label className="text-[12px] font-semibold text-[#1d2327] block mb-2">Attribution Model</label>
              <SegmentedControl value={watch("attributionModel")} onChange={(v) => setValue("attributionModel", v as "LAST_CLICK" | "FIRST_CLICK")} options={[{ value: "LAST_CLICK", label: "Last Click" }, { value: "FIRST_CLICK", label: "First Click" }]} />
              <p className="text-[11px] text-[#8c8f94] mt-1.5 m-0">
                {watch("attributionModel") === "LAST_CLICK"
                  ? "Credit goes to the last affiliate link the customer clicked before purchase."
                  : "Credit goes to the very first affiliate who introduced the customer."}
              </p>
            </div>
            <FieldWrap label="Cookie Duration" hint="How long the referral cookie stays active in the browser." error={errors.cookieDuration?.message}>
              <div className="relative">
                <Input type="number" min={1} max={365} {...register("cookieDuration")} />
                <span className="absolute right-2.5 top-2 text-[11px] text-[#8c8f94]">days</span>
              </div>
            </FieldWrap>
          </div>
        </Metabox>

        <Metabox title="Lifetime Attribution" icon={Lock}>
          <div className="space-y-3">
            <Toggle label="Lifetime Link on First Purchase" description="Permanently lock a customer to the affiliate after their first order." {...register("isLifetimeLinkOnPurchase")} />
            {watch("isLifetimeLinkOnPurchase") && (
              <div className="animate-in fade-in duration-200 space-y-3 pl-2 border-l-2 border-[#2271b1]/30">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-semibold text-[#1d2327] m-0">Lifetime Duration</p>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={watch("lifetimeDuration") == null} onChange={(e) => setValue("lifetimeDuration", e.target.checked ? null : 365)} className="w-3.5 h-3.5 accent-[#2271b1]" />
                    <span className="text-[11px] text-[#50575e]">Forever</span>
                  </label>
                </div>
                {watch("lifetimeDuration") != null ? (
                  <div className="relative">
                    <Input type="number" min={1} value={watch("lifetimeDuration") as number} onChange={(e) => setValue("lifetimeDuration", e.target.value ? Number(e.target.value) : null)} />
                    <span className="absolute right-2.5 top-2 text-[11px] text-[#8c8f94]">days</span>
                  </div>
                ) : (
                  <p className="text-[12px] text-[#8c8f94] italic m-0">Customer permanently linked — no expiry.</p>
                )}
              </div>
            )}
          </div>
        </Metabox>

        <Metabox title="Order Tracking Rules" icon={Settings}>
          <div className="space-y-3">
            <Toggle label="Track Cancelled Orders" description="Keep commission record even when order is cancelled." {...register("trackCancelledOrders")} />
            <Toggle label="Track Refunded Orders" description="Keep commission record even when order is refunded." {...register("trackRefundedOrders")} />
            <Toggle label="Allow Self-Referral" description="Affiliates can earn commission on their own purchases." danger={!!watch("allowSelfReferral")} {...register("allowSelfReferral")} />
          </div>
        </Metabox>
      </div>
      <SaveBar tab="tracking" label="Tracking" />
    </div>
  );

  // ============================================================
  // TAB 4: PAYOUTS
  // ============================================================
  const PayoutsTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Metabox title="Withdrawal Rules" icon={Clock}>
          <div className="space-y-4">
            <FieldWrap label={`Minimum Withdrawal Amount (${currency})`} hint="Affiliate must have at least this much before requesting payout." error={errors.minimumPayout?.message}>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-[13px] text-[#50575e]">{currency}</span>
                <Input type="number" min={1} step="0.01" className="pl-7" {...register("minimumPayout")} />
              </div>
            </FieldWrap>
            <FieldWrap label="Holding Period" hint="Days to wait after order before commission becomes payable (covers refunds)." error={errors.holdingPeriod?.message}>
              <div className="relative">
                <Input type="number" min={0} max={180} {...register("holdingPeriod")} />
                <span className="absolute right-2.5 top-2 text-[11px] text-[#8c8f94]">days</span>
              </div>
            </FieldWrap>
          </div>
        </Metabox>

        <Metabox title="Allowed Payment Methods" icon={DollarSign}>
          <div className="space-y-2">
            {[
              { value: "BANK_TRANSFER", label: "Bank Transfer",  desc: "Manual wire transfer" },
              { value: "PAYPAL",        label: "PayPal",         desc: "Instant via PayPal email" },
              { value: "STORE_CREDIT",  label: "Store Credit",   desc: "Added to wallet balance" },
            ].map((method) => {
              const current = (watch("payoutMethods") as string[] | undefined) || [];
              const isChecked = current.includes(method.value);
              return (
                <label key={method.value} className={cn("flex items-center gap-3 px-3 py-2.5 border rounded-sm cursor-pointer transition-colors", isChecked ? "border-[#2271b1] bg-[#f0f6fb]" : "border-[#c3c4c7] bg-white hover:bg-[#f6f7f7]")}>
                  <input type="checkbox" checked={isChecked} onChange={(e) => { const updated = e.target.checked ? [...current, method.value] : current.filter((m) => m !== method.value); setValue("payoutMethods", updated); }} className="w-4 h-4 accent-[#2271b1]" />
                  <div>
                    <p className="text-[13px] font-semibold text-[#1d2327] m-0">{method.label}</p>
                    <p className="text-[11px] text-[#8c8f94] m-0">{method.desc}</p>
                  </div>
                </label>
              );
            })}
            {errors.payoutMethods && <p className="text-[11px] text-[#d63638] font-medium flex items-center gap-1 m-0"><AlertTriangle className="w-3 h-3" /> {errors.payoutMethods.message?.toString()}</p>}
          </div>
        </Metabox>

        <Metabox title="Payout Approval" icon={Shield} danger={!!watch("autoApprovePayout")}>
          <div className="space-y-3">
            <Toggle label="Auto-Approve Payouts" description="Skip manual review — payouts are processed automatically. HIGH RISK." danger={!!watch("autoApprovePayout")} {...register("autoApprovePayout")} />
            <Toggle label="Require KYC for Payout" description="Affiliate must have VERIFIED KYC status before any payout is released." {...register("requireKycForPayout")} />
            {watch("autoApprovePayout") && (
              <div className="flex items-start gap-2 p-3 bg-[#fcf0f1] border border-[#d63638]/30 rounded-sm">
                <AlertTriangle className="w-4 h-4 text-[#d63638] shrink-0 mt-0.5" />
                <p className="text-[12px] text-[#d63638] m-0">Auto-approve bypasses fraud checks and manual review. Only enable if all risk controls are in place.</p>
              </div>
            )}
          </div>
        </Metabox>
      </div>
      <SaveBar tab="payouts" label="Payout" />
    </div>
  );

  // ============================================================
  // TAB 5: COMPLIANCE
  // ============================================================
  const ComplianceTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Metabox title="KYC Requirements" icon={ShieldCheck}>
          <div className="space-y-3">
            <p className="text-[12px] text-[#50575e] m-0">Select which documents affiliates must submit for KYC verification.</p>
            {[
              { value: "NATIONAL_ID",    label: "National ID",     desc: "Government-issued ID card" },
              { value: "PASSPORT",       label: "Passport",        desc: "Valid travel passport" },
              { value: "DRIVING_LICENSE",label: "Driving License", desc: "Current driver's license" },
              { value: "TAX_FORM",       label: "Tax Form",        desc: "W-9, W-8BEN or equivalent" },
            ].map((doc) => {
              const current = (watch("kycRequiredDocuments") as string[] | undefined) || [];
              const isChecked = current.includes(doc.value);
              return (
                <label key={doc.value} className={cn("flex items-center gap-3 px-3 py-2.5 border rounded-sm cursor-pointer transition-colors", isChecked ? "border-[#2271b1] bg-[#f0f6fb]" : "border-[#c3c4c7] bg-white hover:bg-[#f6f7f7]")}>
                  <input type="checkbox" checked={isChecked} onChange={(e) => { const updated = e.target.checked ? [...current, doc.value] : current.filter((d) => d !== doc.value); setValue("kycRequiredDocuments", updated); }} className="w-4 h-4 accent-[#2271b1]" />
                  <div>
                    <p className="text-[13px] font-semibold text-[#1d2327] m-0">{doc.label}</p>
                    <p className="text-[11px] text-[#8c8f94] m-0">{doc.desc}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </Metabox>

        <Metabox title="Tax Compliance" icon={Shield}>
          <div className="space-y-3">
            <Toggle label="Require Tax Form" description="Block payouts until the affiliate submits a tax form." {...register("taxFormRequired")} />
            {watch("taxFormRequired") && (
              <div className="animate-in fade-in duration-200">
                <FieldWrap label="Tax Form Threshold" hint={`Affiliates earning over ${currency} this amount must submit a tax form.`} error={errors.taxFormThreshold?.message}>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-[13px] text-[#50575e]">{currency}</span>
                    <Input type="number" min={1} step="1" className="pl-7" {...register("taxFormThreshold")} />
                    <span className="absolute right-2.5 top-2 text-[11px] text-[#8c8f94]">per year</span>
                  </div>
                </FieldWrap>
              </div>
            )}
            <div className="flex items-start gap-2 p-3 bg-[#f6f7f7] border border-[#c3c4c7] rounded-sm">
              <Info className="w-4 h-4 text-[#50575e] shrink-0 mt-0.5" />
              <p className="text-[12px] text-[#50575e] m-0">In most countries, affiliates earning over a certain threshold must declare income. Set this to match your local tax law (e.g. US IRS $600 rule).</p>
            </div>
          </div>
        </Metabox>
      </div>
      <SaveBar tab="compliance" label="Compliance" />
    </div>
  );

  // ============================================================
  // TAB 6: AUTOMATION
  // ============================================================
  const AutomationTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Metabox title="Tier Automation" icon={Zap}>
          <div className="space-y-3">
            <Toggle label="Auto-Upgrade Tiers" description="Automatically promote affiliates when they reach the next tier's sales target." {...register("tierAutoUpgrade")} />
            {watch("tierAutoUpgrade") && (
              <div className="animate-in fade-in duration-200">
                <label className="text-[12px] font-semibold text-[#1d2327] block mb-2">Evaluation Frequency</label>
                <SegmentedControl value={watch("tierEvaluationFrequency")} onChange={(v) => setValue("tierEvaluationFrequency", v as "DAILY" | "WEEKLY" | "MONTHLY")} options={[{ value: "DAILY", label: "Daily" }, { value: "WEEKLY", label: "Weekly" }, { value: "MONTHLY", label: "Monthly" }]} />
                <p className="text-[11px] text-[#8c8f94] mt-1.5 m-0">How often the system checks and upgrades affiliate tiers.</p>
              </div>
            )}
            {!watch("tierAutoUpgrade") && (
              <div className="flex items-start gap-2 p-3 bg-[#f6f7f7] border border-[#c3c4c7] rounded-sm">
                <Info className="w-4 h-4 text-[#50575e] shrink-0 mt-0.5" />
                <p className="text-[12px] text-[#50575e] m-0">When disabled, tier upgrades must be done manually from the Partners panel.</p>
              </div>
            )}
          </div>
        </Metabox>

        <Metabox title="Email Notifications" icon={Bell}>
          <div className="space-y-3">
            <p className="text-[12px] text-[#50575e] m-0">Control which automated emails affiliates receive.</p>
            <Toggle label="Welcome Email on Approval" description="Sent when a new affiliate is approved or auto-approved." {...register("welcomeEmailEnabled")} />
            <Toggle label="Commission Earned Email" description="Notify affiliate every time a new commission is recorded." {...register("commissionEmailEnabled")} />
            <Toggle label="Payout Processed Email" description="Notify affiliate when their payout is completed or rejected." {...register("payoutEmailEnabled")} />
          </div>
        </Metabox>
      </div>
      <SaveBar tab="automation" label="Automation" />
    </div>
  );

  // ============================================================
  // TAB 7: INTEGRATIONS
  // ============================================================
  const IntegrationsTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Metabox title="Conversion Postback (S2S)" icon={Globe}>
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 bg-[#f0f6fb] border border-[#2271b1]/30 rounded-sm">
              <Info className="w-4 h-4 text-[#2271b1] shrink-0 mt-0.5" />
              <p className="text-[12px] text-[#50575e] m-0">Server-to-server postback fires a request to your URL every time a conversion is recorded. Use with ad networks and tracking platforms.</p>
            </div>
            <FieldWrap label="Global Postback URL" hint="Use {affiliate_id}, {order_id}, {commission} as placeholders." error={errors.postbackGlobalUrl?.message}>
              <div className="relative">
                <Globe className="absolute left-2.5 top-2 w-3.5 h-3.5 text-[#8c8f94]" />
                <Input placeholder="https://track.example.com/postback?aff={affiliate_id}" className="pl-7 font-mono text-[12px]" {...register("postbackGlobalUrl")} />
              </div>
            </FieldWrap>
            <FieldWrap label="HMAC Secret Key" hint="Signs postback requests. Treat like a password." error={errors.postbackSecret?.message}>
              <div className="relative">
                <Lock className="absolute left-2.5 top-2 w-3.5 h-3.5 text-[#8c8f94]" />
                <Input type="password" placeholder={watch("postbackSecret") ? "••••••••••••" : "Generate or paste your secret key"} className="pl-7 pr-20 font-mono text-[12px]" {...register("postbackSecret")} />
                <button
                  type="button"
                  onClick={() => {
                    const secret = Array.from(crypto.getRandomValues(new Uint8Array(24))).map((b) => b.toString(16).padStart(2, "0")).join("");
                    setValue("postbackSecret", secret);
                    toast.success("New secret generated — click Save to apply.");
                  }}
                  className="absolute right-1 top-0.5 text-[11px] px-2 py-1 text-[#2271b1] hover:underline font-semibold"
                >
                  Generate
                </button>
              </div>
            </FieldWrap>
          </div>
        </Metabox>

        <Metabox title="Coming Soon" icon={ChevronsRight}>
          <div className="space-y-3">
            {[
              { label: "Zapier Webhook",     desc: "Trigger Zaps on commission events" },
              { label: "Slack Notifications", desc: "Post alerts to a Slack channel"    },
              { label: "Google Analytics 4", desc: "Push conversion events to GA4"      },
              { label: "Meta Pixel Events",  desc: "Fire purchase events on referral"   },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between px-3 py-2.5 border border-[#c3c4c7] bg-[#f6f7f7] rounded-sm opacity-60">
                <div>
                  <p className="text-[13px] font-semibold text-[#1d2327] m-0">{item.label}</p>
                  <p className="text-[11px] text-[#8c8f94] m-0">{item.desc}</p>
                </div>
                <span className="text-[10px] font-bold text-[#8c8f94] bg-white border border-[#c3c4c7] px-2 py-0.5 rounded-sm">SOON</span>
              </div>
            ))}
          </div>
        </Metabox>
      </div>
      <SaveBar tab="integrations" label="Integrations" />
    </div>
  );

  // ============================================================
  // RENDER
  // ============================================================
  const TAB_CONTENT: Record<Tab, React.ReactNode> = {
    program:      <ProgramTab />,
    commission:   <CommissionTab />,
    tracking:     <TrackingTab />,
    payouts:      <PayoutsTab />,
    compliance:   <ComplianceTab />,
    automation:   <AutomationTab />,
    integrations: <IntegrationsTab />,
  };

  return (
    <div className="w-full font-sans text-[#1d2327] pb-6">

      {/* === HEADER === */}
      <div className="bg-[#1d2327] px-5 py-4 flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-sm bg-[#2271b1]/20 flex items-center justify-center">
            <Settings className="w-5 h-5 text-[#2271b1]" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-white m-0 leading-tight">System Settings</h2>
            <p className="text-[12px] text-[#8c8f94] m-0 mt-0.5">Global configuration for the entire affiliate program</p>
          </div>
        </div>
        <span className={cn(
          "text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5",
          watch("isActive")
            ? "bg-[#00a32a]/20 text-[#00d23a] border border-[#00a32a]/30"
            : "bg-[#8c8f94]/20 text-[#8c8f94] border border-[#8c8f94]/30"
        )}>
          <span className={cn("w-1.5 h-1.5 rounded-full", watch("isActive") ? "bg-[#00a32a] animate-pulse" : "bg-[#8c8f94]")} />
          {watch("isActive") ? "Program Live" : "Program Off"}
        </span>
      </div>

      {/* === TABS === */}
      <div className="bg-white border border-[#c3c4c7] shadow-sm">
        <div className="border-b border-[#c3c4c7] flex overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-[13px] font-semibold border-b-2 whitespace-nowrap shrink-0 transition-colors",
                  isActive
                    ? "border-[#2271b1] text-[#2271b1] bg-[#f0f6fb]"
                    : "border-transparent text-[#50575e] hover:text-[#1d2327] hover:bg-[#f6f7f7]"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-5">
          {TAB_CONTENT[activeTab]}
        </div>
      </div>
    </div>
  );
}
