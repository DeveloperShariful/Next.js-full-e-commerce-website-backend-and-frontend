//app/(admin)/admin/settings/affiliate/_components/features/contests/contest-modal.tsx

"use client";

import { useForm } from "react-hook-form";
import { useTransition, useEffect } from "react";
import { toast } from "sonner";
import { X, Loader2, Save, Trophy } from "lucide-react";
import { AffiliateContest } from "@prisma/client";

import { upsertContest } from "@/app/actions/admin/settings/affiliates/mutations/manage-contests";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData?: AffiliateContest | null;
}

interface ContestFormValues {
  id?: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  criteria: "sales_amount" | "referral_count";
  isActive: boolean;
  prizes: {
    firstPlace: string;
    secondPlace?: string;
    thirdPlace?: string;
  };
}

export default function ContestModal({ isOpen, onClose, initialData }: Props) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<ContestFormValues>({
    defaultValues: {
      title: "",
      criteria: "sales_amount",
      isActive: true,
      prizes: { firstPlace: "$100 Bonus", secondPlace: "", thirdPlace: "" }
    },
  });

  useEffect(() => {
    if (initialData) {
      const prizes = initialData.prizes as any;
      form.reset({
        id: initialData.id,
        title: initialData.title,
        description: initialData.description || "",
        startDate: new Date(initialData.startDate).toISOString().split("T")[0],
        endDate: new Date(initialData.endDate).toISOString().split("T")[0],
        criteria: initialData.criteria as any,
        isActive: initialData.isActive,
        prizes: {
          firstPlace: prizes?.firstPlace || "",
          secondPlace: prizes?.secondPlace || "",
          thirdPlace: prizes?.thirdPlace || "",
        },
      });
    } else {
      form.reset({
        title: "",
        criteria: "sales_amount",
        isActive: true,
        prizes: { firstPlace: "", secondPlace: "", thirdPlace: "" }
      });
    }
  }, [initialData, form, isOpen]);

  const onSubmit = (data: ContestFormValues) => {
    startTransition(async () => {
      const result = await upsertContest(data);
      if (result.success) {
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.message);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {initialData ? "Edit Contest" : "Create Contest"}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[80vh] p-6">
          <form id="contest-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            
            {/* Basic Info */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Contest Title</label>
              <input
                {...form.register("title", { required: "Title is required" })}
                placeholder="e.g. Summer Sales Challenge"
                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none"
              />
              {form.formState.errors.title && <p className="text-red-500 text-xs">{form.formState.errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Start Date</label>
                <input type="date" {...form.register("startDate", { required: true })} className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">End Date</label>
                <input type="date" {...form.register("endDate", { required: true })} className="w-full border rounded-md px-3 py-2 text-sm" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Winning Criteria</label>
              <select {...form.register("criteria")} className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                <option value="sales_amount">Highest Total Sales Amount ($)</option>
                <option value="referral_count">Highest Number of Sales (Count)</option>
              </select>
            </div>

            {/* Prizes Section */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 space-y-3">
              <h4 className="text-xs font-bold text-yellow-700 uppercase tracking-wider flex items-center gap-2">
                <Trophy className="w-3 h-3" /> Rewards
              </h4>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm w-8">🥇</span>
                  <input {...form.register("prizes.firstPlace", { required: "1st place prize required" })} placeholder="1st Prize (e.g. $500 Cash)" className="flex-1 border rounded-md px-3 py-1.5 text-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm w-8">🥈</span>
                  <input {...form.register("prizes.secondPlace")} placeholder="2nd Prize (Optional)" className="flex-1 border rounded-md px-3 py-1.5 text-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm w-8">🥉</span>
                  <input {...form.register("prizes.thirdPlace")} placeholder="3rd Prize (Optional)" className="flex-1 border rounded-md px-3 py-1.5 text-sm" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input 
                type="checkbox" 
                id="isActive"
                className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black" 
                {...form.register("isActive")} 
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-900 cursor-pointer">
                Contest is Live
              </label>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button
            type="submit"
            form="contest-form"
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {initialData ? "Update Contest" : "Create Contest"}
          </button>
        </div>
      </div>
    </div>
  );
}