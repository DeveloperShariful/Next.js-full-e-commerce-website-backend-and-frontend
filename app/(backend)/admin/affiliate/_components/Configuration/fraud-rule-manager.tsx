// File: app/(backend)/admin/affiliate/_components/Configuration/fraud-rule-manager.tsx

"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Shield, AlertTriangle, Ban, Plus, Trash2, Loader2,
  CheckCircle, XCircle, Activity, Users, Flag, Info,
  ShieldAlert, ShieldCheck, RefreshCw, UserX, Zap,
  ToggleLeft, ToggleRight, Bell, TrendingUp, Eye
} from "lucide-react";
import { toast } from "sonner";
import {
  createFraudRuleAction,
  deleteFraudRuleAction,
  toggleFraudRuleAction,
  clearRiskScoreAction,
  suspendAffiliateAction,
  reinstateAffiliateAction,
  clearFlagAction,
  rejectFlaggedReferralAction,
} from "@/app/actions/backend/affiliate/_services/fraud-service";

// ==============================================================================
// TYPES
// ==============================================================================

interface FraudRuleItem {
  id?: string;
  type: "IP_CLICK_LIMIT" | "CONVERSION_RATE_LIMIT" | "ORDER_VALUE_LIMIT" | "BLACKLIST_COUNTRY" | "MIN_ORDER_VALUE" | "DEVICE_FINGERPRINT_LIMIT";
  value: string;
  action: "BLOCK" | "FLAG" | "SUSPEND";
  reason?: string;
  isActive: boolean;
}

interface HighRiskAffiliate {
  id: string;
  slug: string;
  status: string;
  riskScore: number;
  createdAt: string;
  user: { name: string | null; email: string; image: string | null };
  _count: { referrals: number; clicks: number };
}

interface FlaggedReferral {
  id: string;
  flagReason: string | null;
  totalOrderAmount: number;
  commissionAmount: number;
  status: string;
  createdAt: string;
  affiliate: { id: string; slug: string; user: { name: string | null; email: string } };
  order: { orderNumber: string };
}

interface FraudAlert {
  id: string;
  source: string;
  message: string;
  context: Record<string, unknown> | null;
  createdAt: string;
}

interface FraudStats {
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  suspended: number;
  totalFlagged: number;
  recentFlagged: number;
}

interface Props {
  initialRules: FraudRuleItem[];
  highRisk: HighRiskAffiliate[];
  flagged: FlaggedReferral[];
  stats: FraudStats;
  alerts: FraudAlert[];
}

type ActiveTab = "overview" | "rules" | "risk" | "flagged";

// ==============================================================================
// HELPER COMPONENTS
// ==============================================================================

function RiskScoreBar({ score }: { score: number }) {
  const pct = Math.min(score, 100);
  const color = score >= 70 ? "#d63638" : score >= 40 ? "#f0b849" : "#00a32a";
  const label = score >= 70 ? "HIGH" : score >= 40 ? "MED" : "LOW";
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2 bg-[#dcdcde] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[11px] font-bold w-7 text-right" style={{ color }}>{pct}</span>
      <span className="text-[10px] font-bold px-1 rounded" style={{ color, backgroundColor: `${color}18` }}>{label}</span>
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    FLAG:    { bg: "#fcf9e8", text: "#8a6d3b" },
    BLOCK:   { bg: "#fcf0f1", text: "#d63638" },
    SUSPEND: { bg: "#f9e8e8", text: "#cc1818" },
  };
  const style = map[action] ?? { bg: "#f0f0f1", text: "#50575e" };
  return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase" style={{ backgroundColor: style.bg, color: style.text }}>
      {action}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    ACTIVE:    { label: "Active",    color: "#00a32a" },
    SUSPENDED: { label: "Suspended", color: "#d63638" },
    PENDING:   { label: "Pending",   color: "#f0b849" },
    REJECTED:  { label: "Rejected",  color: "#8c8f94" },
    APPROVED:  { label: "Approved",  color: "#00a32a" },
    PAID:      { label: "Paid",      color: "#2271b1" },
    FLAGGED:   { label: "Flagged",   color: "#d63638" },
  };
  const s = map[status] ?? { label: status, color: "#50575e" };
  return (
    <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded" style={{ color: s.color, backgroundColor: `${s.color}18` }}>
      {s.label}
    </span>
  );
}

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return iso; }
}

