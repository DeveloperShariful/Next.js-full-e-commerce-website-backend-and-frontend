"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Save, Loader2, CreditCard, ShieldCheck, UploadCloud, FileText,
  CheckCircle, Info, Percent, DollarSign, Clock, Cookie,
  Trophy, Zap, Building2, Wallet, ChevronRight, AlertCircle,
} from "lucide-react";
import { updateSettingsAction, uploadKYCAction } from "@/app/actions/frontend/affiliate/_services/settings-service";
import { cn } from "@/lib/utils";
import MediaPickerModal from "@/app/(backend)/admin/media/_components/MediaPickerModal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  userId: string;
  initialData: {
    paypalEmail?: string | null;
    bankDetails?: any;
    kyc?: { isVerified: boolean; documents: any[] };
  };
  config?: {
    commissionRate?: number;
    commissionType?: string;
    payoutMethods?: string[];
    minimumPayout?: number;
    holdingPeriod?: number;
    cookieDuration?: number;
    requireKycForPayout?: boolean;
    programName?: string;
    currency?: string;
  };
  tierProgress?: {
    currentTier?: { name: string; commissionRate: number; commissionType: string } | null;
    nextTier?: { name: string; commissionRate: number; commissionType: string; threshold: number } | null;
    sales?: number;
    progressPercent?: number;
  } | null;
  activeRules?: Array<{
    id: string;
    name: string;
    description?: string;
    type?: string;
    value?: number;
    conditions?: Record<string, unknown>;
    endDate?: Date | string | null;
  }>;
}

type Tab = "PROGRAM" | "PAYOUT" | "KYC";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(rate?: number, type?: string, currency = "$") {
  if (rate == null) return "—";
  return type === "FIXED" ? `${currency}${rate}` : `${rate}%`;
}

type ActiveRule = NonNullable<Props["activeRules"]>[0];

function ruleDescription(rule: ActiveRule, currency: string): string {
  const isBonus = rule.type === "BONUS_FIXED" || rule.type === "BONUS_PERCENTAGE";
  const isFixed = rule.type === "FIXED" || rule.type === "BONUS_FIXED";
  const reward = isFixed ? `${currency}${rule.value} fixed` : `${rule.value}%`;
  const conds = rule.conditions as Record<string, unknown> | undefined;
  const parts: string[] = [];
  if (conds?.minOrderAmount) parts.push(`order ≥ ${currency}${conds.minOrderAmount}`);
  if (conds?.maxOrderAmount) parts.push(`order ≤ ${currency}${conds.maxOrderAmount}`);
  if (conds?.customerType === "NEW") parts.push("new customers only");
  if (conds?.customerType === "RETURNING") parts.push("returning customers");
  const when = parts.length > 0 ? `When ${parts.join(" & ")}` : "Always";
  return isBonus
    ? `${when} → base rate + ${reward} bonus added`
    : `${when} → earn ${reward} (replaces base rate)`;
}

function KycBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    APPROVED: { label: "Verified", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    REJECTED: { label: "Rejected", color: "bg-red-100 text-red-700 border-red-200" },
  };
  const s = map[status] ?? { label: "Pending", color: "bg-amber-100 text-amber-700 border-amber-200" };
  return (
    <span className={`text-[11px] font-bold border px-2 py-0.5 rounded-full uppercase ${s.color}`}>
      {s.label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SettingsForm({ userId, initialData, config = {}, tierProgress, activeRules = [] }: Props) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<Tab>("PROGRAM");
  const [openKycPicker, setOpenKycPicker] = useState(false);

  const currency = config.currency || "$";
  const payoutMethods: string[] = config.payoutMethods ?? ["STORE_CREDIT"];
  const isVerified = initialData.kyc?.isVerified ?? false;

  const paymentForm = useForm({
    defaultValues: {
      paypalEmail: initialData.paypalEmail || "",
      bankName: initialData.bankDetails?.bankName || "",
      accountName: initialData.bankDetails?.accountName || "",
      accountNumber: initialData.bankDetails?.accountNumber || "",
    },
  });

  const kycForm = useForm({ defaultValues: { type: "NATIONAL_ID", number: "", url: "" } });
  const kycUrl = kycForm.watch("url");

  const onSavePayment = (data: any) => {
    startTransition(async () => {
      const res = await updateSettingsAction({
        paypalEmail: data.paypalEmail,
        bankDetails: { bankName: data.bankName, accountName: data.accountName, accountNumber: data.accountNumber },
      });
      if (res.success) toast.success("Payment settings saved.");
      else toast.error("Failed to save settings.");
    });
  };

  const onUploadKYC = (data: any) => {
    if (!data.url) { toast.error("Please upload a document image."); return; }
    startTransition(async () => {
      const res = await uploadKYCAction(data);
      if (res.success) { toast.success(res.message); kycForm.reset(); window.location.reload(); }
      else toast.error(res.message);
    });
  };

  const TABS = [
    { id: "PROGRAM" as Tab, label: "Program Info",    short: "Program",  icon: Info },
    { id: "PAYOUT"  as Tab, label: "Payout Settings", short: "Payout",   icon: Wallet },
    { id: "KYC"     as Tab, label: "Verification",    short: "Verify",   icon: ShieldCheck },
  ];

  return (
    <div className="w-full space-y-0 animate-in fade-in slide-in-from-bottom-2 duration-300">

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="overflow-hidden bg-gradient-to-br from-[#f6f7f7] to-[#ebebeb] border-b border-[#dcdcde] px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#2271b1] mb-1">
              {config.programName || "Affiliate Program"}
            </p>
            <h2 className="text-xl font-black text-[#1d2327] leading-tight">Partner Settings</h2>
            <p className="text-[13px] text-[#646970] mt-1">Your commission structure &amp; account configuration</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[11px] text-[#2271b1] uppercase font-semibold mb-0.5">Your Rate</p>
            <p className="text-2xl font-black text-[#1d2327]">
              {fmt(config.commissionRate, config.commissionType, currency)}
            </p>
            <p className="text-[11px] text-[#646970]">
              {config.commissionType === "FIXED" ? "per order" : "of order value"}
            </p>
          </div>
        </div>

        {/* Tier Progress in header */}
        {tierProgress?.nextTier && (
          <div className="mt-4 pt-4 border-t border-[#dcdcde]">
            <div className="flex justify-between text-[11px] text-[#646970] mb-1.5">
              <span>Progress to <strong className="text-[#1d2327]">{tierProgress.nextTier.name}</strong></span>
              <span className="text-[#2271b1] font-semibold">{Math.round(tierProgress.progressPercent ?? 0)}%</span>
            </div>
            <div className="h-1.5 bg-[#dcdcde] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2271b1] rounded-full transition-all"
                style={{ width: `${Math.min(tierProgress.progressPercent ?? 0, 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-[#646970] mt-1.5">
              Unlock <strong className="text-[#1d2327]">{fmt(tierProgress.nextTier.commissionRate, tierProgress.nextTier.commissionType, currency)}</strong> rate at {currency}{tierProgress.nextTier.threshold} total sales
            </p>
          </div>
        )}
      </div>

      {/* ── Tab Bar ──────────────────────────────────────────────────── */}
      <div className="flex border-b border-[#c3c4c7] bg-white">
        {TABS.map(({ id, label, short, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "relative flex items-center gap-1.5 px-3 sm:px-5 py-3 text-[13px] font-semibold border-b-2 transition-colors whitespace-nowrap",
              activeTab === id
                ? "border-[#2271b1] text-[#2271b1]"
                : "border-transparent text-[#50575e] hover:text-[#1d2327] hover:border-[#c3c4c7]"
            )}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span className="sm:hidden">{short}</span>
            <span className="hidden sm:inline">{label}</span>
            {id === "KYC" && !isVerified && (
              <span className="absolute top-2 right-1 w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content wrapper ───────────────────────────────────────── */}
      <div className="bg-[#f6f7f7]">

        {/* ════════════════════════════════════════════════════════════
            TAB 1 — PROGRAM INFO
        ════════════════════════════════════════════════════════════ */}
        {activeTab === "PROGRAM" && (
          <div className="p-5 space-y-4">

            {/* Commission cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Base Rate */}
              <div className="bg-white border border-[#c3c4c7] rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-1.5 mb-2">
                  {config.commissionType === "FIXED"
                    ? <DollarSign className="w-3.5 h-3.5 text-[#2271b1]" />
                    : <Percent className="w-3.5 h-3.5 text-[#2271b1]" />}
                  <span className="text-[11px] font-bold text-[#2271b1] uppercase tracking-wide">Base Rate</span>
                </div>
                <p className="text-2xl font-black text-[#1d2327]">
                  {fmt(config.commissionRate, config.commissionType, currency)}
                </p>
                <p className="text-[11px] text-[#646970] mt-0.5">
                  {config.commissionType === "FIXED" ? "Fixed per order" : "Of order value"}
                </p>
              </div>

              {/* Tier */}
              {tierProgress?.currentTier ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Trophy className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">Tier Rate</span>
                  </div>
                  <p className="text-2xl font-black text-amber-800">
                    {fmt(tierProgress.currentTier.commissionRate, tierProgress.currentTier.commissionType, currency)}
                  </p>
                  <p className="text-[11px] text-amber-600 mt-0.5">{tierProgress.currentTier.name} tier</p>
                </div>
              ) : (
                <div className="bg-white border border-dashed border-[#c3c4c7] rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <Trophy className="w-5 h-5 text-[#c3c4c7] mb-1" />
                  <p className="text-[11px] text-[#8c8f94]">No tier assigned</p>
                </div>
              )}
            </div>

            {/* Commission Rules */}
            <div className="bg-white border border-[#c3c4c7] rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <div className="px-4 py-3 border-b border-[#f0f0f1] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#f0c36d]" />
                  <span className="text-[13px] font-bold text-[#1d2327]">Commission Rules</span>
                </div>
                <span className={cn(
                  "text-[11px] font-bold px-2 py-0.5 rounded-full",
                  activeRules.length > 0 ? "bg-[#edfaef] text-[#00a32a]" : "bg-[#f0f0f1] text-[#8c8f94]"
                )}>
                  {activeRules.length} active
                </span>
              </div>

              {activeRules.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <Zap className="w-8 h-8 text-[#c3c4c7] mx-auto mb-2" />
                  <p className="text-[13px] text-[#50575e] font-medium">No special rules active</p>
                  <p className="text-[12px] text-[#8c8f94] mt-0.5">Your base rate applies to all orders</p>
                </div>
              ) : (
                <div className="divide-y divide-[#f0f0f1]">
                  {activeRules.map((rule) => {
                    const isBonus = rule.type === "BONUS_FIXED" || rule.type === "BONUS_PERCENTAGE";
                    const isFixed = rule.type === "FIXED" || rule.type === "BONUS_FIXED";
                    const reward = isFixed ? `${currency}${rule.value}` : `${rule.value}%`;
                    return (
                      <div key={rule.id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[13px] font-semibold text-[#1d2327]">{rule.name}</span>
                              <span className={cn(
                                "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase",
                                isBonus ? "bg-amber-100 text-amber-700" : "bg-[#e7f3ff] text-[#2271b1]"
                              )}>
                                {isBonus ? "BONUS" : "REPLACE"}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#646970] leading-relaxed">
                              {ruleDescription(rule, currency)}
                            </p>
                          </div>
                          <div className={cn(
                            "shrink-0 text-right px-2.5 py-1.5 rounded-lg border",
                            isBonus
                              ? "bg-amber-50 border-amber-200"
                              : "bg-[#edfaef] border-[#00a32a]/20"
                          )}>
                            <p className={cn("text-base font-black", isBonus ? "text-amber-700" : "text-[#00a32a]")}>
                              {isBonus ? `+${reward}` : reward}
                            </p>
                            <p className={cn("text-[10px] font-medium", isBonus ? "text-amber-600" : "text-[#5b841b]")}>
                              {isFixed ? "fixed" : "percent"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* How it works note */}
              <div className="px-4 py-2.5 bg-[#f6f7f7] border-t border-[#f0f0f1]">
                <p className="text-[11px] text-[#646970] flex items-start gap-1.5">
                  <Info className="w-3 h-3 shrink-0 mt-0.5 text-[#8c8f94]" />
                  REPLACE rules override your base rate. BONUS rules add extra commission on top of your base rate.
                </p>
              </div>
            </div>

            {/* Program Details grid */}
            <div className="bg-white border border-[#c3c4c7] rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <div className="px-4 py-3 border-b border-[#f0f0f1] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#646970]" />
                <span className="text-[13px] font-bold text-[#1d2327]">Program Details</span>
              </div>
              <div className="grid grid-cols-2 divide-x divide-y divide-[#f0f0f1]">
                {[
                  { label: "Holding Period",  value: `${config.holdingPeriod ?? 14} days`,     icon: Clock,      hint: "Before commission is released" },
                  { label: "Cookie Duration", value: `${config.cookieDuration ?? 30} days`,    icon: Cookie,     hint: "Referral tracking window" },
                  { label: "Min. Payout",     value: `${currency}${config.minimumPayout ?? 50}`, icon: DollarSign, hint: "Minimum withdrawal amount" },
                  { label: "KYC Required",    value: config.requireKycForPayout ? "Yes" : "No", icon: ShieldCheck, hint: config.requireKycForPayout ? "ID needed before payout" : "No ID required" },
                ].map(({ label, value, icon: Icon, hint }) => (
                  <div key={label} className="px-4 py-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="w-3 h-3 text-[#8c8f94]" />
                      <span className="text-[11px] text-[#646970] font-medium">{label}</span>
                    </div>
                    <p className="text-[14px] font-bold text-[#1d2327]">{value}</p>
                    <p className="text-[10px] text-[#8c8f94] mt-0.5">{hint}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            TAB 2 — PAYOUT SETTINGS
        ════════════════════════════════════════════════════════════ */}
        {activeTab === "PAYOUT" && (
          <form onSubmit={paymentForm.handleSubmit(onSavePayment)} className="p-5 space-y-4">

            {/* Info banner */}
            <div className="flex items-start gap-3 bg-[#e7f3ff] border border-[#72aee6]/40 rounded-xl p-3.5 text-[13px] text-[#1d2327]">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#2271b1]" />
              <p>
                Minimum withdrawal: <strong>{currency}{config.minimumPayout ?? 50}</strong>.
                Funds are released after a <strong>{config.holdingPeriod ?? 14}-day</strong> holding period.
              </p>
            </div>

            {/* PayPal */}
            {payoutMethods.includes("PAYPAL") && (
              <div className="bg-white border border-[#c3c4c7] rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <div className="px-4 py-3 border-b border-[#f0f0f1] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#e7f3ff] flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4 text-[#2271b1]" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[#1d2327]">PayPal</p>
                    <p className="text-[11px] text-[#646970]">Payouts sent to your PayPal email</p>
                  </div>
                </div>
                <div className="p-4">
                  <label className="text-[11px] font-bold text-[#50575e] uppercase block mb-1">PayPal Email</label>
                  <input
                    {...paymentForm.register("paypalEmail")}
                    type="email"
                    placeholder="you@example.com"
                    className="w-full h-9 border border-[#c3c4c7] rounded-lg px-3 text-[13px] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]/20 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Bank Transfer */}
            {payoutMethods.includes("BANK_TRANSFER") && (
              <div className="bg-white border border-[#c3c4c7] rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <div className="px-4 py-3 border-b border-[#f0f0f1] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#edfaef] flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-[#00a32a]" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[#1d2327]">Bank Transfer</p>
                    <p className="text-[11px] text-[#646970]">Direct deposit to your bank account</p>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-[#50575e] uppercase block mb-1">Bank Name</label>
                    <input {...paymentForm.register("bankName")} className="w-full h-9 border border-[#c3c4c7] rounded-lg px-3 text-[13px] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]/20" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#50575e] uppercase block mb-1">Account Name</label>
                    <input {...paymentForm.register("accountName")} className="w-full h-9 border border-[#c3c4c7] rounded-lg px-3 text-[13px] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]/20" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-[#50575e] uppercase block mb-1">Account Number / IBAN</label>
                    <input {...paymentForm.register("accountNumber")} className="w-full h-9 border border-[#c3c4c7] rounded-lg px-3 text-[13px] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]/20" />
                  </div>
                </div>
              </div>
            )}

            {/* Store Credit */}
            {payoutMethods.includes("STORE_CREDIT") && (
              <div className="bg-white border border-[#c3c4c7] rounded-xl p-4 flex items-center gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-[#1d2327]">Store Credit</p>
                  <p className="text-[11px] text-[#646970]">Commission credited to your wallet automatically</p>
                </div>
                <span className="text-[11px] font-bold text-[#00a32a] bg-[#edfaef] border border-[#00a32a]/20 px-2 py-0.5 rounded-full shrink-0">Auto</span>
              </div>
            )}

            {payoutMethods.length === 0 && (
              <div className="bg-white border border-dashed border-[#c3c4c7] rounded-xl p-8 text-center text-[#8c8f94] text-[13px]">
                No payout methods configured. Contact the admin.
              </div>
            )}

            {(payoutMethods.includes("PAYPAL") || payoutMethods.includes("BANK_TRANSFER")) && (
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 bg-[#2271b1] hover:bg-[#135e96] text-white h-9 px-5 rounded-lg text-[13px] font-semibold disabled:opacity-50 transition-colors"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Payment Details
              </button>
            )}
          </form>
        )}

        {/* ════════════════════════════════════════════════════════════
            TAB 3 — KYC VERIFICATION
        ════════════════════════════════════════════════════════════ */}
        {activeTab === "KYC" && (
          <div className="p-5 space-y-4">

            {/* Status banner */}
            <div className={cn(
              "flex items-start gap-3 p-4 rounded-xl border",
              isVerified ? "bg-[#edfaef] border-[#00a32a]/30" : "bg-[#fcf9e8] border-[#f0c36d]/50"
            )}>
              {isVerified
                ? <CheckCircle className="w-5 h-5 text-[#00a32a] shrink-0 mt-0.5" />
                : <AlertCircle className="w-5 h-5 text-[#dba617] shrink-0 mt-0.5" />
              }
              <div>
                <p className={cn("text-[13px] font-bold", isVerified ? "text-[#1d4b1d]" : "text-[#6b4c00]")}>
                  {isVerified ? "Identity Verified" : "Verification Required"}
                </p>
                <p className={cn("text-[12px] mt-0.5", isVerified ? "text-[#2a5f2a]" : "text-[#7a5900]")}>
                  {isVerified
                    ? "Your account is fully verified and eligible for payouts."
                    : "Upload a government ID or tax document to unlock payouts."}
                </p>
              </div>
            </div>

            {/* Upload form */}
            {!isVerified && (
              <div className="bg-white border border-[#c3c4c7] rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <div className="px-4 py-3 border-b border-[#f0f0f1] flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-[#646970]" />
                  <span className="text-[13px] font-bold text-[#1d2327]">Submit Document</span>
                </div>
                <form onSubmit={kycForm.handleSubmit(onUploadKYC)} className="p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-[#50575e] uppercase block mb-1">Document Type</label>
                      <select
                        {...kycForm.register("type")}
                        className="w-full h-9 border border-[#c3c4c7] rounded-lg px-3 text-[13px] bg-white outline-none focus:border-[#2271b1]"
                      >
                        <option value="NATIONAL_ID">National ID</option>
                        <option value="PASSPORT">Passport</option>
                        <option value="DRIVING_LICENSE">Driving License</option>
                        <option value="TAX_FORM">Tax Return / TIN</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#50575e] uppercase block mb-1">Document Number</label>
                      <input
                        {...kycForm.register("number", { required: true })}
                        placeholder="e.g. 123-456-789"
                        className="w-full h-9 border border-[#c3c4c7] rounded-lg px-3 text-[13px] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#50575e] uppercase block mb-1.5">Document Image</label>
                    {kycUrl ? (
                      <div className="flex items-center gap-3 border border-[#c3c4c7] rounded-lg p-3 bg-[#f6f7f7]">
                        <img src={kycUrl} alt="KYC" className="w-16 h-16 object-cover rounded-md border border-[#c3c4c7] shrink-0" />
                        <div className="flex flex-col gap-1.5">
                          <button type="button" onClick={() => setOpenKycPicker(true)} className="text-[12px] text-[#2271b1] hover:underline text-left font-medium">
                            Change image
                          </button>
                          <button type="button" onClick={() => kycForm.setValue("url", "", { shouldValidate: true })} className="text-[12px] text-[#d63638] hover:underline text-left">
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setOpenKycPicker(true)}
                        className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#c3c4c7] rounded-lg p-6 text-[13px] text-[#646970] hover:border-[#2271b1] hover:text-[#2271b1] hover:bg-[#f0f6fc] transition-all"
                      >
                        <UploadCloud className="w-6 h-6" />
                        Click to upload document image
                      </button>
                    )}
                    <input type="hidden" {...kycForm.register("url", { required: true })} />
                    <MediaPickerModal
                      open={openKycPicker}
                      onClose={() => setOpenKycPicker(false)}
                      onSelect={(items) => { if (items[0]) kycForm.setValue("url", items[0].url, { shouldValidate: true }); }}
                      title="Select KYC Document"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isPending || !kycUrl}
                    className="flex items-center gap-2 bg-[#2271b1] hover:bg-[#135e96] text-white h-9 px-5 rounded-lg text-[13px] font-semibold disabled:opacity-50 transition-colors"
                  >
                    {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                    Submit for Review
                  </button>
                </form>
              </div>
            )}

            {/* History */}
            {(initialData.kyc?.documents?.length ?? 0) > 0 && (
              <div className="bg-white border border-[#c3c4c7] rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <div className="px-4 py-3 border-b border-[#f0f0f1] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#646970]" />
                  <span className="text-[13px] font-bold text-[#1d2327]">Submission History</span>
                </div>
                <div className="divide-y divide-[#f0f0f1]">
                  {initialData.kyc!.documents.map((doc: any) => (
                    <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 bg-[#f0f0f1] rounded-lg flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-[#646970]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#1d2327]">{doc.type?.replace(/_/g, " ")}</p>
                        {doc.number && <p className="text-[11px] text-[#646970]">#{doc.number}</p>}
                        {doc.feedback && <p className="text-[11px] text-[#d63638] mt-0.5">{doc.feedback}</p>}
                      </div>
                      <KycBadge status={doc.status} />
                      {doc.url && (
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-[#2271b1] hover:text-[#135e96] shrink-0">
                          <ChevronRight className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
