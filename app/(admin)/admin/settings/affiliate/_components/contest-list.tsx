// File: app/(admin)/admin/settings/affiliate/_components/contest-list.tsx

"use client";

import { useState, useTransition } from "react";
import { AffiliateContest } from "@prisma/client";
import { format, isAfter, isBefore } from "date-fns";
import { Trophy, Calendar, Plus, Trash2, Edit, TrendingUp, Users, Medal, Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

// ✅ Correct Import Path
// ✅ Use Named Imports
import { deleteContestAction, upsertContestAction } from "@/app/actions/admin/settings/affiliates/_services/contest-service";

interface Props {
  initialContests: AffiliateContest[];
}

export default function ContestList({ initialContests }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AffiliateContest | null>(null);
  const [isDeleting, startDelete] = useTransition();

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: AffiliateContest) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure? This will hide the leaderboard.")) return;
    startDelete(async () => {
      // ✅ Call Service Method
      const result = await deleteContestAction(id);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    });
  };

  const getStatus = (start: Date, end: Date, isActive: boolean) => {
    if (!isActive) return { label: "Disabled", color: "bg-gray-100 text-gray-500 border-gray-200" };
    const now = new Date();
    if (isAfter(now, end)) return { label: "Ended", color: "bg-red-50 text-red-600 border-red-100" };
    if (isBefore(now, start)) return { label: "Upcoming", color: "bg-blue-50 text-blue-600 border-blue-100" };
    return { label: "Live Now", color: "bg-green-50 text-green-700 border-green-100 animate-pulse" };
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-gray-900">Sales Contests</h3>
            <p className="text-xs text-gray-500">Gamify performance with leaderboards and prizes.</p>
          </div>
          <button
            onClick={handleCreate}
            className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-all shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Contest
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {initialContests.length === 0 ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
              <Trophy className="h-10 w-10 text-gray-300 mb-3" />
              <p>No active contests.</p>
            </div>
          ) : (
            initialContests.map((contest) => {
              const status = getStatus(new Date(contest.startDate), new Date(contest.endDate), contest.isActive);
              const prizes = contest.prizes as any;

              return (
                <div key={contest.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/80 transition-all group">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl border border-yellow-100 shadow-sm shrink-0">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900">{contest.title}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-500 mt-1 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded border">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(contest.startDate), "MMM d")} - {format(new Date(contest.endDate), "MMM d, yyyy")}
                        </span>
                        <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded border">
                          {contest.criteria === "sales_amount" ? <TrendingUp className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                          Win by: {contest.criteria === "sales_amount" ? "Highest Revenue" : "Referral Count"}
                        </span>
                      </div>
                      
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs font-bold text-yellow-600 flex items-center gap-1">
                            <Medal className="w-3 h-3" /> 1st Prize:
                        </span>
                        <span className="text-xs font-medium text-gray-900 bg-yellow-50/50 px-2 py-0.5 rounded border border-yellow-100">
                            {prizes?.firstPlace || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(contest)}
                      className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(contest.id)}
                      disabled={isDeleting}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
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
    </>
  );
}

// --- SUB COMPONENT: MODAL ---

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

    const onSubmit = (data: any) => {
        startTransition(async () => {
            // ✅ Call Service Method
            const res = await upsertContestAction(data);
            if(res.success) {
                toast.success(res.message);
                onClose();
            } else {
                toast.error(res.message);
            }
        });
    };

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/50 shrink-0">
                    <h3 className="font-bold text-gray-900">{initialData ? "Edit Contest" : "Create Contest"}</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-500 hover:text-black" /></button>
                </div>
                
                <div className="overflow-y-auto p-6">
                    <form id="contest-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase">Title</label>
                            <input {...register("title", { required: true })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none" placeholder="e.g. October Sales Challenge" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 uppercase">Start Date</label>
                                <input type="date" {...register("startDate", { required: true })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 uppercase">End Date</label>
                                <input type="date" {...register("endDate", { required: true })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase">Winning Criteria</label>
                            <select {...register("criteria")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-black/5 outline-none">
                                <option value="sales_amount">Highest Total Revenue ($)</option>
                                <option value="referral_count">Most Sales (Count)</option>
                            </select>
                        </div>

                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 space-y-3">
                            <h4 className="text-xs font-bold text-yellow-800 uppercase flex items-center gap-2">
                                <Trophy className="w-3 h-3" /> Prizes
                            </h4>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🥇</span>
                                    <input {...register("prizes.firstPlace", { required: true })} className="flex-1 border border-yellow-200 rounded-md px-3 py-1.5 text-sm focus:border-yellow-400 outline-none" placeholder="1st Place Reward" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🥈</span>
                                    <input {...register("prizes.secondPlace")} className="flex-1 border border-yellow-200 rounded-md px-3 py-1.5 text-sm focus:border-yellow-400 outline-none" placeholder="2nd Place (Optional)" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🥉</span>
                                    <input {...register("prizes.thirdPlace")} className="flex-1 border border-yellow-200 rounded-md px-3 py-1.5 text-sm focus:border-yellow-400 outline-none" placeholder="3rd Place (Optional)" />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input type="checkbox" id="isActive" {...register("isActive")} className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black" />
                            <label htmlFor="isActive" className="text-sm font-medium text-gray-900 cursor-pointer">Contest is Live and visible</label>
                        </div>
                    </form>
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 shrink-0">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                    <button type="submit" form="contest-form" disabled={isPending} className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50">
                        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Save Contest
                    </button>
                </div>
            </div>
        </div>
    );
}