const RULE_TYPES: { value: FraudRuleItem["type"]; label: string; hint: string }[] = [
  { value: "IP_CLICK_LIMIT",          label: "High Click Volume (IP)",        hint: "Max clicks per IP in 24h" },
  { value: "CONVERSION_RATE_LIMIT",   label: "Suspicious Conversion Rate",    hint: "Max conversion % (e.g. 80)" },
  { value: "ORDER_VALUE_LIMIT",       label: "Abnormal Order Value",          hint: "Max single order $ amount" },
  { value: "BLACKLIST_COUNTRY",       label: "Blacklisted Country",           hint: "Country code e.g. KP, NG" },
  { value: "MIN_ORDER_VALUE",         label: "Minimum Order Value",           hint: "Min $ to earn commission" },
  { value: "DEVICE_FINGERPRINT_LIMIT","label": "Device Fingerprint Limit",    hint: "Max unique devices per day" },
];

// ==============================================================================
// MAIN COMPONENT
// ==============================================================================

export default function FraudRuleManager({ initialRules, highRisk, flagged, stats, alerts }: Props) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  // Form state
  const [ruleType, setRuleType] = useState<FraudRuleItem["type"]>("IP_CLICK_LIMIT");
  const [ruleValue, setRuleValue] = useState("");
  const [ruleAction, setRuleAction] = useState<FraudRuleItem["action"]>("FLAG");
  const [ruleReason, setRuleReason] = useState("");

  const selectedTypeInfo = RULE_TYPES.find(t => t.value === ruleType);

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleValue.trim()) return toast.error("Threshold value is required");
    startTransition(async () => {
      const res = await createFraudRuleAction({
        type: ruleType,
        value: ruleValue.trim(),
        action: ruleAction,
        reason: ruleReason.trim() || "Automated Rule Match",
        isActive: true,
      });
      if (res.success) { toast.success(res.message); setRuleValue(""); setRuleReason(""); }
      else toast.error(res.message);
    });
  };

  const handleToggleRule = (id: string, current: boolean) => {
    startTransition(async () => {
      const res = await toggleFraudRuleAction(id, !current);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  const handleDeleteRule = (id: string) => {
    if (!confirm("Permanently remove this security rule?")) return;
    startTransition(async () => {
      const res = await deleteFraudRuleAction(id);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  const handleClearRisk = (id: string) => {
    startTransition(async () => {
      const res = await clearRiskScoreAction(id);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  const handleSuspend = (id: string) => {
    if (!confirm("Suspend this affiliate? They will lose access immediately.")) return;
    startTransition(async () => {
      const res = await suspendAffiliateAction(id);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  const handleReinstate = (id: string) => {
    startTransition(async () => {
      const res = await reinstateAffiliateAction(id);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  const handleClearFlag = (id: string) => {
    startTransition(async () => {
      const res = await clearFlagAction(id);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  const handleRejectReferral = (id: string) => {
    if (!confirm("Reject and void this referral commission?")) return;
    startTransition(async () => {
      const res = await rejectFlaggedReferralAction(id);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  const TABS: { id: ActiveTab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: "overview", label: "Live Monitor",      icon: Activity },
    { id: "rules",    label: "Security Rules",    icon: Shield,     count: initialRules.filter(r => r.isActive).length },
    { id: "risk",     label: "Risk Monitor",      icon: ShieldAlert, count: stats.highRisk },
    { id: "flagged",  label: "Flagged Referrals", icon: Flag,        count: stats.totalFlagged },
  ];

  return (
    <div className="space-y-4 font-sans text-[#1d2327]">

      {/* ==== HEADER ==== */}
      <div className="bg-[#1d2327] rounded-sm px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#d63638]/20 flex items-center justify-center ring-2 ring-[#d63638]/40">
            <Shield className="w-5 h-5 text-[#d63638]" />
          </div>
          <div>
            <h2 className="text-[16px] font-bold text-white m-0 leading-tight">Fraud Shield</h2>
            <p className="text-[12px] text-[#8c8f94] m-0 mt-0.5">Real-time fraud detection & affiliate risk management</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {stats.recentFlagged > 0 && (
            <span className="flex items-center gap-1.5 text-[12px] font-semibold bg-[#d63638]/20 text-[#ff6b6b] px-3 py-1.5 rounded-full border border-[#d63638]/30">
              <span className="w-2 h-2 bg-[#d63638] rounded-full animate-pulse" />
              {stats.recentFlagged} new threats (7d)
            </span>
          )}
          <span className="text-[11px] text-[#646970] bg-[#2c3338] px-2.5 py-1 rounded-sm">
            {initialRules.filter(r => r.isActive).length} / {initialRules.length} rules active
          </span>
        </div>
      </div>

      {/* ==== KPI CARDS ==== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "High Risk",         value: stats.highRisk,     icon: ShieldAlert, color: "#d63638", hint: "Score ≥ 70" },
          { label: "Medium Risk",       value: stats.mediumRisk,   icon: AlertTriangle, color: "#f0b849", hint: "Score 30–70" },
          { label: "Suspended",         value: stats.suspended,    icon: UserX,       color: "#cc1818", hint: "By system or manual" },
          { label: "Flagged Referrals", value: stats.totalFlagged, icon: Flag,        color: "#f0b849", hint: `${stats.recentFlagged} this week` },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white border border-[#c3c4c7] shadow-sm p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#50575e] font-medium">{card.label}</span>
                <div className="w-7 h-7 rounded flex items-center justify-center" style={{ backgroundColor: `${card.color}18` }}>
                  <Icon className="w-4 h-4" style={{ color: card.color }} />
                </div>
              </div>
              <div className="text-[28px] font-bold leading-none" style={{ color: card.value > 0 ? card.color : "#1d2327" }}>
                {card.value}
              </div>
              <p className="text-[11px] text-[#8c8f94] m-0">{card.hint}</p>
            </div>
          );
        })}
      </div>

      {/* ==== TABS ==== */}
      <div className="bg-white border border-[#c3c4c7] shadow-sm">
        <div className="border-b border-[#c3c4c7] flex overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-[13px] font-semibold border-b-2 whitespace-nowrap transition-colors shrink-0",
                  isActive
                    ? "border-[#d63638] text-[#d63638] bg-[#fcf0f1]"
                    : "border-transparent text-[#50575e] hover:text-[#1d2327] hover:bg-[#f6f7f7]"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={cn(
                    "text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center",
                    isActive ? "bg-[#d63638] text-white" : "bg-[#dcdcde] text-[#3c434a]"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Pending overlay */}
        <div className="relative">
          {isPending && (
            <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#d63638]" />
            </div>
          )}

          {/* ==== TAB: OVERVIEW ==== */}
          {activeTab === "overview" && (
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                {/* Risk Distribution */}
                <div className="lg:col-span-2 space-y-3">
                  <h4 className="text-[13px] font-semibold text-[#1d2327] flex items-center gap-2 m-0">
                    <TrendingUp className="w-4 h-4 text-[#2271b1]" /> Risk Distribution
                  </h4>
                  <div className="space-y-2.5">
                    {[
                      { label: "High Risk  (≥70)", value: stats.highRisk,   total: stats.highRisk + stats.mediumRisk + stats.lowRisk, color: "#d63638" },
                      { label: "Medium Risk (30–70)", value: stats.mediumRisk, total: stats.highRisk + stats.mediumRisk + stats.lowRisk, color: "#f0b849" },
                      { label: "Safe  (<30)",    value: stats.lowRisk,   total: stats.highRisk + stats.mediumRisk + stats.lowRisk, color: "#00a32a" },
                    ].map((row) => {
                      const pct = row.total > 0 ? Math.round((row.value / row.total) * 100) : 0;
                      return (
                        <div key={row.label} className="space-y-1">
                          <div className="flex justify-between text-[12px]">
                            <span className="text-[#50575e]">{row.label}</span>
                            <span className="font-semibold" style={{ color: row.color }}>{row.value} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 bg-[#f0f0f1] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: row.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#f0f0f1]">
                    <h4 className="text-[13px] font-semibold text-[#1d2327] flex items-center gap-2 m-0 mb-3">
                      <Shield className="w-4 h-4 text-[#2271b1]" /> Engine Status
                    </h4>
                    <div className="space-y-2">
                      {[
                        { label: "Self-Referral Detection", on: true },
                        { label: "Velocity Check (5min)",   on: true },
                        { label: "Device Fingerprinting",   on: true },
                        { label: "IP Click Limit",          on: initialRules.some(r => r.type === "IP_CLICK_LIMIT" && r.isActive) },
                        { label: "Country Blacklist",       on: initialRules.some(r => r.type === "BLACKLIST_COUNTRY" && r.isActive) },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between text-[12px]">
                          <span className="text-[#50575e]">{item.label}</span>
                          <span className={cn("font-semibold flex items-center gap-1", item.on ? "text-[#00a32a]" : "text-[#8c8f94]")}>
                            {item.on ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {item.on ? "Active" : "Off"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Alerts Feed */}
                <div className="lg:col-span-3">
                  <h4 className="text-[13px] font-semibold text-[#1d2327] flex items-center gap-2 m-0 mb-3">
                    <Bell className="w-4 h-4 text-[#d63638]" /> Recent Security Alerts
                    <span className="text-[10px] font-normal text-[#8c8f94]">(last 20)</span>
                  </h4>
                  {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 border border-dashed border-[#c3c4c7] text-center gap-2 rounded-sm">
                      <ShieldCheck className="w-8 h-8 text-[#00a32a]" />
                      <p className="text-[13px] text-[#50575e] m-0">No recent alerts. System is clean.</p>
                    </div>
                  ) : (
                    <div className="border border-[#c3c4c7] rounded-sm divide-y divide-[#f0f0f1] max-h-[360px] overflow-y-auto">
                      {alerts.map((alert) => (
                        <div key={alert.id} className="px-3 py-2.5 hover:bg-[#f6f7f7] flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-[#d63638]/15 flex items-center justify-center shrink-0 mt-0.5">
                            <Zap className="w-3 h-3 text-[#d63638]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold text-[#1d2327] m-0 truncate">{alert.message}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-[#50575e] font-mono bg-[#f0f0f1] px-1 rounded">{alert.source}</span>
                              <span className="text-[10px] text-[#8c8f94]">{formatDate(alert.createdAt)}</span>
                            </div>
                            {alert.context && typeof alert.context === "object" && (
                              <p className="text-[11px] text-[#8c8f94] m-0 mt-0.5 font-mono truncate">
                                {Object.entries(alert.context).map(([k, v]) => `${k}: ${String(v)}`).join(" | ")}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==== TAB: SECURITY RULES ==== */}
          {activeTab === "rules" && (
            <div className="p-5">
              <div className="bg-[#1d2327]/5 border-l-4 border-[#d63638] px-4 py-3 mb-5 flex items-start gap-3 rounded-sm">
                <Info className="w-4 h-4 text-[#d63638] shrink-0 mt-0.5" />
                <p className="text-[12px] text-[#50575e] m-0">
                  Rules evaluate in real-time on every referral. Matching triggers automatic <strong>FLAG</strong> (pauses payout), <strong>BLOCK</strong> (stops IP), or <strong>SUSPEND</strong> (locks account).
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* Add Rule Form */}
                <div className="lg:col-span-2">
                  <div className="bg-[#f6f7f7] border border-[#c3c4c7] rounded-sm">
                    <div className="px-4 py-3 border-b border-[#c3c4c7] bg-[#1d2327] rounded-t-sm">
                      <h4 className="text-[13px] font-semibold text-white m-0 flex items-center gap-2">
                        <Plus className="w-4 h-4" /> New Security Rule
                      </h4>
                    </div>
                    <form onSubmit={handleCreateRule} className="p-4 space-y-4">
                      <div>
                        <label className="text-[12px] font-semibold text-[#1d2327] block mb-1">Trigger Condition</label>
                        <select
                          value={ruleType}
                          onChange={(e) => setRuleType(e.target.value as FraudRuleItem["type"])}
                          className="w-full border border-[#8c8f94] rounded-sm px-2.5 py-1.5 text-[13px] bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none"
                        >
                          {RULE_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                        {selectedTypeInfo && (
                          <p className="text-[11px] text-[#50575e] mt-1 italic m-0">Hint: {selectedTypeInfo.hint}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-[12px] font-semibold text-[#1d2327] block mb-1">Threshold Value</label>
                        <input
                          value={ruleValue}
                          onChange={(e) => setRuleValue(e.target.value)}
                          placeholder={selectedTypeInfo?.hint || "Enter value"}
                          className="w-full border border-[#8c8f94] rounded-sm px-2.5 py-1.5 text-[13px] bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[12px] font-semibold text-[#1d2327] block mb-1.5">Automated Action</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(["FLAG", "BLOCK", "SUSPEND"] as FraudRuleItem["action"][]).map((act) => (
                            <button
                              key={act}
                              type="button"
                              onClick={() => setRuleAction(act)}
                              className={cn(
                                "py-2 text-[11px] font-bold rounded-sm border transition-all flex flex-col items-center gap-1",
                                ruleAction === act
                                  ? "bg-[#d63638] text-white border-[#d63638] shadow-sm"
                                  : "bg-white text-[#50575e] border-[#c3c4c7] hover:border-[#d63638] hover:text-[#d63638]"
                              )}
                            >
                              {act === "FLAG" ? <Flag className="w-3 h-3" /> : act === "BLOCK" ? <Ban className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                              {act}
                            </button>
                          ))}
                        </div>
                        <p className="text-[11px] text-[#8c8f94] mt-1.5 italic m-0">
                          {ruleAction === "FLAG" ? "Marks referral for manual review. Payout paused." :
                           ruleAction === "BLOCK" ? "Blocks the request immediately at detection." :
                           "Suspends the affiliate account system-wide."}
                        </p>
                      </div>

                      <div>
                        <label className="text-[12px] font-semibold text-[#1d2327] block mb-1">Log Reason</label>
                        <input
                          value={ruleReason}
                          onChange={(e) => setRuleReason(e.target.value)}
                          placeholder="e.g. Bot traffic pattern detected"
                          className="w-full border border-[#8c8f94] rounded-sm px-2.5 py-1.5 text-[13px] bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isPending}
                        className="w-full flex items-center justify-center gap-2 bg-[#d63638] text-white py-2 rounded-sm text-[13px] font-semibold hover:bg-[#b32d2e] disabled:opacity-50 transition-colors"
                      >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                        Activate Rule
                      </button>
                    </form>
                  </div>
                </div>

                {/* Rules List */}
                <div className="lg:col-span-3">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[13px] font-semibold text-[#1d2327] m-0">
                      Active Rules ({initialRules.filter(r => r.isActive).length} / {initialRules.length})
                    </h4>
                  </div>
                  {initialRules.length === 0 ? (
                    <div className="border border-dashed border-[#c3c4c7] rounded-sm p-10 text-center flex flex-col items-center gap-2">
                      <Shield className="w-8 h-8 text-[#8c8f94]" />
                      <p className="text-[13px] text-[#50575e] m-0">No rules configured yet.</p>
                      <p className="text-[12px] text-[#8c8f94] m-0">Add your first security rule to protect against fraud.</p>
                    </div>
                  ) : (
                    <div className="border border-[#c3c4c7] rounded-sm divide-y divide-[#f0f0f1] bg-white">
                      {initialRules.map((rule, idx) => (
                        <div
                          key={rule.id || idx}
                          className={cn(
                            "px-4 py-3 flex items-start justify-between gap-4 transition-colors group",
                            !rule.isActive && "opacity-50"
                          )}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="mt-0.5 shrink-0">
                              {rule.action === "BLOCK" ? (
                                <Ban className="w-4 h-4 text-[#d63638]" />
                              ) : rule.action === "SUSPEND" ? (
                                <UserX className="w-4 h-4 text-[#cc1818]" />
                              ) : (
                                <Flag className="w-4 h-4 text-[#f0b849]" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-[#1d2327] m-0 truncate">
                                {RULE_TYPES.find(t => t.value === rule.type)?.label ?? rule.type}
                              </p>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <ActionBadge action={rule.action} />
                                <span className="text-[11px] text-[#50575e]">Threshold: <strong>{rule.value}</strong></span>
                                {rule.reason && <span className="text-[11px] text-[#8c8f94] italic truncate">— {rule.reason}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => rule.id && handleToggleRule(rule.id, rule.isActive)}
                              disabled={isPending || !rule.id}
                              title={rule.isActive ? "Disable rule" : "Enable rule"}
                              className="text-[#646970] hover:text-[#2271b1] transition-colors"
                            >
                              {rule.isActive
                                ? <ToggleRight className="w-5 h-5 text-[#00a32a]" />
                                : <ToggleLeft className="w-5 h-5 text-[#8c8f94]" />}
                            </button>
                            <button
                              onClick={() => rule.id && handleDeleteRule(rule.id)}
                              disabled={isPending || !rule.id}
                              title="Remove rule"
                              className="text-[#8c8f94] hover:text-[#d63638] transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==== TAB: RISK MONITOR ==== */}
          {activeTab === "risk" && (
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[13px] font-semibold text-[#1d2327] m-0 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#d63638]" />
                  High-Risk Affiliates ({highRisk.length})
                </h4>
                <p className="text-[12px] text-[#8c8f94] m-0">Sorted by risk score (highest first). Score ≥ 70 is auto-flagged.</p>
              </div>

              {highRisk.length === 0 ? (
                <div className="border border-dashed border-[#c3c4c7] rounded-sm p-12 text-center flex flex-col items-center gap-2">
                  <ShieldCheck className="w-10 h-10 text-[#00a32a]" />
                  <p className="text-[14px] font-semibold text-[#1d2327] m-0">No high-risk affiliates detected.</p>
                  <p className="text-[12px] text-[#50575e] m-0">The system is clean. Fraud Shield is working.</p>
                </div>
              ) : (
                <div className="border border-[#c3c4c7] rounded-sm overflow-x-auto bg-white">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="bg-[#f6f7f7] border-b border-[#c3c4c7]">
                        <th className="text-left font-semibold text-[#1d2327] px-4 py-2.5 w-[240px]">Affiliate</th>
                        <th className="text-left font-semibold text-[#1d2327] px-4 py-2.5">Risk Score</th>
                        <th className="text-left font-semibold text-[#1d2327] px-4 py-2.5">Status</th>
                        <th className="text-center font-semibold text-[#1d2327] px-4 py-2.5">Referrals</th>
                        <th className="text-center font-semibold text-[#1d2327] px-4 py-2.5">Clicks</th>
                        <th className="text-right font-semibold text-[#1d2327] px-4 py-2.5">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f0f1]">
                      {highRisk.map((af) => (
                        <tr key={af.id} className="hover:bg-[#f9f9f9] transition-colors group">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              {af.user.image ? (
                                <Image src={af.user.image} alt="" width={28} height={28} className="rounded-full ring-1 ring-[#dcdcde] shrink-0" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-[#d63638]/15 flex items-center justify-center shrink-0 text-[12px] font-bold text-[#d63638]">
                                  {(af.user.name || af.user.email).charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold text-[#1d2327] m-0 truncate text-[12px]">{af.user.name || "—"}</p>
                                <p className="text-[11px] text-[#8c8f94] m-0 truncate">{af.user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <RiskScoreBar score={af.riskScore} />
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={af.status} />
                          </td>
                          <td className="px-4 py-3 text-center text-[12px] text-[#50575e]">{af._count.referrals}</td>
                          <td className="px-4 py-3 text-center text-[12px] text-[#50575e]">{af._count.clicks}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleClearRisk(af.id)}
                                disabled={isPending}
                                title="Clear risk score"
                                className="flex items-center gap-1 text-[11px] text-[#2271b1] hover:underline font-semibold"
                              >
                                <RefreshCw className="w-3 h-3" /> Clear
                              </button>
                              {af.status === "SUSPENDED" ? (
                                <button
                                  onClick={() => handleReinstate(af.id)}
                                  disabled={isPending}
                                  title="Reinstate affiliate"
                                  className="flex items-center gap-1 text-[11px] text-[#00a32a] hover:underline font-semibold"
                                >
                                  <CheckCircle className="w-3 h-3" /> Reinstate
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleSuspend(af.id)}
                                  disabled={isPending}
                                  title="Suspend affiliate"
                                  className="flex items-center gap-1 text-[11px] text-[#d63638] hover:underline font-semibold"
                                >
                                  <UserX className="w-3 h-3" /> Suspend
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ==== TAB: FLAGGED REFERRALS ==== */}
          {activeTab === "flagged" && (
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[13px] font-semibold text-[#1d2327] m-0 flex items-center gap-2">
                  <Flag className="w-4 h-4 text-[#f0b849]" />
                  Flagged Referrals ({flagged.length})
                </h4>
                <p className="text-[12px] text-[#8c8f94] m-0">Review suspicious referrals. Approve (clear flag) or Reject.</p>
              </div>

              {flagged.length === 0 ? (
                <div className="border border-dashed border-[#c3c4c7] rounded-sm p-12 text-center flex flex-col items-center gap-2">
                  <ShieldCheck className="w-10 h-10 text-[#00a32a]" />
                  <p className="text-[14px] font-semibold text-[#1d2327] m-0">No flagged referrals.</p>
                  <p className="text-[12px] text-[#50575e] m-0">All referrals are clean. No suspicious activity detected.</p>
                </div>
              ) : (
                <div className="border border-[#c3c4c7] rounded-sm overflow-x-auto bg-white">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="bg-[#f6f7f7] border-b border-[#c3c4c7]">
                        <th className="text-left font-semibold text-[#1d2327] px-4 py-2.5">Order</th>
                        <th className="text-left font-semibold text-[#1d2327] px-4 py-2.5">Affiliate</th>
                        <th className="text-right font-semibold text-[#1d2327] px-4 py-2.5">Order Amt</th>
                        <th className="text-right font-semibold text-[#1d2327] px-4 py-2.5">Commission</th>
                        <th className="text-left font-semibold text-[#1d2327] px-4 py-2.5">Flag Reason</th>
                        <th className="text-left font-semibold text-[#1d2327] px-4 py-2.5">Status</th>
                        <th className="text-left font-semibold text-[#1d2327] px-4 py-2.5">Date</th>
                        <th className="text-right font-semibold text-[#1d2327] px-4 py-2.5">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f0f1]">
                      {flagged.map((ref) => (
                        <tr key={ref.id} className="hover:bg-[#fffbf0] transition-colors group">
                          <td className="px-4 py-3">
                            <span className="font-mono text-[12px] text-[#2271b1]">#{ref.order?.orderNumber || "N/A"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-semibold text-[#1d2327] m-0 text-[12px]">{ref.affiliate?.user?.name || "—"}</p>
                              <p className="text-[11px] text-[#8c8f94] m-0">{ref.affiliate?.slug}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-[12px]">
                            ${Number(ref.totalOrderAmount).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-[12px] text-[#d63638] font-semibold">
                            ${Number(ref.commissionAmount).toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[11px] text-[#50575e] bg-[#fcf9e8] px-2 py-0.5 rounded border border-[#f0b849]/30">
                              {ref.flagReason || "Automated detection"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={ref.status} />
                          </td>
                          <td className="px-4 py-3 text-[11px] text-[#8c8f94] whitespace-nowrap">
                            {formatDate(ref.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleClearFlag(ref.id)}
                                disabled={isPending}
                                title="Clear flag — approve referral"
                                className="flex items-center gap-1 text-[11px] text-[#00a32a] hover:underline font-semibold"
                              >
                                <CheckCircle className="w-3 h-3" /> Approve
                              </button>
                              <button
                                onClick={() => handleRejectReferral(ref.id)}
                                disabled={isPending}
                                title="Reject referral"
                                className="flex items-center gap-1 text-[11px] text-[#d63638] hover:underline font-semibold"
                              >
                                <XCircle className="w-3 h-3" /> Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
