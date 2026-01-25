//app/(admin)/admin/settings/affiliate/_components/features/contests/contest-list.tsx

"use client";

import { useState, useTransition } from "react";
import { AffiliateContest } from "@prisma/client";
import { format, isAfter, isBefore } from "date-fns";
import { Trophy, Calendar, Plus, Trash2, Edit, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";

import ContestModal from "./contest-modal";
import { deleteContestAction } from "@/app/actions/admin/settings/affiliates/mutations/manage-contests";

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
    if (!confirm("Are you sure? This will hide the leaderboard from affiliates.")) return;
    
    startDelete(async () => {
      const result = await deleteContestAction(id);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    });
  };

  const getStatus = (start: Date, end: Date, isActive: boolean) => {
    if (!isActive) return { label: "Disabled", color: "bg-gray-100 text-gray-500" };
    const now = new Date();
    if (isAfter(now, end)) return { label: "Ended", color: "bg-red-50 text-red-600" };
    if (isBefore(now, start)) return { label: "Upcoming", color: "bg-blue-50 text-blue-600" };
    return { label: "Live Now", color: "bg-green-100 text-green-700 animate-pulse" };
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {/* Header */}
        <div className="p-4 border-b bg-gray-50 flex justify-end">
          <button
            onClick={handleCreate}
            className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-all"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Contest
          </button>
        </div>

        {/* List */}
        <div className="divide-y divide-gray-100">
          {initialContests.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Trophy className="mx-auto h-10 w-10 text-gray-300 mb-3" />
              <p>No active contests. Start a sales competition!</p>
            </div>
          ) : (
            initialContests.map((contest) => {
              const status = getStatus(new Date(contest.startDate), new Date(contest.endDate), contest.isActive);
              const prizes = contest.prizes as any;

              return (
                <div key={contest.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg border border-yellow-100">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{contest.title}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(contest.startDate), "MMM d")} - {format(new Date(contest.endDate), "MMM d, yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          {contest.criteria === "sales_amount" ? <TrendingUp className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                          Goal: {contest.criteria === "sales_amount" ? "Highest Revenue" : "Most Referrals"}
                        </span>
                      </div>
                      
                      {/* Prize Preview */}
                      <div className="mt-2 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded w-fit border">
                        🥇 1st: <span className="font-medium text-gray-900">{prizes?.firstPlace || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button 
                      onClick={() => handleEdit(contest)}
                      className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(contest.id)}
                      disabled={isDeleting}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                      title="Delete"
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