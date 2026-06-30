"use client";

import { useState } from "react";
import {
  DollarSign, Wallet, MousePointer, Users, TrendingUp, Clock,
  Trophy, Target, Zap, Copy, Check, Link2, Tag, AlertCircle,
  Info, Megaphone, ArrowUpRight, ArrowDownRight, ShoppingBag,
  Ticket, ChevronRight, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTz } from "@/lib/store-time";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { toast } from "sonner";

const n = (v: unknown) => Number(v) || 0;

// ── Copy hook ────────────────────────────────────────────────────────────────

function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("Copied!");
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return { copied, copy };
}

// ── Announcement Banner ───────────────────────────────────────────────────────

function AnnouncementBanner({ announcements }: { announcements: any[] }) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const visible = announcements.filter(a => !dismissed.includes(a.id)).slice(0, 1);
  if (visible.length === 0) return null;

  const a = visible[0];
  const typeStyles: Record<string, string> = {
    INFO:    "bg-[#e7f3ff] border-[#72aee6]/40 text-[#2271b1]",
    WARNING: "bg-[#fcf9e8] border-[#f0c36d]/50 text-[#6b4c00]",
    SUCCESS: "bg-[#edfaef] border-[#00a32a]/30 text-[#1d4b1d]",
    ALERT:   "bg-[#fcebec] border-[#d63638]/30 text-[#d63638]",
  };
  const TypeIcon = a.type === "WARNING" ? AlertCircle : a.type === "ALERT" ? AlertCircle : Info;

  return (
    <div className={cn("border rounded-lg px-4 py-3 flex items-start gap-3 text-[13px]", typeStyles[a.type] || typeStyles.INFO)}>
      <TypeIcon className="w-4 h-4 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <span className="font-bold">{a.title}: </span>
        <span className="opacity-90">{a.message}</span>
      </div>
      <button onClick={() => setDismissed(d => [...d, a.id])} className="shrink-0 opacity-60 hover:opacity-100 text-lg leading-none">×</button>
    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: "blue" | "green" | "amber" | "violet" | "rose";
  todayBadge?: number;
  trend?: "up" | "down";
  trendPct?: number;
}

