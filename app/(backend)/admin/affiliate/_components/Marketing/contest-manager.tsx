// File: app/(backend)/admin/affiliate/_components/Marketing/contest-manager.tsx

"use client";

import { useState, useTransition } from "react";
import { format, isAfter, isBefore } from "date-fns";
import { Trophy, Calendar, Plus, Trash2, Edit, TrendingUp, Users, Medal, Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { deleteContestAction, upsertContestAction } from "@/app/actions/backend/affiliate/_services/engagement-service";

// ✅ FIXED: Replaced deleted Prisma type with JSON mapped interface
interface AffiliateContestData {
  id: string;
  title: string;
  description?: string;
  startDate: string | Date;
  endDate: string | Date;
  criteria: "sales_amount" | "referral_count";
  isActive: boolean;
  prizes: {
    firstPlace: string;
    secondPlace?: string;
    thirdPlace?: string;
  };
}

interface Props {
  initialContests: AffiliateContestData[];
}

export default function ContestList({ initialContests }: Props) {
  const { symbol } = useGlobalStore();
  const currency = symbol || " ";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AffiliateContestData | null>(null);
  const [isDeleting, startDelete] = useTransition();

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: AffiliateContestData) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure? This will hide the leaderboard.")) return;
    startDelete(async () => {
      const result = await deleteContestAction(id);
      if (result.success) {
          toast.success(result.message);
          window.location.reload(); 
      } else {
          toast.error(result.message);
      }
    });
  };

  const getStatus = (start: Date, end: Date, isActive: boolean) => {
    if (!isActive) return { label: "Disabled", color: "bg-[#f0f0f1] text-[#50575e] border-[#c3c4c7]" };
    const now = new Date();
    if (isAfter(now, end)) return { label: "Ended", color: "bg-[#fcf0f1] text-[#d63638] border-[#d63638]/30" };
    if (isBefore(now, start)) return { label: "Upcoming", color: "bg-[#f0f6fc] text-[#2271b1] border-[#2271b1]/30" };
    return { label: "Live Now", color: "bg-[#f0f6fc] text-[#00a32a] border-[#00a32a]/30" }; // Green
  };

  return (
    <div className="font-sans text-[#1d2327]">
      
      {/* WP Admin Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-4">
        <div>
          <h1 className="text-[22px] font-normal text-[#1d2327] m-0 flex items-center gap-2">
             <Trophy className="w-5 h-5 text-[#50575e]" /> Sales Contests
          </h1>
          <p className="text-[13px] text-[#50575e] m-0">Gamify performance with leaderboards and prizes.</p>
        </div>
        <button 
            onClick={handleCreate} 
            className="flex items-center gap-1.5 border border-[#2271b1] bg-[#2271b1] text-white px-3 py-1 text-[13px] rounded-sm hover:bg-[#135e96] hover:border-[#135e96] transition-colors cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Add New Contest
        </button>
      </div>

      <div className="bg-white border border-[#c3c4c7] shadow-sm">
        <div className="divide-y divide-[#f0f0f1]">
          {initialContests.length === 0 ? (
            <div className="p-12 text-center text-[#50575e] flex flex-col items-center bg-[#f6f7f7]">
              <Trophy className="h-8 w-8 text-[#c3c4c7] mb-2" />
              <p className="text-[13px] m-0">No active contests found.</p>
            </div>
          ) : (
            initialContests.map((contest) => {
              const status = getStatus(new Date(contest.startDate), new Date(contest.endDate), contest.isActive);
              const prizes = contest.prizes;

              return (
                <div key={contest.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#f6f7f7] transition-colors group">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-[#fcf9e8] text-[#8a6d3b] rounded-sm border border-[#f0b849] shrink-0">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-[#1d2327] text-[14px] m-0">{contest.title}</h3>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-bold uppercase border ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      
                      <div className="text-[12px] text-[#50575e] mt-1 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1 bg-[#f0f0f1] px-1.5 py-0.5 rounded-sm border border-[#c3c4c7]">
                          <Calendar className="w-3 h-3 text-[#8c8f94]" />
                          {format(new Date(contest.startDate), "MMM d")} - {format(new Date(contest.endDate), "MMM d, yyyy")}
                        </span>
                        <span className="flex items-center gap-1 bg-[#f0f0f1] px-1.5 py-0.5 rounded-sm border border-[#c3c4c7]">
                          {contest.criteria === "sales_amount" ? <TrendingUp className="w-3 h-3 text-[#8c8f94]" /> : <Users className="w-3 h-3 text-[#8c8f94]" />}
                          Win by: {contest.criteria === "sales_amount" ? "Highest Revenue" : "Referral Count"}
                        </span>
                      </div>
                      
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[11px] font-bold text-[#8a6d3b] flex items-center gap-1">
                            <Medal className="w-3 h-3" /> 1st Prize:
                        </span>
                        <span className="text-[12px] font-semibold text-[#1d2327] bg-[#fcf9e8] px-1.5 py-0.5 rounded-sm border border-[#f0b849]/50">
                            {prizes?.firstPlace || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(contest)}
                      className="text-[#2271b1] hover:underline text-[12px] px-2 py-1"
                    >
                      Edit
                    </button>
                    <span className="text-[#c3c4c7]">|</span>
                    <button 
                      onClick={() => handleDelete(contest.id)}
                      disabled={isDeleting}
                      className="text-[#d63638] hover:underline text-[12px] px-2 py-1 disabled:opacity-50"
                    >
                      Trash
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {isModalOpen && (
        <ContestModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          initialData={editingItem} 
        />
      )}
    </div>
  );
}

// --- SUB COMPONENT: WP STYLE MODAL ---

function ContestModal({ isOpen, onClose, initialData }: any) {
    const [isPending, startTransition] = useTransition();
    const { register, handleSubmit } = useForm({
        defaultValues: {
            id: initialData?.id,
            title: initialData?.title || "",
            description: initialData?.description || "",
            startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split("T")[0] : "",
            endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().split("T")[0] : "",
            criteria: initialData?.criteria || "sales_amount",
            isActive: initialData?.isActive ?? true,
            prizes: {
                firstPlace: initialData?.prizes?.firstPlace || "",
                secondPlace: initialData?.prizes?.secondPlace || "",
                thirdPlace: initialData?.prizes?.thirdPlace || ""
            }
        }
    });
    
    const { symbol } = useGlobalStore(); 
    const currency = symbol || " ";
    
    const onSubmit = (data: any) => {
        startTransition(async () => {
            const res = await upsertContestAction(data);
            if(res.success) {
                toast.success(res.message);
                onClose();
                window.location.reload(); // Refresh to update JSON list
            } else {
                toast.error(res.message);
            }
        });
    };

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 font-sans text-[#1d2327]">
            <div className="bg-[#f0f0f1] border border-[#c3c4c7] shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
                <div className="px-4 py-3 border-b border-[#c3c4c7] flex justify-between items-center bg-white shrink-0">
                    <h3 className="text-[14px] font-semibold text-[#1d2327] m-0">{initialData ? "Edit Contest" : "Create Contest"}</h3>
                    <button onClick={onClose} className="text-[#50575e] hover:text-[#d63638] focus:outline-none"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="overflow-y-auto p-4 bg-white">
                    <form id="contest-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Title</label>
                            <input {...register("title", { required: true })} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1.5 text-[13px] focus:border-[#2271b1] outline-none" placeholder="e.g. October Sales Challenge" />
                        </div>

                        <div className="border border-[#c3c4c7] p-3 bg-[#f6f7f7] grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[12px] font-semibold text-[#50575e] block mb-1">Start Date</label>
                                <input type="date" {...register("startDate", { required: true })} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1.5 text-[13px] outline-none bg-white" />
                            </div>
                            <div>
                                <label className="text-[12px] font-semibold text-[#50575e] block mb-1">End Date</label>
                                <input type="date" {...register("endDate", { required: true })} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1.5 text-[13px] outline-none bg-white" />
                            </div>
                        </div>

                        <div>
                            <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Winning Criteria</label>
                            <select {...register("criteria")} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1.5 text-[13px] bg-white focus:border-[#2271b1] outline-none">
                                <option value="sales_amount">Highest Total Revenue ({currency})</option>
                                <option value="referral_count">Most Sales (Count)</option>
                            </select>
                        </div>

                        <div className="border border-[#f0b849] p-4 bg-[#fcf9e8]">
                            <h4 className="text-[13px] font-semibold text-[#8a6d3b] m-0 mb-3 flex items-center gap-1.5">
                                <Trophy className="w-4 h-4" /> Prizes
                            </h4>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🥇</span>
                                    <input {...register("prizes.firstPlace", { required: true })} className="flex-1 border border-[#c3c4c7] rounded-sm px-2 py-1 text-[13px] focus:border-[#2271b1] outline-none" placeholder="1st Place Reward" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🥈</span>
                                    <input {...register("prizes.secondPlace")} className="flex-1 border border-[#c3c4c7] rounded-sm px-2 py-1 text-[13px] focus:border-[#2271b1] outline-none" placeholder="2nd Place (Optional)" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🥉</span>
                                    <input {...register("prizes.thirdPlace")} className="flex-1 border border-[#c3c4c7] rounded-sm px-2 py-1 text-[13px] focus:border-[#2271b1] outline-none" placeholder="3rd Place (Optional)" />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <input type="checkbox" id="isActive" {...register("isActive")} className="w-4 h-4 rounded-sm border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]" />
                            <label htmlFor="isActive" className="text-[13px] text-[#1d2327] cursor-pointer">Contest is Live and visible</label>
                        </div>
                    </form>
                </div>

                <div className="p-3 border-t border-[#c3c4c7] bg-[#f0f0f1] flex justify-end gap-2 shrink-0">
                    <button type="button" onClick={onClose} className="px-3 py-1.5 border border-[#8c8f94] bg-[#f0f0f1] text-[#2c3338] text-[13px] rounded-sm hover:bg-[#e6e6e6]">Cancel</button>
                    <button type="submit" form="contest-form" disabled={isPending} className="flex items-center gap-1.5 px-4 py-1.5 border border-[#2271b1] bg-[#2271b1] text-white text-[13px] rounded-sm hover:bg-[#135e96] disabled:opacity-50">
                        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save Contest
                    </button>
                </div>
            </div>
        </div>
    );
}