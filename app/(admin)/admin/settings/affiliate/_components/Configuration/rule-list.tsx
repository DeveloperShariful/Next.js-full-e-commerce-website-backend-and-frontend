// File: app/(admin)/admin/settings/affiliate/_components/Configuration/rule-list.tsx

"use client";

import { useState, useTransition } from "react";
import { AffiliateCommissionRule } from "@prisma/client";
import { Edit, Trash2, GripVertical, Plus, Calculator, CalendarClock, Ban, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import RuleModal from "./rule-modal";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { deleteRuleAction } from "@/app/actions/admin/settings/affiliate/_services/commition-rule-service";

interface Props {
  initialRules: AffiliateCommissionRule[];
}

export default function RuleList({ initialRules }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AffiliateCommissionRule | null>(null);
  const [isDeleting, startDelete] = useTransition();
  const { symbol } = useGlobalStore(); 

  const handleCreate = () => {
    setEditingRule(null);
    setIsModalOpen(true);
  };

  const handleEdit = (rule: AffiliateCommissionRule) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure? This will delete the logic rule permanently.")) return;
    
    startDelete(async () => {
      // ✅ Call Service Method Directly
      const result = await deleteRuleAction(id);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    });
  };

  // Helper to visualize JSON Logic
  const renderConditions = (conditions: any) => {
    if (!conditions || typeof conditions !== 'object') return <span className="text-gray-400">Always applies</span>;
    
    const chips = [];
    if (conditions.minOrderAmount) chips.push(`Order > ${symbol}${conditions.minOrderAmount}`);
    if (conditions.customerType) chips.push(conditions.customerType === 'NEW' ? 'New Customers' : 'Returning');
    if (conditions.categoryIds?.length) chips.push(`Specific Categories`);
    
    return (
        <div className="flex flex-wrap gap-1">
            {chips.map((c, i) => (
                <span key={i} className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                    {c}
                </span>
            ))}
            {chips.length === 0 && <span className="text-[10px] text-gray-400 italic">No specific conditions</span>}
        </div>
    );
  };

  const getActionLabel = (action: any) => {
      const val = action?.value || 0;
      const type = action?.type === "FIXED" ? symbol : "%";
      return action?.type === "FIXED" ? `${type}${val}` : `${val}${type}`;
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {/* Actions Header */}
        <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
          <div>
             <h3 className="font-semibold text-gray-900">Dynamic Commission Rules</h3>
             <p className="text-xs text-gray-500">Higher priority rules execute first.</p>
          </div>
          <button
            onClick={handleCreate}
            className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-all shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Rule
          </button>
        </div>

        {/* List */}
        <div className="divide-y divide-gray-100">
          {initialRules.length === 0 ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
              <Calculator className="h-10 w-10 text-gray-300 mb-3" />
              <p>No custom rules defined.</p>
              <p className="text-xs text-gray-400">The system will use Tier defaults.</p>
            </div>
          ) : (
            initialRules.map((rule, index) => (
              <div 
                key={rule.id} 
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-gray-50/80 transition-all gap-4"
              >
                {/* Left: Info */}
                <div className="flex items-start gap-3">
                  <div className="mt-1 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 p-1">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{rule.name}</span>
                      {rule.isActive ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Ban className="w-3.5 h-3.5 text-gray-300" />
                      )}
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border">
                        Priority: {rule.priority}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                        Reward: {getActionLabel(rule.action)}
                      </span>
                      <div className="h-4 w-px bg-gray-200"></div>
                      {renderConditions(rule.conditions)}
                    </div>
                    
                    {rule.endDate && (
                        <div className="flex items-center gap-1 text-[10px] text-orange-600 bg-orange-50 px-2 py-0.5 rounded w-fit">
                            <CalendarClock className="w-3 h-3"/>
                            Ends: {format(new Date(rule.endDate), "dd MMM yyyy")}
                        </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity self-end sm:self-center">
                  <button
                    onClick={() => handleEdit(rule)}
                    className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    disabled={isDeleting}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isModalOpen && (
        <RuleModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialData={editingRule}
        />
      )}
    </>
  );
}