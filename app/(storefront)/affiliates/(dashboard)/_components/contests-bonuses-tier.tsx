//app/(storefront)/affiliates/_components/contests-bonuses-view.tsx

"use client";

import { useState, useEffect } from "react";
import { 
  Trophy, Zap, Calendar, Gift, Target, Star, 
  ShieldCheck, Crown, Medal, Loader2, User, X 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { format, isValid } from "date-fns";
import { getContestLeaderboard } from "@/app/actions/storefront/affiliates/_services/marketing-service";

// ✅ Dialog/Modal Components (Internal)
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  tierData: any; 
  contests: any[]; 
  bonuses: any[]; 
}

export default function ContestsBonusesTierView({ tierData, contests, bonuses }: Props) {
  // Tabs State
  const [activeTab, setActiveTab] = useState<"tier" | "contests" | "bonuses">("tier");
  
  // Leaderboard Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContest, setSelectedContest] = useState<{id: string, title: string} | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const { formatPrice } = useGlobalStore();

  // Helper for Date Safety
  const formatDateSafely = (dateString: any, formatStr: string) => {
      if (!dateString) return "TBD";
      const date = new Date(dateString);
      return isValid(date) ? format(date, formatStr) : "Invalid Date";
  };

  // ✅ Handle Opening Leaderboard
  const handleOpenLeaderboard = async (contestId: string, title: string) => {
      setSelectedContest({ id: contestId, title });
      setIsModalOpen(true);
      setLoadingLeaderboard(true);
      setLeaderboardData([]); // Reset previous data

      try {
          const res = await getContestLeaderboard(contestId);
          if (res.success) {
              setLeaderboardData(res.data);
          }
      } catch (error) {
          console.error("Failed to fetch leaderboard");
      } finally {
          setLoadingLeaderboard(false);
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      
      {/* 1. Header & Tabs */}
      <div className="bg-white border border-gray-200 rounded-2xl p-2 flex flex-col xl:flex-row items-center justify-between gap-4 sticky top-20 z-10 shadow-sm">
         <div className="px-4 py-2 text-center xl:text-left">
            <h1 className="text-xl font-bold text-gray-900">Performance Center</h1>
            <p className="text-xs text-gray-500">Track your rank, join contests, and unlock bonuses.</p>
         </div>
         
         {/* Tab Switcher */}
         <div className="flex p-1 bg-gray-100 rounded-xl w-full xl:w-auto overflow-x-auto">
            <button
                onClick={() => setActiveTab("tier")}
                className={cn(
                    "flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                    activeTab === "tier" 
                        ? "bg-white text-indigo-600 shadow-sm" 
                        : "text-gray-500 hover:text-gray-700"
                )}
            >
                <Crown className="w-4 h-4" /> My Tier
            </button>
            <button
                onClick={() => setActiveTab("contests")}
                className={cn(
                    "flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                    activeTab === "contests" 
                        ? "bg-white text-pink-600 shadow-sm" 
                        : "text-gray-500 hover:text-gray-700"
                )}
            >
                <Trophy className="w-4 h-4" /> Contests
            </button>
            <button
                onClick={() => setActiveTab("bonuses")}
                className={cn(
                    "flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                    activeTab === "bonuses" 
                        ? "bg-white text-yellow-600 shadow-sm" 
                        : "text-gray-500 hover:text-gray-700"
                )}
            >
                <Zap className="w-4 h-4" /> Bonuses
            </button>
         </div>
      </div>

      {/* 2. Content Area */}
      <div className="min-h-[400px]">

        {/* ================= TAB 1: TIER PROGRESS ================= */}
        {activeTab === "tier" && (
            <div className="space-y-6">
                {/* Main Tier Card */}
                <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
                        <div className="shrink-0 relative">
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center shadow-lg transform rotate-3">
                                <Medal className="w-12 h-12 text-white drop-shadow-md" />
                            </div>
                            <div className="absolute -bottom-3 -right-3 bg-white text-indigo-900 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                Current
                            </div>
                        </div>

                        <div className="flex-1 text-center md:text-left space-y-4 w-full">
                            <div>
                                <h2 className="text-3xl font-black tracking-tight">{tierData?.currentTierName || "Starter"}</h2>
                                <p className="text-indigo-200 text-sm mt-1">
                                    You are earning <span className="text-white font-bold">{tierData?.currentRate || 10}% commission</span> on every sale.
                                </p>
                            </div>

                            {!tierData?.isMaxTier ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-indigo-300">
                                        <span>Progress to {tierData?.nextTierName}</span>
                                        <span>{tierData?.progress?.toFixed(1)}%</span>
                                    </div>
                                    <div className="h-4 bg-black/40 rounded-full overflow-hidden border border-white/10">
                                        <div 
                                            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000"
                                            style={{ width: `${tierData?.progress || 0}%` }}
                                        />
                                    </div>
                                    <p className="text-sm text-indigo-200 flex items-center justify-center md:justify-start gap-2">
                                        <Target className="w-4 h-4" />
                                        Earn <span className="text-white font-bold">{formatPrice(tierData?.amountNeeded || 0)}</span> more to level up!
                                    </p>
                                </div>
                            ) : (
                                <div className="p-4 bg-white/10 rounded-xl border border-white/10 text-center">
                                    <p className="text-lg font-bold text-yellow-300">🎉 You are at the top level!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Benefits Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mb-4"><Star className="w-5 h-5" /></div>
                        <h3 className="font-bold text-gray-900">Higher Rates</h3>
                        <p className="text-sm text-gray-500 mt-1">Unlock up to 20% commission as you climb tiers.</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 mb-4"><ShieldCheck className="w-5 h-5" /></div>
                        <h3 className="font-bold text-gray-900">Longer Cookies</h3>
                        <p className="text-sm text-gray-500 mt-1">Get up to 90-day cookie duration on higher tiers.</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center text-pink-600 mb-4"><Gift className="w-5 h-5" /></div>
                        <h3 className="font-bold text-gray-900">Exclusive Swag</h3>
                        <p className="text-sm text-gray-500 mt-1">Top partners get branded merchandise and gifts.</p>
                    </div>
                </div>
            </div>
        )}
        
        {/* ================= TAB 2: CONTESTS ================= */}
        {activeTab === "contests" && (
            <div className="space-y-6">
                {!contests || contests.length === 0 ? (
                    <EmptyState icon={Trophy} title="No Active Contests" desc="There are no running contests right now." />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {contests.map((contest) => (
                            <div key={contest.id} className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
                                <div className="h-32 bg-gradient-to-r from-pink-600 to-rose-600 p-6 flex flex-col justify-center relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                                    <h3 className="text-xl font-bold text-white relative z-10">{contest.title}</h3>
                                    <div className="flex items-center gap-2 text-white/90 text-xs mt-2 relative z-10 bg-black/20 w-fit px-2 py-1 rounded-md">
                                        <Calendar className="w-3 h-3" />
                                        {formatDateSafely(contest.startDate, "MMM d")} - {formatDateSafely(contest.endDate, "MMM d, yyyy")}
                                    </div>
                                </div>
                                
                                <div className="p-6 space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-pink-50 text-pink-600 rounded-lg shrink-0"><Gift className="w-5 h-5" /></div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase">Prize Pool</p>
                                            <p className="text-lg font-bold text-gray-900">
                                                {typeof contest.prizes === 'object' && contest.prizes !== null
                                                    ? Object.entries(contest.prizes).map(([k, v]) => `${k}: $${v}`).join(", ") 
                                                    : `$${contest.prizes || 0}`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600 min-h-[80px]">
                                        {contest.description || "Compete with other partners to win big prizes!"}
                                    </div>
                                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100 flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Active
                                        </span>
                                        {/* ✅ BUTTON TRIGGERS INTERNAL MODAL */}
                                        <button 
                                            onClick={() => handleOpenLeaderboard(contest.id, contest.title)}
                                            className="text-sm font-bold text-pink-600 hover:underline flex items-center gap-1"
                                        >
                                            View Leaderboard &rarr;
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* ================= TAB 3: BONUSES ================= */}
        {activeTab === "bonuses" && (
            <div className="space-y-6">
                 {!bonuses || bonuses.length === 0 ? (
                    <EmptyState icon={Zap} title="No Active Bonuses" desc="Standard commission rates apply." />
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {bonuses.map((rule) => {
                            const bonusValue = rule.type === "FIXED" ? formatPrice(rule.value) : `${rule.value}%`;
                            return (
                                <div key={rule.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-yellow-100 shadow-sm hover:border-yellow-300 transition-colors relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-yellow-400" />
                                    <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl shrink-0"><Target className="w-6 h-6" /></div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-gray-900 text-lg">{rule.name}</h3>
                                            <span className="text-[10px] font-bold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded border border-yellow-200 uppercase">Active</span>
                                        </div>
                                        <p className="text-sm text-gray-600 max-w-2xl">{rule.description}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs font-bold text-gray-400 uppercase">Bonus Amount</p>
                                        <p className="text-2xl font-black text-gray-900 tracking-tight">{bonusValue}</p>
                                        <p className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block">
                                            on every {rule.triggerType?.toLowerCase().replace("_", " ")}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        )}

      </div>

      {/* ======================================================== */}
      {/* ✅ INTEGRATED LEADERBOARD MODAL */}
      {/* ======================================================== */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-white p-0 overflow-hidden rounded-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white text-center relative">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-white/70 hover:text-white"><X className="w-5 h-5"/></button>
                <Trophy className="w-10 h-10 mx-auto text-yellow-300 mb-2" />
                <DialogTitle className="text-lg font-bold">{selectedContest?.title}</DialogTitle>
                <p className="text-xs text-indigo-100 opacity-80">Top performing partners</p>
            </div>

            {/* List */}
            <div className="p-4 max-h-[400px] overflow-y-auto">
            {loadingLeaderboard ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
            ) : leaderboardData.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                    <p>No data available yet.</p>
                    <p className="text-xs">Be the first to get on the board!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {leaderboardData.map((user) => (
                    <div key={user.rank} className={cn(
                        "flex items-center justify-between p-3 rounded-xl border",
                        user.rank === 1 ? "bg-yellow-50 border-yellow-200" :
                        user.rank === 2 ? "bg-gray-50 border-gray-200" :
                        user.rank === 3 ? "bg-orange-50 border-orange-200" : "border-gray-100"
                    )}>
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-8 h-8 flex items-center justify-center font-bold rounded-full text-xs",
                                user.rank === 1 ? "bg-yellow-400 text-yellow-900" :
                                user.rank === 2 ? "bg-gray-300 text-gray-800" :
                                user.rank === 3 ? "bg-orange-300 text-orange-900" : "bg-gray-100 text-gray-500"
                            )}>
                                {user.rank <= 3 ? <Medal className="w-4 h-4" /> : user.rank}
                            </div>
                            <div className="flex items-center gap-2">
                                {user.avatar ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={user.avatar} className="w-8 h-8 rounded-full border" alt=""/>
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"><User className="w-4 h-4 text-gray-500"/></div>
                                )}
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{user.name}</p>
                                    <p className="text-[10px] text-gray-500">{user.salesCount} Sales</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-indigo-600">{formatPrice(user.score)}</p>
                            <p className="text-[10px] text-gray-400 uppercase">Points</p>
                        </div>
                    </div>
                    ))}
                </div>
            )}
            </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function EmptyState({ icon: Icon, title, desc }: any) {
    return (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-300 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 max-w-xs mt-1">{desc}</p>
        </div>
    )
}