function KpiCard({ label, value, sub, icon: Icon, color, todayBadge, trend, trendPct }: KpiProps) {
  const c = {
    blue:   { bg: "bg-[#e7f3ff]", text: "text-[#2271b1]" },
    green:  { bg: "bg-[#edfaef]", text: "text-[#00a32a]" },
    amber:  { bg: "bg-[#fcf9e8]", text: "text-[#9a6700]" },
    violet: { bg: "bg-violet-50",  text: "text-violet-600" },
    rose:   { bg: "bg-rose-50",    text: "text-rose-600" },
  }[color];

  return (
    <div className="bg-white border border-[#e0e0e0] rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", c.bg, c.text)}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <div className="flex items-center gap-1.5">
          {todayBadge !== undefined && todayBadge > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#edfaef] text-[#00a32a] border border-[#00a32a]/20">
              +{todayBadge} today
            </span>
          )}
          {trend && trendPct !== undefined && (
            <span className={cn("text-[10px] font-bold flex items-center gap-0.5 px-1.5 py-0.5 rounded-full",
              trend === "up" ? "bg-[#edfaef] text-[#00a32a]" : "bg-rose-50 text-rose-600"
            )}>
              {trend === "up" ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
              {trendPct.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
      <p className="text-[11px] font-semibold text-[#646970] uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-[22px] font-black text-[#1d2327] leading-tight">{value}</p>
      {sub && <p className="text-[11px] text-[#8c8f94] mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Earnings Chart ────────────────────────────────────────────────────────────

function EarningsChart({ data, view, setView }: { data: any[]; view: "area" | "bar"; setView: (v: "area" | "bar") => void }) {
  const { symbol, formatPrice, timezone } = useGlobalStore();
  const currency = symbol || "$";

  if (!data || data.length === 0) {
    return (
      <div className="h-[260px] flex flex-col items-center justify-center text-[#8c8f94] border border-dashed border-[#c3c4c7] rounded-lg">
        <TrendingUp className="w-8 h-8 mb-2 opacity-30" />
        <p className="text-[13px]">No earnings data yet</p>
      </div>
    );
  }

  const commonProps = {
    data,
    margin: { top: 4, right: 4, left: -18, bottom: 0 },
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-[#646970]">Last 30 days earnings</p>
        <div className="flex border border-[#c3c4c7] rounded overflow-hidden">
          {(["area", "bar"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={cn("px-2.5 py-1 text-[11px] font-semibold transition-colors",
                view === v ? "bg-[#2271b1] text-white" : "text-[#646970] hover:bg-[#f0f0f1]"
              )}>
              {v === "area" ? "Area" : "Bar"}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          {view === "area" ? (
            <AreaChart {...commonProps}>
              <defs>
                <linearGradient id="earn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2271b1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2271b1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f1" />
              <XAxis dataKey="date" axisLine={false} tickLine={false}
                tick={{ fontSize: 10, fill: "#8c8f94" }} tickFormatter={v => v.slice(5)} />
              <YAxis axisLine={false} tickLine={false}
                tick={{ fontSize: 10, fill: "#8c8f94" }} tickFormatter={v => `${currency}${v}`} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 12 }}
                formatter={(v: unknown) => [formatPrice(n(v)), "Earnings"]}
                labelFormatter={l => formatTz(new Date(l), timezone, "MMM d, yyyy")}
              />
              <Area type="monotone" dataKey="earnings" stroke="#2271b1" strokeWidth={2.5}
                fill="url(#earn)" animationDuration={1000} />
            </AreaChart>
          ) : (
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f1" />
              <XAxis dataKey="date" axisLine={false} tickLine={false}
                tick={{ fontSize: 10, fill: "#8c8f94" }} tickFormatter={v => v.slice(5)} />
              <YAxis axisLine={false} tickLine={false}
                tick={{ fontSize: 10, fill: "#8c8f94" }} tickFormatter={v => `${currency}${v}`} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 12 }}
                formatter={(v: unknown) => [formatPrice(n(v)), "Earnings"]}
              />
              <Bar dataKey="earnings" fill="#2271b1" radius={[3, 3, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Quick Link Card ───────────────────────────────────────────────────────────

function QuickLinkCard({ referralLink, slug }: { referralLink: string; slug: string }) {
  const { copied, copy } = useCopy();
  return (
    <div className="bg-white border border-[#e0e0e0] rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Link2 className="w-4 h-4 text-[#2271b1]" />
        <span className="text-[13px] font-bold text-[#1d2327]">Your Referral Link</span>
      </div>
      <div className="flex items-center gap-2 bg-[#f6f7f7] border border-[#e0e0e0] rounded-lg px-3 py-2">
        <span className="text-[11px] text-[#50575e] font-mono flex-1 truncate">{referralLink}</span>
        <button onClick={() => copy(referralLink)}
          className="shrink-0 p-1 text-[#2271b1] hover:bg-[#e7f3ff] rounded transition-colors">
          {copied ? <Check className="w-3.5 h-3.5 text-[#00a32a]" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <div className="flex gap-2">
        <button onClick={() => copy(referralLink)}
          className="flex-1 h-8 bg-[#2271b1] hover:bg-[#135e96] text-white text-[12px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5">
          <Copy className="w-3 h-3" /> Copy Link
        </button>
        <button onClick={() => copy(slug)}
          className="flex-1 h-8 border border-[#c3c4c7] text-[#1d2327] text-[12px] font-semibold rounded-lg hover:bg-[#f0f0f1] transition-colors flex items-center justify-center gap-1.5">
          <Tag className="w-3 h-3" /> Copy Slug
        </button>
      </div>
    </div>
  );
}

// ── Coupon Codes Card ─────────────────────────────────────────────────────────

function CouponsCard({ coupons }: { coupons: any[] }) {
  const { symbol } = useGlobalStore();
  const currency = symbol || "$";
  const { copy } = useCopy();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      toast.success(`Copied: ${code}`);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  if (!coupons || coupons.length === 0) return null;

  return (
    <div className="bg-white border border-[#e0e0e0] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#f0f0f1] flex items-center gap-2">
        <Ticket className="w-4 h-4 text-[#9a6700]" />
        <span className="text-[13px] font-bold text-[#1d2327]">Your Coupon Codes</span>
        <span className="ml-auto text-[11px] font-bold bg-[#fcf9e8] text-[#9a6700] px-2 py-0.5 rounded-full border border-[#9a6700]/20">
          {coupons.length}
        </span>
      </div>
      <div className="divide-y divide-[#f0f0f1]">
        {coupons.slice(0, 4).map((c: any) => (
          <div key={c.id} className="px-4 py-2.5 flex items-center gap-3">
            <span className="font-mono font-bold text-[13px] text-[#2271b1] bg-[#f0f6fc] px-2 py-0.5 rounded border border-[#2271b1]/20 flex-1">
              {c.code}
            </span>
            <span className="text-[11px] text-[#646970] shrink-0">
              {c.type === "PERCENTAGE" ? `${c.value}% off` : `${currency}${c.value} off`}
            </span>
            <button onClick={() => copyCode(c.code)}
              className="shrink-0 p-1.5 text-[#2271b1] hover:bg-[#e7f3ff] rounded transition-colors">
              {copiedCode === c.code
                ? <Check className="w-3.5 h-3.5 text-[#00a32a]" />
                : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        ))}
      </div>
      {coupons.length > 4 && (
        <div className="px-4 py-2 border-t border-[#f0f0f1]">
          <Link href="/affiliates?view=coupons" className="text-[12px] text-[#2271b1] hover:underline flex items-center gap-1">
            View all {coupons.length} coupons <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Tier Progress ─────────────────────────────────────────────────────────────

function TierCard({ tier }: { tier: any }) {
  const { formatPrice } = useGlobalStore();
  if (!tier) return null;

  return (
    <div className="bg-gradient-to-br from-[#1d2327] to-[#2c3338] rounded-xl p-4 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#72aee6] uppercase tracking-wider">Current Tier</p>
            <p className="text-[16px] font-black flex items-center gap-1.5 mt-0.5">
              <Trophy className="w-4 h-4 text-yellow-400" />
              {tier.currentTierName || "No Tier"}
            </p>
          </div>
          {!tier.isMaxTier && tier.nextTierName && (
            <div className="text-right">
              <p className="text-[10px] text-[#a7aaad]">Next</p>
              <p className="text-[13px] font-bold text-[#72aee6]">{tier.nextTierName}</p>
            </div>
          )}
        </div>

        {!tier.isMaxTier && (
          <div className="space-y-1.5">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(tier.progress ?? 0, 100)}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-[#a7aaad]">
              <span>{(tier.progress ?? 0).toFixed(0)}% complete</span>
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                {formatPrice(tier.amountNeeded)} more
              </span>
            </div>
          </div>
        )}

        {tier.isMaxTier && (
          <p className="text-[11px] text-yellow-300 flex items-center gap-1">
            <Zap className="w-3 h-3" /> Maximum tier — top commission rates!
          </p>
        )}
      </div>
    </div>
  );
}

// ── Conversion Funnel ─────────────────────────────────────────────────────────

function ConversionFunnel({ clicks, referrals, approved }: { clicks: number; referrals: number; approved: number }) {
  const steps = [
    { label: "Clicks",     value: clicks,    color: "bg-[#2271b1]" },
    { label: "Referrals",  value: referrals, color: "bg-amber-500" },
    { label: "Approved",   value: approved,  color: "bg-[#00a32a]" },
  ];
  const max = Math.max(clicks, 1);

  return (
    <div className="bg-white border border-[#e0e0e0] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-[#646970]" />
        <span className="text-[13px] font-bold text-[#1d2327]">Conversion Funnel</span>
      </div>
      <div className="space-y-2.5">
        {steps.map(s => (
          <div key={s.label} className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="font-semibold text-[#50575e]">{s.label}</span>
              <span className="font-black text-[#1d2327]">{s.value.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-[#f0f0f1] rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full transition-all duration-700", s.color)}
                style={{ width: `${(s.value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-[#f0f0f1]">
        <div className="flex justify-between text-[11px]">
          <span className="text-[#8c8f94]">Click → Order rate</span>
          <span className="font-bold text-[#1d2327]">
            {clicks > 0 ? ((referrals / clicks) * 100).toFixed(1) : 0}%
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Recent Referrals ──────────────────────────────────────────────────────────

function ReferralItem({ r }: { r: any }) {
  const { formatPrice, timezone } = useGlobalStore();

  const statusStyle: Record<string, string> = {
    PAID:     "bg-[#edfaef] text-[#00a32a] border-[#00a32a]/20",
    APPROVED: "bg-[#e7f3ff] text-[#2271b1] border-[#2271b1]/20",
    PENDING:  "bg-[#fcf9e8] text-[#9a6700] border-[#9a6700]/20",
    REJECTED: "bg-[#fcebec] text-[#d63638] border-[#d63638]/20",
  };

  const attrIcon: Record<string, React.ElementType> = {
    COUPON:   Ticket,
    LIFETIME: Users,
    COOKIE:   Link2,
  };
  const AttrIcon = attrIcon[r.attribution] || Link2;

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[#f0f0f1] last:border-0">
      <div className="w-8 h-8 rounded-lg bg-[#f0f6fc] border border-[#2271b1]/20 flex items-center justify-center shrink-0">
        <ShoppingBag className="w-3.5 h-3.5 text-[#2271b1]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-bold text-[#1d2327]">{r.description}</span>
          <span title={r.attribution}>
            <AttrIcon className="w-3 h-3 text-[#8c8f94]" />
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-[#8c8f94]">{formatTz(new Date(r.date), timezone, "MMM d, h:mm a")}</span>
          {r.orderAmount > 0 && (
            <span className="text-[10px] text-[#8c8f94]">· Order: {formatPrice(r.orderAmount)}</span>
          )}
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[13px] font-black text-[#00a32a]">+{formatPrice(r.amount)}</p>
        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase", statusStyle[r.status] || statusStyle.PENDING)}>
          {r.status}
        </span>
      </div>
    </div>
  );
}

// ── Active Rules ──────────────────────────────────────────────────────────────

function RulesCard({ rules }: { rules: any[] }) {
  const { formatPrice } = useGlobalStore();
  if (!rules || rules.length === 0) return null;
  return (
    <div className="bg-white border border-[#e0e0e0] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#f0f0f1] flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-500" />
        <span className="text-[13px] font-bold text-[#1d2327]">Active Bonus Rules</span>
        <span className="ml-auto text-[11px] font-bold bg-[#fcf9e8] text-[#9a6700] px-1.5 py-0.5 rounded-full border border-[#9a6700]/20">
          {rules.length}
        </span>
      </div>
      <div className="divide-y divide-[#f0f0f1]">
        {rules.slice(0, 3).map(rule => {
          const isBonus = rule.type === "BONUS_FIXED" || rule.type === "BONUS_PERCENTAGE";
          const isFixed = rule.type === "FIXED" || rule.type === "BONUS_FIXED";
          const reward = isFixed ? formatPrice(rule.value) : `${rule.value}%`;
          return (
            <div key={rule.id} className="px-4 py-3 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <Target className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-[#1d2327]">{rule.name}</p>
                <p className="text-[11px] text-[#646970] truncate">{rule.description}</p>
              </div>
              <span className={cn("text-[11px] font-black shrink-0 px-2 py-0.5 rounded border",
                isBonus ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-[#edfaef] text-[#00a32a] border-[#00a32a]/20"
              )}>
                {isBonus ? `+${reward}` : reward}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Active Contests ───────────────────────────────────────────────────────────

function ContestsCard({ contests }: { contests: any[] }) {
  const { formatPrice, timezone } = useGlobalStore();
  if (!contests || contests.length === 0) return null;

  const getPrize = (prizes: unknown) => {
    if (!prizes) return "TBD";
    if (typeof prizes === "object" && prizes !== null && "1st" in prizes)
      return `${formatPrice(Number((prizes as Record<string, string>)["1st"]))} (1st)`;
    return "View Details";
  };

  return (
    <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-xl overflow-hidden text-white">
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-yellow-300" />
        <span className="text-[13px] font-bold">Active Contests</span>
      </div>
      <div className="divide-y divide-white/10">
        {contests.slice(0, 2).map(c => (
          <div key={c.id} className="px-4 py-3">
            <p className="text-[12px] font-bold truncate">{c.title}</p>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[11px] text-violet-200">Prize: {getPrize(c.prizes)}</span>
              {c.endDate && (
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {formatTz(new Date(c.endDate), timezone, "MMM d")}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

interface Props {
  data: {
    stats: any;
    todayStats?: { clicks: number; referrals: number };
    pendingEarnings?: { amount: number; count: number };
    recentActivity: any[];
    chartData: any[];
    tierProgress?: any;
    activeRules?: any[];
    activeContests?: any[];
    announcements?: any[];
    coupons?: any[];
    referralLink?: string;
    slug?: string;
  };
  userName?: string | null;
  userStatus?: string;
}

export default function DashboardOverview({ data, userName, userStatus = "ACTIVE" }: Props) {
  const {
    stats, todayStats, pendingEarnings, recentActivity, chartData,
    tierProgress, activeRules = [], activeContests = [],
    announcements = [], coupons = [], referralLink = "", slug = "",
  } = data;

  const { formatPrice } = useGlobalStore();
  const [chartView, setChartView] = useState<"area" | "bar">("area");
  const firstName = (userName || "Partner").split(" ")[0];

  const totalEarnings  = n(stats.totalEarnings);
  const unpaidBalance  = n(stats.unpaidEarnings);
  const clicks         = n(stats.clicks);
  const referrals      = n(stats.referrals);
  const approved       = n(stats.approvedReferrals);
  const convRate       = n(stats.conversionRate);
  const pending        = n(pendingEarnings?.amount);
  const pendingCount   = n(pendingEarnings?.count);
  const todayClicks    = n(todayStats?.clicks);
  const todayReferrals = n(todayStats?.referrals);

  // 30-day trend
  const trend = (() => {
    if (!chartData || chartData.length < 14) return { dir: "neutral" as const, pct: 0 };
    const last7 = chartData.slice(-7).reduce((s: number, d: any) => s + n(d.earnings), 0);
    const prev7 = chartData.slice(-14, -7).reduce((s: number, d: any) => s + n(d.earnings), 0);
    if (prev7 === 0) return last7 > 0 ? { dir: "up" as const, pct: 100 } : { dir: "neutral" as const, pct: 0 };
    const pct = ((last7 - prev7) / prev7) * 100;
    return { dir: pct >= 0 ? "up" as const : "down" as const, pct: Math.abs(pct) };
  })();

  const statusColor: Record<string, string> = {
    ACTIVE:    "bg-[#edfaef] text-[#00a32a] border-[#00a32a]/30",
    PENDING:   "bg-[#fcf9e8] text-[#9a6700] border-[#9a6700]/30",
    SUSPENDED: "bg-[#fcebec] text-[#d63638] border-[#d63638]/30",
  };

  return (
    <div className="space-y-4 pb-10 animate-in fade-in slide-in-from-bottom-2 duration-300">

      {/* Announcement banner */}
      {announcements.length > 0 && <AnnouncementBanner announcements={announcements} />}

      {/* ── Row 1: Welcome + Quick Link ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Welcome card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-[#1d2327] to-[#2c3338] rounded-xl px-6 py-5 text-white relative overflow-hidden">
          <div className="absolute bottom-0 right-0 opacity-5 pointer-events-none">
            <TrendingUp className="w-48 h-48 -mr-8 -mb-8" />
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[22px] font-black">Hello, {firstName}!</h1>
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide", statusColor[userStatus] || statusColor.ACTIVE)}>
                  {userStatus}
                </span>
              </div>
              <p className="text-[13px] text-[#a7aaad]">
                Lifetime earnings:{" "}
                <span className="text-white font-bold">{formatPrice(totalEarnings)}</span>
                {" · "}Unpaid: <span className="text-[#72aee6] font-bold">{formatPrice(unpaidBalance)}</span>
              </p>
              {(todayClicks > 0 || todayReferrals > 0) && (
                <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                  <Activity className="w-3 h-3" />
                  Today: {todayClicks} click{todayClicks !== 1 ? "s" : ""} · {todayReferrals} referral{todayReferrals !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Link href="/affiliates?view=payouts"
                className="h-8 px-4 bg-[#2271b1] hover:bg-[#135e96] text-white text-[12px] font-bold rounded-lg transition-colors flex items-center gap-1.5 no-underline">
                <Wallet className="w-3.5 h-3.5" /> Withdraw
              </Link>
              <Link href="/affiliates?view=links"
                className="h-8 px-4 bg-white/10 hover:bg-white/20 text-white text-[12px] font-bold rounded-lg transition-colors flex items-center gap-1.5 no-underline">
                <Link2 className="w-3.5 h-3.5" /> My Links
              </Link>
            </div>
          </div>
        </div>

        {/* Quick link card */}
        <div className="lg:col-span-1">
          {referralLink ? (
            <QuickLinkCard referralLink={referralLink} slug={slug} />
          ) : (
            <TierCard tier={tierProgress} />
          )}
        </div>
      </div>

      {/* ── Row 2: KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="Unpaid Balance"  value={formatPrice(unpaidBalance)}  icon={Wallet}       color="blue"   todayBadge={undefined} />
        <KpiCard label="Total Earned"    value={formatPrice(totalEarnings)}  icon={DollarSign}   color="green"  trend={trend.dir !== "neutral" ? trend.dir : undefined} trendPct={trend.pct} />
        <KpiCard label="Pending"         value={formatPrice(pending)}        icon={Clock}        color="amber"  sub={pendingCount > 0 ? `${pendingCount} awaiting` : "nothing pending"} />
        <KpiCard label="Total Clicks"    value={clicks.toLocaleString()}     icon={MousePointer} color="violet" todayBadge={todayClicks} />
        <KpiCard label="Conversions"     value={referrals.toLocaleString()}  icon={Users}        color="rose"   sub={`${convRate.toFixed(1)}% rate · ${approved} approved`} todayBadge={todayReferrals} />
      </div>

      {/* ── Row 3: Chart + Sidebar ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Chart card */}
        <div className="xl:col-span-2 bg-white border border-[#e0e0e0] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-[#2271b1]" />
            <span className="text-[14px] font-bold text-[#1d2327]">Earnings Performance</span>
          </div>
          <EarningsChart data={chartData} view={chartView} setView={setChartView} />
        </div>

        {/* Right sidebar */}
        <div className="xl:col-span-1 space-y-4">
          {referralLink && <TierCard tier={tierProgress} />}
          <ConversionFunnel clicks={clicks} referrals={referrals} approved={approved} />
          <CouponsCard coupons={coupons} />
        </div>
      </div>

      {/* ── Row 4: Referrals + Rules/Contests ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent referrals */}
        <div className="bg-white border border-[#e0e0e0] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#f0f0f1] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#646970]" />
              <span className="text-[13px] font-bold text-[#1d2327]">Recent Referrals</span>
            </div>
            <Link href="/affiliates?view=reports"
              className="text-[11px] font-bold text-[#2271b1] hover:underline flex items-center gap-1 no-underline">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="px-4">
            {recentActivity.length === 0 ? (
              <div className="py-10 text-center text-[#8c8f94]">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-[13px]">No referrals yet</p>
                <p className="text-[11px] mt-1">Share your link to start earning</p>
              </div>
            ) : (
              recentActivity.map((r: any, i: number) => <ReferralItem key={r.id || i} r={r} />)
            )}
          </div>
        </div>

        {/* Rules + Contests */}
        <div className="space-y-4">
          {activeContests.length > 0 && <ContestsCard contests={activeContests} />}
          {activeRules.length > 0 && <RulesCard rules={activeRules} />}
          {activeRules.length === 0 && activeContests.length === 0 && (
            <div className="bg-white border border-[#e0e0e0] rounded-xl p-6 text-center text-[#8c8f94]">
              <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-[13px]">No active promotions</p>
              <p className="text-[11px] mt-1">Check back later for bonus rules and contests</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
